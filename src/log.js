/*
 * Copyright 2018 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

// eslint-disable-next-line max-len
/* eslint-disable no-console, no-param-reassign, no-use-before-define, consistent-return,no-underscore-dangle,max-classes-per-file */

const assert = require('assert');
const { createWriteStream } = require('fs');
const { inspect } = require('util');
const { dict, exec, isdef } = require('ferrum');
const { nextTick } = require('./async');

const _loglevelMap = {
  fatal: 0,
  error: 1,
  warn: 2,
  info: 3,
  verbose: 4,
  debug: 5,
};

/**
 * This can be used to convert a string log level into it's
 * numeric equivalent. More pressing log levels have lower numbers.
 *
 * @throws {Error} If the given log level name is invalid.
 * @param {String} name Name of the log level
 * @returns {Number} The numeric log level
 */
const numericLogLevel = (name) => {
  const r = _loglevelMap[name];
  if (r === undefined) {
    throw new Error(`Not a valid log level: ${name}`);
  }
  return r;
};

/**
 * Wrapper around inspect that is extremely robust against errors
 * during inspection.
 *
 * Specifically designed to handle errors in toString() functions
 * and custom inspect functions.
 *
 * If any error is encountered a less informative string than a full
 * inspect is returned and the error is logged using `err()`.
 *
 * @param {Any} what The object to inspect
 * @param {Object} opts Options will be passed through to inspect.
 *   Note that these may be ignored if there is an error during inspect().
 */
const tryInspect = (what, opts) => {
  opts = { depth: null, breakLength: Infinity, ...opts };
  const errors = [];
  let msg;

  // This will fail if [inspect.custom]() is borked for some type in the tree
  try {
    msg = inspect(what, opts);
  } catch (e) {
    errors.push(e);
  }

  // This will still fail if the class name of some type in the tree is borked
  try {
    // Maybe error was because of custom inspect?
    msg = isdef(msg) ? msg : inspect(what, { ...opts, customInspect: false });
  } catch (e) {
    errors.push(e);
  }

  // Log that we encountered errors during inspecting after we printed
  // this
  exec(async () => {
    if (!opts.recursiveErrorHandling && errors.length > 0) {
      await nextTick();
      for (const e of errors) {
        const ser = tryInspect(e, { ...opts, recursiveErrorHandling: true });
        err(`Error while inspecting object for log message: ${ser}`);
      }
    }
  });

  return isdef(msg) ? msg : '<<COULD NOT INSPECT>>';
};

/**
 * This is a useful helper function that turns a message containing
 * arbitrary objects (like you would hand to console.log) into a string.
 *
 * Leaves strings as is; uses `require('util').inspect(...)` on all other
 * types and joins the parameters using space:
 *
 * Loggers writing to raw streams or to strings usually use this, however
 * not all loggers require this; e.g. in a browser environment
 * console.warn/log/error should be used as these enable the use of the
 * visual object inspectors, at least in chrome and firefox.
 *
 * @param {any[]} msg – Parameters as you would pass them to console.log
 * @param {Object} opts – Parameters are forwarded to util.inspect().
 *   By default `{depth: null, breakLength: Infinity, colors: false}` is used.
 * @returns {string}
 */
const serializeMessage = (msg, opts) => msg.map((v) => (typeof (v) === 'string' ? v : tryInspect(v, opts))).join(' ');

/**
 * Can be used to encode a message as json.
 *
 * Uses serializeMessage internally.
 *
 * ```
 * jsonEncodeMessage(["Hello World", 42], { level: 'debug' })
 * // => {message: 'Hello World 42', level: 'debug'}
 * ```
 *
 * @param {any[]} msg – Parameters as you would pass them to console.log
 * @param {Object} opts – Named parameters:
 *
 *   - level: The log level; defaults to 'info'
 *
 *   Any other parameters are forwarded to serializeMessage.
 * @returns {string} Json encoded string
 */
const jsonEncodeMessage = (msg, opts = {}) => {
  const { level = 'info', ...serializeOpts } = opts;
  return JSON.stringify({ level, message: serializeMessage(msg, serializeOpts) });
};

/**
 * The logger interface can be used to customize how logging is done.
 *
 * Uses a fairly simple interface to avoid complexity for use cases in
 * which is not required. Can be used to dispatch logging to more
 * elaborate libraries. E.g. a logger using winston could be constructed like this:
 *
 * @interface Logger
 */

