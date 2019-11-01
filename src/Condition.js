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
const url = require('url');
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
    express: (items, req) => items.reduce((prev, item) => prev || item.evaluate(req), false),
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
    express: (items, req) => items.reduce((prev, item) => {
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
  return;
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
    express: (item, req) => !item.evaluate(req),
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
    return this._entry.express(this._items, req);
  }

  toJSON() {
    return this._entry.jsonGen(this._items);
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
    const { vcl, prefixCompose } = this._prop;
    const name = typeof vcl === 'function' ? vcl(this) : vcl;
    const quote = this._prop.type === 'string' ? '"' : '';
    let value = this._value;
    let op = this._op;

    if (quote === '"' && !op) {
      // substring-start
      if (prefixCompose) {
        return prefixCompose(name, value);
      }
      value = `^${value}`;
      op = '~';
    }
    if (!op || op === '=') {
      // operand defaults to equal
      op = '==';
    }
    return `${name} ${op} ${quote}${value}${quote}`;
  }

  getSubPath() {
    const quote = this._prop.type === 'string' ? '"' : '';
    if (quote === '"' && !this._op) {
      // substring-start
      const { getSubPath } = this._prop;
      if (getSubPath) {
        return getSubPath(this._value);
      }
    }
    return '';
  }

  /**
   * Return a VCL conditional clause that will assign the calculated base path
   * to a request parameter.
   *
   * @param {String} paramName request parameter name to assign the base path to
   */
  toVCLPath(paramName) {
    const subPath = this.getSubPath();
    if (subPath) {
      return `if ${this.toVCL()} {
  set req.http.${paramName} = "${subPath}";
  return;
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

  evaluate(req) {
    if (!this._prop.express) {
      return true;
    }
    const actual = this._prop.express(req, this);
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
          const { prefixMatch } = this._prop;
          return prefixMatch ? prefixMatch(actual, value) : actual.startsWith(value);
        }
        return actual === value;
    }
  }

  get name() {
    return this._name;
  }

  get type() {
    return this._prop.type;
  }
}

/**
 * For URLs and URL paths, a substring match of '/foo' should actually
 * match '/foo' or '/foo/index.html' but not '/fooby'.
 *
 * We therefore add extra clauses in VCL or evaluate an extra condition.
 */

function urlPrefixCompose(name, value) {
  return `(${name} ~ "^${value}/" || ${name} == "${value}")`;
}

function urlPrefixMatch(actual, value) {
  if (actual === value || actual.startsWith(`${value}/`)) {
    const baseURL = url.parse(value).path;
    return baseURL !== '/' ? { baseURL } : true;
  }
  return false;
}

/**
 * Known properties
 */
const propertyMap = {
  url: {
    vcl: 'req.http.X-Full-URL',
    prefixCompose: (name, value) => {
      const uri = url.parse(value);
      if (uri.path === '/') {
        // root path, no composition necessary
        return `${name} ~ "^${value}"`;
      }
      return urlPrefixCompose(name, value);
    },
    getSubPath: (value) => {
      const uri = url.parse(value);
      if (uri.path !== '/') {
        return uri.path;
      }
      return '';
    },
    express: (req) => {
      if (req.headers && req.headers.host) {
        return `${req.protocol || 'http'}://${req.headers.host}${req.path || '/'}`;
      }
      return '';
    },
    prefixMatch: urlPrefixMatch,
    type: 'string',
    allowed_ops: '=~',
  },
  'url.hostname': {
    vcl: 'req.http.host',
    express: (req) => req.hostname,
    type: 'string',
    allowed_ops: '=~',
  },
  'url.path': {
    vcl: 'req.url.path',
    prefixCompose: urlPrefixCompose,
    getSubPath: (value) => value,
    express: (req) => req.path,
    prefixMatch: urlPrefixMatch,
    type: 'string',
    allowed_ops: '=~',
  },
  referer: {
    vcl: 'req.http.referer',
    express: (req) => req.get('referer'),
    type: 'string',
    allowed_ops: '=~',
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
    express: (req) => req.get('user-agent'),
    type: 'string',
    allowed_ops: '=~',
  },
  accept_language: {
    vcl: 'req.http.Accept-Language',
    express: (req) => req.get('accept-language'),
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
    express: () => new Date().getDay(),
    type: 'number',
    allowed_ops: '<=>',
  },
  time_date: {
    vcl: 'std.atoi(strftime({"%d"}, time.start))',
    express: () => new Date().getDate(),
    type: 'number',
    allowed_ops: '<=>',
  },
  time_hours: {
    vcl: 'std.atoi(strftime({"%H"}, time.start))',
    express: () => new Date().getHours(),
    type: 'number',
    allowed_ops: '<=>',
  },
  time_minutes: {
    vcl: 'std.atoi(strftime({"%M"}, time.start))',
    express: () => new Date().getMinutes(),
    type: 'number',
    allowed_ops: '<=>',
  },
  time_month: {
    vcl: 'std.atoi(strftime({"%m"}, time.start))',
    express: () => new Date().getMonth(),
    type: 'number',
    allowed_ops: '<=>',
  },
  time_year: {
    vcl: 'std.atoi(strftime({"%Y"}, time.start))',
    express: () => new Date().getFullYear(),
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
    express: (req, property) => req.params[property.name],
    allowed_ops: '~<=>',
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

  /* eslint-disable no-underscore-dangle */
  toFunction() {
    const self = this;
    return (req) => {
      if (self._top && self._top.evaluate) {
        return self._top.evaluate(req);
      }
      return true;
    };
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
