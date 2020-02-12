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
const SchemaDerivedConfig = require('./SchemaDerivedConfig.js');
const { NamedMapHandler } = require('./NamedMapHandler');

class IndexConfig extends SchemaDerivedConfig {
  constructor() {
    super({
      filename: 'helix-query.yaml',
      schemas: {
        '^/$': 'indexconfig.schema.json',
        '^/indices/.*$': 'index.schema.json',
        '^/indices/.*/properties/.*$': 'property.schema.json',
        '^/indices/.*/queries/.*$': 'query.schema.json',
      },
      handlers: {
        '^/indices$': NamedMapHandler(),
        '^/indices/.*/properties$': NamedMapHandler(),
        '^/indices/.*/queries$': NamedMapHandler(),
      },
    });
  }

  static encode(expression, parameters, values) {
    if (!expression) {
      return '';
    }
    const cleanexpression = expression.replace(/\n/g, '');
    if (!parameters || parameters.length === 0) {
      return encodeURIComponent(cleanexpression);
    }
    return `${parameters.reduce((expr, param) => `${expr.replace(`%24%7B${param}%7D`, values[param])}`, encodeURIComponent(cleanexpression))}`;
  }

  getQuery(indexname, queryname) {
    const [myindex] = this.indices.filter((index) => index.name === indexname);
    if (!myindex) {
      return undefined;
    }
    const [myquery] = myindex.queries.filter((query) => query.name === queryname);
    if (!myquery) {
      return undefined;
    }
    return myquery;
  }

  getQueryCache(indexname, queryname) {
    const myquery = this.getQuery(indexname, queryname);
    if (myquery) {
      return myquery.cache;
    }
    // the query doesn't exist, so remember this for 10 minutes
    return 600;
  }

  /**
   *
   * @param {string} indexname name of the search index
   * @param {string} queryname name of the query
   * @param {object} urlparams key-value pairs of the URL parameters of the request
   */
  getQueryURL(indexname, queryname, owner, repo, urlparams) {
    const myquery = this.getQuery(indexname, queryname);
    if (myquery) {
      return `/1/indexes/${owner}--${repo}--${indexname}
      ?query=${encodeURIComponent(myquery.query)}
      &filters=${IndexConfig.encode(myquery.filters, myquery.parameters, urlparams)}
      &page=${encodeURIComponent(urlparams.page || 1)}
      &hitsPerPage=${encodeURIComponent(myquery.hitsPerPage)}`
        .replace(/\n[\s]+/g, '');
    }
    return undefined;
  }
}

module.exports = IndexConfig;
