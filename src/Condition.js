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

const url = require('url');

// To avoid forward referencing the transformer function
let transform;

const Affix = {
  PREFIX: 1,
  INFIX: 2,
};

/**
 * Boolean conditions
 */
const booleanConditionMap = {
  or: {
    name: 'or',
    type: Affix.INFIX,
    op: ' || ',
  },
  and: {
    name: 'and',
    type: Affix.INFIX,
    op: ' && ',
  },
  not: {
    name: 'not',
    type: Affix.PREFIX,
    op: ' !',
  },
};

class BooleanCondition {
  constructor(condition, children) {
    this._condition = condition;

    switch (condition.type) {
      case Affix.PREFIX:
        this._children = transform(children);
        break;
      default:
        this._children = children.map(child => transform(child));
        break;
    }
  }

  toVCL() {
    let clause;

    switch (this._condition.type) {
      case Affix.PREFIX:
        clause = this._children.toVCL();
        return `${this._condition.op}(${clause})`;
      default:
        clause = this._children.map(child => child.toVCL()).join(this._condition.op);
        return `(${clause})`;
    }
  }

  evaluate(req) {
    switch (this._condition.name) {
      case 'and':
        return this._children.reduce((result, child) => result && child.evaluate(req), true);
      case 'or':
        return this._children.reduce((result, child) => result || child.evaluate(req), false);
      default:
        return !this._children.evaluate(req);
    }
  }
}

/**
 * PropertyCondition
 */
class PropertyCondition {
  constructor(name, type, op, value, vcl, express) {
    this._name = name;
    this._type = type;
    this._op = op;
    this._value = value;
    this._vcl = vcl;
    this._express = express;
  }

  toVCL() {
    const quote = this._type === 'string' ? '"' : '';
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
    const vcl = typeof this._vcl === 'function' ? this._vcl(this) : this._vcl;
    return `${vcl} ${op} ${quote}${value}${quote}`;
  }

  evaluate(req) {
    const actual = this._express(req, this);
    const value = this._value;

    if (!actual) {
      return false;
    }

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
        return actual.startsWith(value);
    }
  }

  get name() {
    return this._name;
  }

  get type() {
    return this._type;
  }
}

/**
 * Known properties
 */
const propertyConditionMap = {
  url: {
    vcl: 'req.url',
    express: req => req.path,
    type: 'string',
    allowed_ops: '=~',
  },
  url_param: {
    vcl: (property) => {
      let vcl = `subfield(req.url.qs, "${property.name}", "&")`;
      if (property.type === 'number') {
        vcl = `std.atoi(${vcl})`;
      }
      return vcl;
    },
    express: (req, property) => {
      const { query } = url.parse(req.path, true);
      return query[property.name];
    },
    allowed_ops: '~<=>',
  },
  client_lat: {
    vcl: 'client.geo.latitude',
    express: req => req.client_lat,
    type: 'number',
    allowed_ops: '<=>',
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

  const condition = booleanConditionMap[name];
  if (condition) {
    return new BooleanCondition(condition, value);
  }

  const last = name.substr(-1);
  let op = null;
  if (last.match(/[<=>~]/)) {
    name = name.slice(0, name.length - 1);
    op = last;
  }
  let property = propertyConditionMap[name];
  if (!property) {
    const match = name.match(/^url_param\.(.+)$/);
    if (!match) {
      throw new Error(`Unknown property: ${name}`);
    }
    [, name] = match;
    property = Object.assign({ type: op === '<' || op === '>' ? 'number' : 'string' }, propertyConditionMap.url_param);
  }
  if (op && property.allowed_ops.indexOf(op) === -1) {
    throw new Error(`Property ${name} does not support operation: ${op}`);
  }
  return new PropertyCondition(name, property.type, op, value, property.vcl, property.express);
};

module.exports = Condition;
