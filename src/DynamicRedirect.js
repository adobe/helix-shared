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
const { URL } = require('url');
const fetchAPI = require('@adobe/helix-fetch');

const { fetch } = process.env.HELIX_FETCH_FORCE_HTTP1
  ? fetchAPI.context({
    alpnProtocols: [fetchAPI.ALPN_HTTP1_1],
  })
  /* istanbul ignore next */
  : fetchAPI;

const DEFAULT_TYPE = 'permanent';
const FROM_NAMES = ['from', 'src', 'source', 'origin'];
const TO_NAMES = ['to', 'target', 'dest', 'destination'];
const TYPE_NAMES = ['type', 'kind'];

function getProp(entry, names) {
  const pair = Object.entries(entry).find(([key]) => names.includes(key.toLowerCase()));
  return pair ? pair[1] : null;
}

function getPath(value) {
  if (value && value.startsWith('https://')) {
    return new URL(value).pathname;
  }
  return value;
}

function trim(value) {
  if (value && typeof value === 'string') {
    return value.trim();
  }
  return value;
}

function clean(entry) {
  return {
    from: getPath(trim(getProp(entry, FROM_NAMES))),
    to: trim(getProp(entry, TO_NAMES)),
    type: trim(getProp(entry, TYPE_NAMES)),
  };
}

class DynamicRedirect {
  constructor(src, logger) {
    this._src = src;
    this._data = null;
    this._logger = logger;
    this._transactionID = null;
  }

  withTransactionID(id) {
    this._transactionID = id;
    return this;
  }

  async match(path) {
    if (!this._data) {
      try {
        // eslint-disable-next-line no-underscore-dangle
        const namespace = process.env.__OW_NAMESPACE || 'helix';
        const url = new URL(`https://adobeioruntime.net/api/v1/web/${namespace}/helix-services/data-embed@v1`);
        url.searchParams.append('src', this._src);
        const res = await fetch(url.href, {
          headers: {
            'x-request-id': this._transactionID,
          },
        });
        const data = (await res.json()).map(clean);
        if (res.ok) {
          this._data = data;
        }
      } catch (e) {
        this._logger.warn(`failed to get ${this._src} ${e.message}`);
      }
    }
    if (this._data) {
      const hit = this._data.find((entry) => entry.from === path
        || entry.from === path.replace(/[ äӓ]/g, encodeURIComponent));
      return hit ? {
        url: hit.to,
        type: hit.type || DEFAULT_TYPE,
      } : null;
    }
    return null;
  }
}

module.exports = DynamicRedirect;
