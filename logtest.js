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
const assert = require('assert');
const { dict } = require('ferrum');
const {
  ConsoleLogger, FileLogger,
  rootLogger,
  err, info, warn, verbose, debug, recordLogs,
} = require('./src/log');

rootLogger.loggers = dict({
  default: new ConsoleLogger({ level: 'debug' }),
  error: new FileLogger('/tmp/error2.log', { level: 'error' }),
  combined: new FileLogger('/tmp/combined2.log', { level: 'verbose' }),
});

debug('Hello World');
verbose('Foo');
info('Hello World', { foo: 42, bar: new Set([x => x * 2]) });
warn('Hello World');
err('foo');


const logs = recordLogs(() => {
  info('Yay');
  err('Nooo');
});
assert.strictEqual(logs, '[INFO] Yay\n[ERROR] Nooo\n');


// TODO: How should we handle errors in stream handlers? It's probably best
// to not progagate any since console.log should be ultra reliable…
