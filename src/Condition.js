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

// To avoid forward referencing the transformer function
let transform;

/**
 * Determines how to transform children configuration based on the affix type.
 */
const configMapper = {
  prefix: cfg => transform(cfg),
  infix: cfg => cfg.map(child => transform(child)),
};

/**
 * Determines how to compose VCL based on the affix type.
 */
const vclComposer = {
  prefix: op => item => `${op}(${item.toVCL()})`,
  infix: op => items => `(${items.map(item => item.toVCL()).join(op)})`,
};

/**
 * Boolean conditions
 */
const booleanMap = {
  or: {
    mapper: configMapper.infix,
    vcl: vclComposer.infix(' || '),
    express: (items, req) => items.reduce((result, item) => result || item.evaluate(req), false),
  },
  and: {
    mapper: configMapper.infix,
    vcl: vclComposer.infix(' && '),
    express: (items, req) => items.reduce((result, item) => result && item.evaluate(req), true),
  },
  not: {
    mapper: configMapper.prefix,
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
    return this._entry.vcl(this._items, this._entry.op);
  }

  evaluate(req) {
    return this._entry.express(this._items, req);
  }
}

/**
 * PropertyCondition
 */
class PropertyCondition {
  constructor(prop, op, value, name) {
    if (op && prop.allowed_ops.indexOf(op) === -1) {
      throw new Error(`Property ${name} does not support operation: ${op}`);
    }

    this._prop = prop;
    this._op = op;
    this._value = value;
    this._name = name;
  }

  toVCL() {
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
    const vcl = typeof this._prop.vcl === 'function' ? this._prop.vcl(this) : this._prop.vcl;
    return `${vcl} ${op} ${quote}${value}${quote}`;
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
          const { prefix } = this._prop;
          return prefix ? prefix(actual, value) : actual.startsWith(value);
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
 * @param {String} actual actual value
 * @param {String} value configured value
 */
function parentDirectoryMatch(actual, value) {
  return actual === value || actual.startsWith(`${value}/`);
}

/**
 * Known properties
 */
const propertyMap = {
  url: {
    vcl: 'req.http.X-Full-URL',
    express: req => `${req.protocol}://${req.headers.host}/${req.originalUrl}`,
    type: 'string',
    allowed_ops: '=~',
    prefix: parentDirectoryMatch,
  },
  'url.hostname': {
    vcl: 'req.http.host',
    express: req => req.hostname,
    type: 'string',
    allowed_ops: '=~',
  },
  'url.path': {
    vcl: 'req.url.path',
    express: req => req.path,
    type: 'string',
    allowed_ops: '=~',
    prefix: parentDirectoryMatch,
  },
  referer: {
    vcl: 'req.http.referer',
    express: req => req.get('referer'),
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
    express: req => req.get('user-agent'),
    type: 'string',
    allowed_ops: '=~',
  },
  accept_language: {
    vcl: 'req.http.Accept-Language',
    express: req => req.get('accept-language'),
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
 * Condition class
 */
class Condition {
  constructor(cfg) {
    this._top = cfg ? transform(cfg) : null;
  }

  toVCL() {
    return this._top ? this._top.toVCL() : '';
  }

  /* eslint-disable no-underscore-dangle */
  toFunction() {
    const self = this;
    return (req) => {
      if (self._top) {
        return self._top.evaluate(req);
      }
      return true;
    };
  }
}

// Now define our transformer
transform = (cfg) => {
  // We assume the first non-inherited key contains our property
  let name = Object.keys(cfg)[0];
  const value = cfg[name];

  const condition = booleanMap[name];
  if (condition) {
    return new BooleanCondition(condition, value);
  }

  const last = name.substr(-1);
  let op = null;
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
    prop = Object.assign({ type: op === '<' || op === '>' ? 'number' : 'string' }, propertyMap.url_param);
    return new PropertyCondition(prop, op, value, match[1]);
  }
  throw new Error(`Unknown property: ${name}`);
};

module.exports = Condition;
