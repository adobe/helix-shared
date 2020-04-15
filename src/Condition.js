/*
 * Copyright 2019 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/* eslint-disable max-classes-per-file */
const { parse } = require('url');
const YAML = require('yaml');
const utils = require('./utils.js');

// To avoid forward referencing the transformer function
let transform;

/**
 * Determines how to transform children configuration based on the affix type.
 */
const configMapper = {
  prefix: (cfg) => transform(cfg),
  infix: (cfg) => cfg.map((child) => transform(child)),
};

/**
 * Determines how to compose VCL based on the affix type.
 */
const vclComposer = {
  prefix: (op) => (item) => `${op}(${item.toVCL()})`,
  infix: (op) => (items) => `(${items.map((item) => item.toVCL()).join(op)})`,
};

/**
 * Determines how to output JSON based on the affix type.
 */
const jsonGenarator = {
  prefix: (op) => (item) => {
    const json = {};
    json[op] = item.toJSON();
    return json;
  },
  infix: (op) => (items) => {
    const subs = [];
    items.forEach((item) => {
      subs.push(item.toJSON());
    });
    const json = {};
    json[op] = subs;
    return json;
  },
};

/**
 * Boolean conditions
 */
const booleanMap = {
  or: {
    mapper: configMapper.infix,
    jsonGen: jsonGenarator.infix('or'),
    vcl: vclComposer.infix(' || '),
    evaluate: (items, req) => items.reduce((prev, item) => prev || item.evaluate(req), false),
    vcl_path: (items, paramName) => items.reduce((prev, item) => {
      const clause = item.toVCLPath(paramName);
      if (clause) {
        prev.push(clause);
      }
      return prev;
    }, []).join(''),
  },
  and: {
    mapper: configMapper.infix,
    jsonGen: jsonGenarator.infix('and'),
    vcl: vclComposer.infix(' && '),
    evaluate: (items, req) => items.reduce((prev, item) => {
      if (!prev) {
        return false;
      }
      const result = item.evaluate(req);
      if (!result) {
        return false;
      }
      // preserve the term that has a baseURL
      return prev.baseURL ? prev : result;
    }, true),
    vcl_path: (items, paramName, vcl) => {
      const subpathItem = items.find((item) => item.getSubPath && item.getSubPath(paramName));
      if (subpathItem) {
        return `if ${vcl()} {
  set req.http.${paramName} = "${subpathItem.getSubPath(paramName)}";
}
`;
      }
      return '';
    },
  },
  not: {
    mapper: configMapper.prefix,
    jsonGen: jsonGenarator.prefix('not'),
    vcl: vclComposer.prefix(' !'),
    evaluate: (item, req) => !item.evaluate(req),
  },
};

class BooleanCondition {
  constructor(entry, cfg) {
    this._entry = entry;
    this._items = this._entry.mapper(cfg);
  }

  toVCL() {
    return this._entry.vcl(this._items);
  }

  /**
   * Return a VCL conditional clause that will assign the calculated base path
   * to a request parameter.
   *
   * @param {String} paramName request parameter name to assign the base path to
   */
  toVCLPath(paramName) {
    const vcl = this.toVCL.bind(this);
    return this._entry.vcl_path ? this._entry.vcl_path(this._items, paramName, vcl) : '';
  }

  evaluate(req) {
    return this._entry.evaluate(this._items, req);
  }

  toJSON() {
    return this._entry.jsonGen(this._items);
  }

  sticky() {
    const items = Array.isArray(this._items) ? this._items : [this._items];
    return items.some((item) => item.sticky());
  }
}

/**
 * PropertyCondition
 */
class PropertyCondition {
  constructor(prop, op, value, name, label) {
    if (op && prop.allowed_ops.indexOf(op) === -1) {
      throw new Error(`Property ${name} does not support operation: ${op}`);
    }

    this._prop = prop;
    this._op = op;
    this._value = value;
    this._name = name;
    this._label = label || name;
  }

  toVCL() {
    const { vcl } = this._prop;
    const name = typeof vcl === 'function' ? vcl(this) : vcl;
    const quote = this._prop.type === 'string' ? '"' : '';
    let value = this._value;
    let op = this._op;

    if (quote === '"' && !op) {
      // substring-start
      value = `^${value}`;
      op = '~';
    }
    if (!op || op === '=') {
      // operand defaults to equal
      op = '==';
    }
    return `${name} ${op} ${quote}${value}${quote}`;
  }

