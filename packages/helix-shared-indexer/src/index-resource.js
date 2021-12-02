/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
const moment = require('moment');
const { JSDOM } = require('jsdom');
const jsep = require('jsep');

const helpers = {
  dateValue: (elements, format) => {
    const result = helpers.parseTimestamp(elements, format);
    return result.map((r) => {
      const daysSince1970 = (r / 60 / 60 / 24);

      // 1/1/1900 is day 1 in Excel, so:
      // - add this
      // - add days between 1/1/1900 and 1/1/1970
      // - add one more day for Excel's leap year bug
      return daysSince1970 + (1 + 25567 + 1);
    });
  },
  parseTimestamp: (elements, format) => {
    if (!elements) {
      return [];
    }
    if (!Array.isArray(elements)) {
      // eslint-disable-next-line no-param-reassign
      elements = [elements];
    }
    return elements.map((el) => {
      const content = typeof el === 'string' ? el : el.textContent;
      const millis = moment.utc(content, format).valueOf();
      return millis / 1000;
    });
  },
  attribute: (elements, name) => elements.map((el) => el.getAttribute(name)),
  textContent: (elements) => elements.map((el) => el.textContent),
  innerHTML: (elements) => elements.map((el) => el.innerHTML),
  match: (elements, re) => {
    // todo: maybe base on function ?
    const result = [];
    const regex = new RegExp(re, 'g');
    elements.forEach((el) => {
      let m;
      const content = typeof el === 'string' ? el : el.textContent;

      // eslint-disable-next-line no-cond-assign
      while ((m = regex.exec(content)) !== null) {
        result.push(m[m.length - 1]);
      }
    });
    return result;
  },
  words: (text, start, end) => {
    if (Array.isArray(text)) {
      // eslint-disable-next-line no-param-reassign
      text = text.join(' ');
    }
    return [text.split(/\s+/g).slice(start, end).join(' ')];
  },
  replace: (s, searchValue, replaceValue) => [s.replace(searchValue, replaceValue)],
};

function evaluate(expression, context) {
  const { log } = context;
  const vars = {
    ...context,
    ...helpers,
  };

  function evalNode(node) {
    switch (node.type) {
      case 'CallExpression': {
        const args = node.arguments.map(evalNode);
        const fn = evalNode(node.callee);
        if (typeof fn === 'function') {
          return fn(...args);
        } else {
          log.warn('evaluate function not supported: ', node.callee.name);
        }
        return undefined;
      }
      case 'MemberExpression': {
        const obj = vars[node.object.name];
        if (obj && obj.get) {
          return obj.get(node.property.value);
        }
        return undefined;
      }
      case 'Identifier': {
        return vars[node.name];
      }
      case 'Literal': {
        return node.value;
      }
      default: {
        log.warn('evaluate type not supported: ', node.type);
      }
    }
    return null;
  }

  const tree = jsep(expression);
  return evalNode(tree);
}

/**
 * Return a value in the DOM by evaluating an expression
 *
 * @param {Array.<HTMLElement>} elements
 * @param {string} expression
 * @param {Logger} log
 * @param {object} vars
 */
function getDOMValue(elements, expression, log, vars) {
  return evaluate(expression, {
    el: elements,
    log,
    ...vars,
  });
}

/**
 * Given a response, extract a value and evaluate an expression
 * on it. The index contains the CSS selector that will select the
 * value(s) to process. If we get multiple values, we return an
 * array.
 *
 * @param {string} path Path of document retrieved
 * @param {object} response response containing body and headers
 * @param {Index} config indexing configuration
 * @param {Logger} log logger
 * @return {object} extracted properties
 */
function indexResource(path, response, config, log) {
  const { body, headers } = response;
  const { document } = new JSDOM(body).window;
  const record = { };

  /* Walk through all index properties */
  config.properties.forEach((property) => {
    const { select, ...p } = property;
    const expression = p.value || p.values;
    // create an array of elements
    const elements = select !== 'none' ? Array.from(document.querySelectorAll(select)) : [];
    let value = getDOMValue(elements, expression, log, { path, headers }) || [];
    // concat for single value
    if (p.value) {
      if (Array.isArray(value)) {
        value = value.length === 1 ? value[0] : value.join('');
      }
    }
    record[property.name] = value;
  });
  return record;
}

module.exports = indexResource;
