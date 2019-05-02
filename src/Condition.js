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

const Affix = {
  PREFIX: 1,
  INFIX: 2,
};

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
        return this._children.reduce((result, child) => child.evaluate(req) || result, false);
      default:
        return !this._children.evaluate(req);
    }
  }
}

/**
 * PropertyCondition
 */
class PropertyCondition {
  constructor(property, op, value) {
    this._property = property;
    this._op = op;
    this._value = value;
  }

  toVCL() {
    const quote = this._property.quote || ' ';
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
    return `${this._property.vcl_name} ${op} ${quote}${value}${quote}`;
  }

  evaluate(req) {
    const actual = req[this._property.name];
    const value = this._value;

    switch (this._op) {
      case '=':
        return actual === value;
      case '~':
        return value.match(actual);
      case '<':
        return actual < value;
      case '>':
        return actual > value;
      default:
        // TODO: substring start
        return false;
    }
  }
}

const propertyConditionMap = {
  url: {
    vcl_name: 'req.url',
    exp_name: 'url',
    quote: '"',
  },
};

/**
 * Condition class
 */
class Condition {
  constructor(cfg = null) {
    this._top = cfg ? transform(cfg) : null;
  }

  toVCL() {
    return this._top ? this._top.toVCL() : '';
  }

  toFunction() {
    return (req) => {
      if (this._top) {
        return this._top.evaluate(req);
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
  const property = propertyConditionMap[name];
  if (property) {
    return new PropertyCondition(property, op, value);
  }
  throw new Error(`Unknown property: ${name}`);
};

module.exports = Condition;