/**
 * Actually print a log message
 *
 * Implementations of this MUST NOT throw exceptions. Instead implementors
 * ARE ADVISED to attempt to log the error using err() while employing some
 * means to avoid recursively triggering the error. Loggers SHOULD fall back
 * to logging with console.error.
 *
 * Even though loggers MUST NOT throw exceptions; users of this method SHOULD
 * still catch any errors and handle them appropriately.
 *
 * @method
 * @name log
 * @param {any[]} msg The message; list of arguments as you would pass it to console.log
 * @param {Object} opts – Configuration object; contains only one key at
 *   the moment: `level` - The log level which can be one of `error, warn,
 *   info, verbose` and `debug`.
 */

/**
 * Logger that is especially designed to be used in node.js
 * Print's to stderr; Marks errors, warns & debug messages
 * with a colored `[ERROR]`/... prefix. Uses `inspect` to display
 * all non-strings.
 *
 * @implements Logger
 * @class
 * @parameter {Object} opts – Currently supports one option:
 *   loglevel – One of the log levels described in the Logger interface.
 *     Messages below this log level will not be printed.
 *     Defaults to info.
 *
 *   The rest of the options will be passed to serialize…
 */
class ConsoleLogger {
  /*
   * The minimum log level for messages to be printed.
   * Feel free to change to one of the levels described in the Logger
   * interface.
   * @member {string} level
   */

  /**
   * Options that will be passed to `serializeMessage()`;
   * Feel free to mutate or exchange.
   * @member {object} serializeOpts
   */

  constructor(opts = {}) {
    const { level = 'info', ...serializeOpts } = opts;
    Object.assign(this, { level, serializeOpts });
  }

  log(msg, opts = {}) {
    // Defensive coding: Putting the entire function in try-catch
    // clauses to avoid any sorts of exceptions leaking
    const { level = 'info' } = opts || {};
    if (numericLogLevel(level) <= numericLogLevel(this.level)) {
      // Logs should go to stderr; this is only correct in node;
      // in the browser we should use console.log
      console.error(`[${level.toUpperCase()}] ${serializeMessage(msg, { colors: true })}`);
    }
  }
}

/**
 * Simple logger that forwards all messages to the underlying loggers.
 *
 * This maintains an es6 map called loggers. Consumers of this API are
 * explicitly permitted to mutate this map or replace it all together in
 * order to add, remove or alter logger.
 *
 * ```js
 * const { rootLogger } = require('@adobe/helix-shared').log;
 *
 * // Changing the log level of the default logger:
 * rootLogger.loggers.get('default').level = 'info';
 *
 * // Adding a named logger
 * rootLogger.loggers.set('logfile', new FileLogger('...'));
 *
 * // Adding an anonymous logger (you can add an arbitrary number of these)
 * const name = `logfile-${uuidgen()}`;
 * rootLogger.loggers.set(name, new FileLogger('...'));
 *
 * // Deleting a logger
 * rootLogger.loggers.delete(name);
 *
 * // Replacing all loggers
 * rootLogger.loggers = new Map([['default', new ConsoleLogger({level: 'debug'})]]);
 * ```
 *
 * @implements Logger
 * @class
 * @parameter {...Logger} ...loggers – The loggers to forward to.
 */
class MultiLogger {
  /*
   * The list of loggers this is forwarding to. Feel free to mutate
   * or replace.
   *
   * @member {Map<Logger>} loggers
   */

  constructor(loggers) {
    this.loggers = dict(loggers);
  }

  log(msg, opts = undefined) {
    const exceptions = [];
    for (const [, sub] of this.loggers) {
      // We wrap each logging in separate try/catch blocks so exceptions
      // on one logger are isolated from jumping over to other loggers
      try {
        sub.log(msg, opts);
      } catch (error) {
        if (!this._handling_recursive_sub_error) {
          exceptions.push([sub, error]);
        }
      }
    }

    // Printing all the exception messages here, so the error messages are
    // always printed after th e
    for (const [sub, error] of exceptions) {
      this._handling_recursive_sub_error = true;
      // Defensive coding: Not printing the message here because the message
      // may have triggered the exception…
      err('MultiLogger encountered exception while logging to to', sub, ': ', error);
      this._handling_recursive_sub_error = false;
    }
  }
}

/**
 * Logs to any writable node.js stream
 *
 * @class
 * @implements Logger
 * @param {WritableStream} stream - The stream to log to
 * @param {Object} opts – Configuration object; contains only one key at
 *   the moment: `level` - The log level which can be one of `error, warn,
 *   info, verbose` and `debug`.
 */
class StreamLogger {
  /**
   * The stream this logs to.
   * @member {Object} stream
   */

  /**
   * The minimum log level for messages to be printed.
   * Feel free to change to one of the levels described in the Logger
   * interface.
   * @member {string} level
   */

