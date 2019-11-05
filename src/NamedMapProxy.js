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
const Ajv = require('ajv');

/**
 * Turns a YAML data structure into a JS data structure, with
 * enforcement of schema-defined defaults.
 * Given a YAML structure in `document` like this (expecting parsed YAML):
 * ```yaml
 * some-key:
 *   foo:
 *     baz: 1
 *   bar:
 *     baz: 2
 * ```
 * the `NamedMapProxy` will return a JavaScript data structure that looks like
 * this:
 * ```javascript
 * [
 *  {
 *    name: 'foo',
 *    baz: 1
 *  },
 *  {
 *    name: 'bar',
 *    baz: 2
 *  }
 * ]
 * ```
 * by providing an appropriate JSON Schema in `itemschema` you can also enforce
 * default values for certain properties.
 * @param {YAML} document a YAML document
 * @param {*} rootprop the root property to wrap
 * @param {*} itemschema the schema for items
 */
function NamedMapProxy(document, rootprop, itemschema) {
  const ajv = new Ajv({ useDefaults: true });
  const validate = ajv.compile(itemschema);
  const data = Symbol('data');

  function getRootNode(target) {
    return target.contents.items.filter(({ key }) => key.value === rootprop)[0];
  }

  // a proxy handler that treats a YAML node as a named JS object
  const namedItemHandler = {
    get: (target, prop) => {
      if (prop === 'name') {
        return target.key.value;
      }
      if (!target[data]) {
        // eslint-disable-next-line no-param-reassign
        target[data] = target.value.toJSON();
        validate(target[data]);
      }
      // our YAML always uses lowercase keys
      return target[data][prop.toLowerCase()];
    },
  };

  // a proxy handler that treats a YAML map as a JS array
  const mapToListHandler = {
    get: (target, prop) => {
      const getlength = () => {
        const root = getRootNode(target);
        if (root) {
          return root.value.items.length;
        }
        return 0;
      };
      if (prop === 'length') {
        return getlength();
      }
      if (prop === 'toJSON') {
        return () => getRootNode(target).toJSON()[rootprop];
      }
      const index = Number.parseInt(prop, 10);
      if (!Number.isNaN(index) && index >= 0 && index < getlength()) {
        return new Proxy(getRootNode(target).value.items[prop], namedItemHandler);
      }
      return undefined;
    },
  };

  return new Proxy(document, mapToListHandler);
}

module.exports = NamedMapProxy;
