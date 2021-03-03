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
const Redirect = require('./Redirect');
const DynamicRedirect = require('./DynamicRedirect');

const RedirectRuleHandler = () => ({
  withLogger(logger) {
    this.logger = logger;
    return this;
  },

  withTransactionID(id) {
    this._transactionID = id;
    return this;
  },

  get(target, prop) {
    const index = Number.parseInt(prop, 10);
    if (!Number.isNaN(index) && index >= 0) {
      const item = target[prop];

      if (item.from && item.to) {
        return new Redirect(item);
      }
      return new DynamicRedirect(item, this.logger)
        .withTransactionID(this._transactionID);
    }
    return target[prop];
  },
});
exports.RedirectRuleHandler = RedirectRuleHandler;
