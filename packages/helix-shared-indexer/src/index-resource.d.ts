/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { Headers } from '@adobe/helix-fetch'

export declare interface IndexConfig {}

export declare interface Logger {}

export declare interface HTMLResponse {
  headers: Headers,

  body: string,
}

/**
 * Given a response, extract a value and evaluate an expression
 * on it. The index contains the CSS selector that will select the
 * value(s) to process. If we get multiple values, we return an
 * array.
 *
 * @param {URL} url of document retrieved
 * @param {HTMLResponse} response response containing body and headers
 * @param {IndexConfig} config indexing configuration
 * @param {Logger} log logger
 * @return {object} indexed properties
 */
export declare function indexResource(url: URL, response: HTMLResponse, config: IndexConfig, log: Logger): object;