  /**
   * Options that will be passed to `serializeMessage()`;
   * Feel free to mutate or exchange.
   * @member {object} serializeOpts
   */

  constructor(stream, opts = {}) {
    const { level = 'info', ...serializeOpts } = opts;
    Object.assign(this, { stream, level, serializeOpts });
  }

  log(msg, opts = {}) {
    const { level = 'info' } = opts;
    if (numericLogLevel(level) > numericLogLevel(this.level)) {
      return;
    }

    this.stream.write(`[${level.toUpperCase()}] `);
    this.stream.write(serializeMessage(msg, this.serializeOpts));
    this.stream.write('\n');
  }
}

/**
 * Log to a file.
 *
 * @class
 * @extends StreamLogger
 * @implements Logger
 * @param {String} name - The name of the file to log to
 * @param {Object} opts – Configuration object; contains only one key at
 *   the moment: `level` - The log level which can be one of `error, warn,
 *   info, verbose` and `debug`.
 */
class FileLogger extends StreamLogger {
  constructor(name, opts = {}) {
    super(createWriteStream(name, { flags: 'a' }), opts);
    this.stream.on('error', (e) => err(`Error writing to file ${name}:`, e));
  }
}
/**
 * Logs messages to an in-memory buffer.
 *
 * @class
 * @implements Logger
 * @param {Object} opts – Configuration object; contains only one key at
 *   the moment: `level` - The log level which can be one of `error, warn,
 *   info, verbose` and `debug`.
 */
class MemLogger {
  /**
   * The buffer this records to.
   * Each element is a message, without the newline at the end.
   * @member {String[]} buf
   */

  /**
   * The minimum log level for messages to be printed.
   * Feel free to change to one of the levels described in the Logger
   * interface.
   * @member {string} level
   */

  /**
   * Options that will be passed to `serializeMessage()`;
   * Feel free to mutate or exchange.
   * @member {object} serializeOpts
   */

  constructor(opts = {}) {
    const { level = 'info', ...serializeOpts } = opts;
    Object.assign(this, { level, serializeOpts, buf: [] });
  }

  log(msg, opts = {}) {
    const { level = 'info' } = opts;
    if (numericLogLevel(level) <= numericLogLevel(this.level)) {
      this.buf.push(`[${level.toUpperCase()}] ${serializeMessage(msg, this.serializeOpts)}`);
    }
  }
}

/**
 * The logger all other loggers attach to.
 *
 * Must always contain a logger named 'default'; it is very much reccomended
 * that the default logger always be a console logger; this can serve as a good
 * fallback in case other loggers fail.
 *
 * ```js
 * // Change the default logger
 * rootLogger.loggers.set('default', new ConsoleLogger({level: 'debug'}));
 * ```
 *
 * You should not log to the root logger directly; instead use one of the
 * wrapper functions `log, fatal, err, warn, info, verbose, debug`; they
 * perform some additional
 *
 * @const
 */
const rootLogger = new MultiLogger({
  default: new ConsoleLogger({ level: 'info' }),
});

/**
 * Lot to the root logger; this is a wrapper around `rootLogger.log`
 * that handles exceptions thrown by rootLogger.log.
 *
 * @function
 * @param {Any[]} msg – The message as you would hand it to console.log
 * @param {Object} opts – Any options you would pass to rootLogger.log
 */
const log = (msg, opts) => {
  try {
    rootLogger.log(msg, opts);
  } catch (er) {
    console.error('Failed to log message:', ...msg);
    console.error('Cause:', er);
  }
};

/**
 * Uses the currently installed logger to print a fatal error-message
 * @function
 * @param {...Any} ...msg – The message as you would hand it to console.log
 */
const fatal = (...msg) => log(msg, { level: 'fatal' });

/**
 * Uses the currently installed logger to print an error-message
 * @function
 * @param {...Any} ...msg – The message as you would hand it to console.log
 */
const err = (...msg) => log(msg, { level: 'error' });

/**
 * Uses the currently installed logger to print an warn
 * @function
 * @param {...Any} ...msg – The message as you would hand it to console.log
 */
const warn = (...msg) => log(msg, { level: 'warn' });

/**
 * Uses the currently installed logger to print an informational message
 * @function
 * @param {...Any} ...msg – The message as you would hand it to console.log
 */
const info = (...msg) => log(msg, { level: 'info' }, ...msg);

/**
 * Uses the currently installed logger to print a verbose message
 * @function
 * @param {...Any} ...msg – The message as you would hand it to console.log
 */
