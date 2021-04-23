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
const SchemaDerivedConfig = require('./SchemaDerivedConfig.js');
const { NamedMapHandler } = require('./NamedMapHandler');
const { RedirectRuleHandler } = require('./RedirectRuleHandler');

const redirectsConfigSchema = require('./schemas/redirects.schema.json');
const redirectSchema = require('./schemas/redirect.schema.json');
const redirectRuleSchema = require('./schemas/redirectrule.schema.json');
const vanitySchema = require('./schemas/vanity.schema.json');

class RedirectConfig extends SchemaDerivedConfig {
  constructor() {
    const rrhandler = RedirectRuleHandler();

    super({
      filename: 'helix-redirects.yaml',
      schemas: {
        '^/$': redirectsConfigSchema,
        '^/redirects/.*$': redirectSchema,
        '^/redirects/.*/$': redirectRuleSchema,
        '^/vanity/.*$': vanitySchema,
      },
      handlers: {
        '^/vanity$': NamedMapHandler(),
        '^/redirects$': rrhandler,
      },
    });

    rrhandler.withLogger(this._logger);
    this.rrhandler = rrhandler;
  }

  withTransactionID(id) {
    this.rrhandler.withTransactionID(id);
    return this;
  }

  withGithubToken(token) {
    this.rrhandler.withGithubToken(token);
    return this;
  }

  async match(path) {
    const resolved = await Promise.all(this.redirects.map((redirect) => redirect.match(path)));
    return resolved.find((o) => o);
  }

  async all() {
    const resolved = await Promise.all(this.redirects.map((redirect) => redirect.all()));
    return resolved.flat();
  }
}

module.exports = RedirectConfig;