  // eslint-disable-next-line class-methods-use-this
  getSubPath() {
    return '';
  }

  /**
   * Return a VCL conditional clause that will assign the calculated base path
   * to a request parameter.
   *
   * @param {String|Function} param request parameter name to insert or function to invoke
   */
  toVCLPath(param) {
    const subPath = this.getSubPath();
    if (subPath) {
      if (typeof param === 'function') {
        return param(this.toVCL(), subPath);
      }
      return `if (${this.toVCL()}) {
  set req.http.${param} = "${subPath}";
}
`;
    }
    return '';
  }

  toJSON() {
    const json = {};
    const name = `${this._label}${this._op}`;
    json[name] = this._value;
    return json;
  }

  sticky() {
    return !!this._prop.sticky;
  }

  evaluate(req) {
    if (!this._prop.evaluate) {
      return true;
    }
    const actual = this._prop.evaluate(req, this);
    if (!actual) {
      return false;
    }

    const value = this._value;
    const { type } = this._prop;

    switch (this._op) {
      case '=':
        return actual === value;
      case '~':
        return !!actual.match(value);
      case '<':
        return actual < value;
      case '>':
        return actual > value;
      default:
        if (type === 'string') {
          return this.prefixMatch(actual, value);
        }
        return actual === value;
    }
  }

  // eslint-disable-next-line class-methods-use-this
  prefixMatch(actual, prefix) {
    return actual.startsWith(prefix);
  }

  get name() {
    return this._name;
  }

  get type() {
    return this._prop.type;
  }
}

/**
 * URLCondition
 */
class URLCondition extends PropertyCondition {
  constructor(prop, op, uri, value, name, label) {
    super(prop, op, value, name, label);

    this._uri = uri;
    this._vclProp = uri.path.indexOf('.') !== -1 ? 'req.url.path' : 'req.http.X-FullDirname';
  }

  getSubPath() {
    const { _op: op, _uri: { path } } = this;
    return (!op && path !== '/') ? path : '';
  }

  toVCL() {
    const { _op: op, _vclProp: name, _uri: { host, path } } = this;
    const vcl = [];

    if (host) {
      vcl.push(`req.http.host == "${host}"`);
    }
    if (path !== '/') {
      if (!op) {
        // substring-start
        vcl.push(`(${name} ~ "^${path}$" || ${name} ~ "^${path}/")`);
      } else {
        vcl.push(`${name} ${op === '=' ? '==' : op} "${path}"`);
      }
    }
    return vcl.join(' && ');
  }

  prefixMatch(actual, prefix) {
    const dir = prefix.replace(/\/+$/, '');
    if (actual === prefix || actual.startsWith(`${dir}/`)) {
      const { path } = this._uri;
      return path !== '/' ? { baseURL: path } : true;
    }
    return false;
  }
}

/**
 * Known properties
 */
