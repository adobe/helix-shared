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
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import jsep, { Jsep } from 'jsep';
import rehypeParse from 'rehype-parse';
import { select as selectOne, selectAll } from 'hast-util-select';
import { toText } from 'hast-util-to-text';
import { toHtml } from 'hast-util-to-html';
import { unified } from 'unified';

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
    dayjs.extend(customParseFormat);
    dayjs.extend(utc);

    if (!elements) {
      return [];
    }
    if (!Array.isArray(elements)) {
      // eslint-disable-next-line no-param-reassign
      elements = [elements];
    }
    return elements.map((el) => {
      const content = typeof el === 'string' ? el : toText(el);
      const millis = Number.isNaN(dayjs.utc(content, format).valueOf())
        ? dayjs.utc(content).valueOf() // fall back to ISO format
        : dayjs.utc(content, format).valueOf();
      return millis / 1000;
    });
  },
  attribute: (elements, name) => elements.map((el) => el.properties[name]),
  textContent: (elements) => elements.map((el) => toText(el)),
  innerHTML: (elements) => elements.map((el) => el.children.map((child) => toHtml(child)).join('')),
  match: (elements, re) => {
    // todo: maybe base on function ?
    const results = [];
    const regex = new RegExp(re, 'g');

    if (!Array.isArray(elements)) {
      // eslint-disable-next-line no-param-reassign
      elements = [elements];
    }
    elements.forEach((el) => {
      let m;
      let previousIndex = -1;

      const content = typeof el === 'string' ? el : toText(el);

      // eslint-disable-next-line no-cond-assign
      while ((m = regex.exec(content)) !== null) {
        const { index } = m;
        if (index === previousIndex) {
          // stop collecting empty matches
          break;
        }
        const result = m.findLast((value) => !!value);
        if (result) {
          // only add result if non-empty
          results.push(result);
        }
        previousIndex = index;
      }
    });
    return results;
  },
  words: (text, start, end) => {
    if (Array.isArray(text)) {
      // eslint-disable-next-line no-param-reassign
      text = text.join(' ');
    }
    return [text.split(/\s+/g).slice(start, end).join(' ')];
  },
  replace: (s, searchValue, replaceValue) => [s.replace(searchValue, replaceValue)],
  replaceAll: (s, searchValue, replaceValue) => [s.replaceAll(searchValue, replaceValue)],
};

function evaluate(expression, context) {
  const { log } = context;
  const vars = {
    ...context,
    ...helpers,
  };

  function evalNode(node) {
    switch (node.type) {
      case Jsep.CALL_EXP: {
        const args = node.arguments.map(evalNode);
        const fn = evalNode(node.callee);
        if (typeof fn === 'function') {
          return fn(...args);
        } else {
          log.warn('evaluate function not supported: ', node.callee.name);
        }
        return undefined;
      }
      case Jsep.MEMBER_EXP: {
        const obj = vars[node.object.name];
        if (obj && obj.get) {
          return obj.get(node.property.value);
        }
        return undefined;
      }
      case Jsep.IDENTIFIER: {
        return vars[node.name];
      }
      case Jsep.LITERAL: {
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
export function indexResource(path, response, config, log) {
  const { body, headers } = response;
  const content = unified()
    .use(rehypeParse, { fragment: false })
    .parse(body);
  const record = Object.create(null);

  /* Walk through all index properties */
  config.properties.forEach((property) => {
    const { select, selectFirst, ...p } = property;
    const expression = p.value || p.values;

    try {
      let elements = [];
      if (selectFirst) {
        const element = selectOne(selectFirst, content);
        if (element) {
          elements = [element];
        }
      } else if (select !== 'none') {
        elements = selectAll(select, content);
      }
      let value = getDOMValue(elements, expression, log, { path, headers }) || [];
      // concat for single value
      if (p.value) {
        if (Array.isArray(value)) {
          value = value.length === 1 ? value[0] : value.join('');
        }
      }
      record[property.name] = value;
    } catch (e) {
      log.warn(`Unable to apply given selector '${select}': ${e.message}`);
      record[property.name] = '';
    }
  });
  return record;
}
