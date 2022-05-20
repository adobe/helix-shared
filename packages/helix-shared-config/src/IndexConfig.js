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

const indexConfigSchema = require('./schemas/indexconfig.schema.json');
const indexSchema = require('./schemas/index.schema.json');
const propertySchema = require('./schemas/property.schema.json');
const querySchema = require('./schemas/query.schema.json');

class IndexConfig extends SchemaDerivedConfig {
  constructor() {
    super({
      filename: 'helix-query.yaml',
      schemas: {
        '^/$': indexConfigSchema,
        '^/indices/.*$': indexSchema,
        '^/indices/.*/properties/.*$': propertySchema,
        '^/indices/.*/queries/.*$': querySchema,
      },
      handlers: {
        '^/indices$': NamedMapHandler(),
        '^/indices/.*/properties$': NamedMapHandler(),
        '^/indices/.*/queries$': NamedMapHandler(),
      },
    });
  }

  /**
   * Adds an index definition.
   *
   * @param {Object} index index configuration
   * @param {string} index.name index name
   * @param {Array} index.include paths to include
   * @param {Array} index.exclude paths to exclude
   * @param {string} index.target target
   * @param {object} properties properties to add to the index
   */
  addIndex({
    name, include, exclude, target, properties,
  }) {
    const { indices } = this._cfg;
    if (indices[name]) {
      throw new Error(`Unable to add index definition with existing name: ${name}`);
    }
    indices[name] = {
      name,
      include,
      exclude,
      target,
      properties,
    };

    // let BaseConfig.toYAML() use the JSON output
    this._document = null;
  }

  /**
   * Evaluates a variable expression
   * @param {string} expression the expression to encode
   * @param {string[]} parameters the list of variable parameters in the query
   * @param {object} urlparameters the URL parameters as key value pairs
   */
  static evaluate(expression, parameters, urlparameters) {
    if (!expression) {
      return '';
    }
    const cleanexpression = expression.replace(/\n/g, '');
    if (!parameters || parameters.length === 0) {
      return cleanexpression;
    }
    return `${parameters.reduce((expr, param) => `${expr.replace(`\${${param}}`, urlparameters[param])}`, cleanexpression)}`;
  }

  /**
   * Gets a query specified by indexname and queryname
   * @param {string} indexname name of the search index
   * @param {string} queryname name of the query
   */
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

  /**
   * Gets the caching timeout in seconds for the specified query
   * @param {string} indexname name of the search index
   * @param {string} queryname name of the query
   */
  getQueryCache(indexname, queryname) {
    const myquery = this.getQuery(indexname, queryname);
    if (myquery) {
      return myquery.cache;
    }
    // the query doesn't exist, so remember this for 10 minutes
    return 600;
  }

  /**
   * Gets the correct (Algolia) query URL that corresponds to the query
   * specified by indexname and queryname. Injects the correct parameters
   * from urlparams
   * @param {string} indexname name of the search index
   * @param {string} queryname name of the query
   * @param {string} owner the github owner
   * @param {string} repo the github repo name
   * @param {object} urlparams key-value pairs of the URL parameters of the request
   */
  getQueryURL(indexname, queryname, owner, repo, urlparams) {
    const myquery = this.getQuery(indexname, queryname);
    if (myquery) {
      const sp = new URLSearchParams();
      if (myquery.query) {
        sp.append('query', myquery.query.trim());
      }
      if (urlparams.page) {
        sp.append('page', urlparams.page.trim());
      }
      if (myquery.hitsPerPage) {
        sp.append('hitsPerPage', myquery.hitsPerPage);
      }
      const filters = IndexConfig.evaluate(myquery.filters, myquery.parameters, urlparams);
      if (filters) {
        sp.append('filters', filters);
      }
      return `/1/indexes/${owner}--${repo}--${indexname}?${sp}`;
    }
    return undefined;
  }

  /**
   * Initialize the configuration
   */
  async init() {
    await super.init();

    this._version = this._cfg.version;
    return this;
  }
}

module.exports = IndexConfig;