const propertyMap = {
  url: (op, value, name) => new URLCondition({
    evaluate: (req) => `${req.protocol}://${req.headers.host}${req.path}`,
    type: 'string',
    allowed_ops: '=~',
  }, op, parse(value), value, name),
  'url.hostname': {
    vcl: 'req.http.host',
    evaluate: (req) => req.hostname,
    type: 'string',
    allowed_ops: '=~',
  },
  'url.path': (op, value, name) => new URLCondition({
    vcl: 'req.url.path',
    evaluate: (req) => req.path,
    type: 'string',
    allowed_ops: '=~',
  }, op, { path: value }, value, name),
  referer: {
    vcl: 'req.http.referer',
    evaluate: (req) => req.get('referer'),
    type: 'string',
    allowed_ops: '=~',
    sticky: true,
  },
  client_city: {
    vcl: 'client.geo.city',
    type: 'string',
    allowed_ops: '=~',
  },
  client_country_code: {
    vcl: 'client.geo.country_code',
    type: 'string',
    allowed_ops: '=~',
  },
  user_agent: {
    vcl: 'req.http.User-Agent',
    evaluate: (req) => req.get('user-agent'),
    type: 'string',
    allowed_ops: '=~',
  },
  accept_language: {
    vcl: 'req.http.Accept-Language',
    evaluate: (req) => req.get('accept-language'),
    type: 'string',
    allowed_ops: '=~',
  },
  client_lat: {
    vcl: 'client.geo.latitude',
    type: 'number',
    allowed_ops: '<=>',
  },
  client_lon: {
    vcl: 'client.geo.longitude',
    type: 'number',
    allowed_ops: '<=>',
  },
  client_gmt_offset: {
    vcl: 'client.geo.gmt_offset',
    type: 'number',
    allowed_ops: '<=>',
  },
  time_day: {
    vcl: 'std.atoi(strftime({"%w"}, time.start))',
    evaluate: () => new Date().getDay(),
    type: 'number',
    allowed_ops: '<=>',
  },
  time_date: {
    vcl: 'std.atoi(strftime({"%d"}, time.start))',
    evaluate: () => new Date().getDate(),
    type: 'number',
    allowed_ops: '<=>',
  },
  time_hours: {
    vcl: 'std.atoi(strftime({"%H"}, time.start))',
    evaluate: () => new Date().getHours(),
    type: 'number',
    allowed_ops: '<=>',
  },
  time_minutes: {
    vcl: 'std.atoi(strftime({"%M"}, time.start))',
    evaluate: () => new Date().getMinutes(),
    type: 'number',
    allowed_ops: '<=>',
  },
  time_month: {
    vcl: 'std.atoi(strftime({"%m"}, time.start))',
    evaluate: () => new Date().getMonth(),
    type: 'number',
    allowed_ops: '<=>',
  },
  time_year: {
    vcl: 'std.atoi(strftime({"%Y"}, time.start))',
    evaluate: () => new Date().getFullYear(),
    type: 'number',
    allowed_ops: '<=>',
  },
  url_param: {
    vcl: (property) => {
      const vcl = `subfield(req.url.qs, "${property.name}", "&")`;
      if (property.type === 'number') {
        return `std.atoi(${vcl})`;
      }
      return vcl;
    },
    evaluate: (req, property) => req.params[property.name],
    allowed_ops: '~<=>',
    sticky: true,
  },
};

/**
 * StringCondition class
 */
class StringCondition {
  constructor(s) {
    this._s = s;
  }

  toVCL() {
    return this._s;
  }

  toJSON() {
    return this._s;
  }

  // eslint-disable-next-line class-methods-use-this
  sticky() {
    return true;
  }
}

/**
 * Condition class
 */
class Condition {
  constructor(cfg) {
    if (typeof cfg === 'string') {
      this._top = new StringCondition(cfg);
    } else {
      this._top = cfg ? transform(cfg) : null;
    }
  }

  toVCL() {
    return this._top ? this._top.toVCL() : '';
  }

  toVCLPath(paramName = 'X-Base') {
    if (this._top && this._top.toVCLPath) {
      return this._top.toVCLPath(paramName);
    }
    return '';
  }

  match(req) {
    if (this._top && this._top.evaluate) {
      req.headers = req.headers || {};
      req.params = req.params || {};
      req.protocol = req.protocol || 'http';
      req.path = req.path || '/';

      return this._top.evaluate(req);
    }
    return true;
  }

  sticky() {
    if (this._top && this._top.sticky) {
      return this._top.sticky();
    }
    return false;
  }

  toJSON(opts) {
    const json = this._top ? this._top.toJSON() : null;
    if (json && opts && opts.minimal) {
      return utils.pruneEmptyValues(json);
    }
    return json;
  }

  toYAMLNode() {
    const json = this.toJSON({ minimal: true });
    return json ? YAML.createNode(json) : null;
  }
}

// Now define our transformer
transform = (cfg) => {
  // We assume the first non-inherited key contains our property
  let name = Object.keys(cfg)[0];
  const value = cfg[name];

  const entry = booleanMap[name];
  if (entry) {
    return new BooleanCondition(entry, value);
  }

  const last = name.substr(-1);
  let op = '';
  if (last.match(/[<=>~]/)) {
    name = name.slice(0, name.length - 1);
    op = last;
  }
  let prop = propertyMap[name];
  if (prop) {
    if (typeof prop === 'function') {
      return prop(op, value, name);
    }
    return new PropertyCondition(prop, op, value, name);
  }
  const match = name.match(/^url_param\.(.+)$/);
  if (match) {
    prop = { type: op === '<' || op === '>' ? 'number' : 'string', ...propertyMap.url_param };
    return new PropertyCondition(prop, op, value, match[1], name);
  }
  throw new Error(`Unknown property: ${name}`);
};

module.exports = Condition;