const verbose = (...msg) => log(msg, { level: 'verbose' }, ...msg);

/**
 * Uses the currently installed logger to print a message intended for debugging
 * @function
 * @param {...Any} ...msg – The message as you would hand it to console.log
 */
const debug = (...msg) => log(msg, { level: 'debug' });

/**
 * Record the log files with debug granularity while the given function is running.
 *
 * While the logger is recording, all other loggers are disabled.
 * If this is not your desired behaviour, you can use the MemLogger
 * manually.
 *
 * ```
 * const { assertEquals } = require('ferrum');
 * const { recordLogs, info, err } = require('@adobe/helix-shared').log;
 *
 * const logs = recordLogs(() => {
 *   info('Hello World\n');
 *   err('Nooo')
 * });
 * assertEquals(logs, 'Hello World\n[ERROR] Nooo');
 * ```
 *
 * @param {Object} opts – optional first parameter; options passed to MemLogger
 * @param {Function} fn - The logs that this code emits will be recorded.
 * @returns {String} The logs that where produced by the codee
 */
const recordLogs = (opts, fn) => {
  if (opts instanceof Function) {
    return recordLogs({}, opts);
  }

  const backup = rootLogger.loggers;
  const logger = new MemLogger(opts);
  try {
    rootLogger.loggers = dict({ default: logger });
    fn();
  } finally {
    rootLogger.loggers = backup;
  }
  return `${logger.buf.join('\n')}\n`;
};

/**
 * Assert that a piece of code produces a specific set of log messages.
 *
 * ```
 * const { assertLogs, info, err } = require('@adobe/helix-shared').log;
 *
 * assertLogs(() => {
r
 *   info('Hello World\n');
 *   err('Nooo')
 * }, multiline(`
 *   Hello World
 *   [ERROR] Nooo
 * `));
 * ```
 *
 * @param {Object} opts – optional first parameter; options passed to MemLogger
 * @param {Function} fn - The logs that this code emits will be recorded.
 * @param {String} logs
 */
const assertLogs = (opts, fn, logs) => {
  if (opts instanceof Function) {
    assertLogs({}, opts, fn);
  } else {
    assert.strictEqual(recordLogs(opts, fn), logs);
  }
};

/**
 * Async variant of recordLogs.
 *
 * Note that using this is a bit dangerous;
 *
 * ```
 * const { assertEquals } = require('ferrum');
 * const { recordAsyncLogs, info, err } = require('@adobe/helix-shared').log;
 *
 * const logs = await recordLogs(async () => {
 *   info('Hello World\n');
 *   await sleep(500);
 *   err('Nooo')
 * });
 * assertEquals(logs, 'Hello World\n[ERROR] Nooo');
 * ```
 *
 * @param {Object} opts – optional first parameter; options passed to MemLogger
 * @param {Function} fn - The logs that this code emits will be recorded.
 * @returns {String} The logs that where produced by the codee
 */
const recordAsyncLogs = async (opts, fn) => {
  if (opts instanceof Function) {
    return recordAsyncLogs({}, opts);
  }

  const backup = rootLogger.loggers;
  const logger = new MemLogger(opts);
  try {
    rootLogger.loggers = dict({ default: logger });
    await fn();
  } finally {
    rootLogger.loggers = backup;
  }
  return `${logger.buf.join('\n')}\n`;
};

/**
 * Async variant of assertLogs
 *
 * ```
 * const { assertAsyncLogs, info, err } = require('@adobe/helix-shared').log;
 *
 * await assertAsyncLogs(() => {
 *   info('Hello World\n');
 *   await sleep(500);
 *   err('Nooo')
 * }, multiline(`
 *   Hello World
 *   [ERROR] Nooo
 * `));
 * ```
 *
 * @param {Object} opts – optional first parameter; options passed to MemLogger
 * @param {Function} fn - The logs that this code emits will be recorded.
 * @param {String} logs
 */
const assertAsyncLogs = async (opts, fn, logs) => {
  if (opts instanceof Function) {
    return assertAsyncLogs({}, opts, fn);
  } else {
    assert.strictEqual(await recordAsyncLogs(opts, fn), logs);
  }
};

module.exports = {
  numericLogLevel,
  serializeMessage,
  jsonEncodeMessage,
  ConsoleLogger,
  MultiLogger,
  StreamLogger,
  FileLogger,
  MemLogger,
  rootLogger,
  log,
  fatal,
  err,
  info,
  warn,
  verbose,
  debug,
  recordLogs,
  assertLogs,
  recordAsyncLogs,
  assertAsyncLogs,
  tryInspect,
};
