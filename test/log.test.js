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

/* eslint-env mocha */
// eslint-disable-next-line max-len
/* eslint-disable no-console, class-methods-use-this, no-await-in-loop,max-classes-per-file,no-underscore-dangle */

const assert = require('assert');
const stream = require('stream');
const fs = require('fs');
const { inspect, promisify } = require('util');
const { v4: uuidgen } = require('uuid');
const {
  join, dict, pipe, filter, reject, map,
} = require('ferrum');
const { multiline } = require('../src').string;
const { nextTick, sleep } = require('../src').async;
const {
  numericLogLevel, serializeMessage, jsonEncodeMessage, ConsoleLogger,
  rootLogger, assertAsyncLogs, assertLogs, recordLogs, recordAsyncLogs,
  tryInspect, fatal, err, warn, info, verbose, debug, StreamLogger,
  FileLogger, MemLogger, MultiLogger, log,
} = require('../src').log;

const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);

it('numericLogLevel', () => {
  assert.strictEqual(numericLogLevel('fatal'), 0);
  assert.throws(() => numericLogLevel('foo'));
});

class BrokenInspect {
  [inspect.custom]() {
    throw new Error('42');
  }
}

class BrokenClassName {}
Object.defineProperty(BrokenClassName, 'name', {
  get() {
    throw new Error('90');
  },
});

it('tryInspect', async () => {
  const ck = (ref, what) => assert.strictEqual(tryInspect(what), ref);
  const logs = await recordAsyncLogs(async () => {
    ck('undefined', undefined);
    ck('42', 42);
    ck('{ foo: 42 }', { foo: 42 });
    ck('{ foo: [ 1, 2, 3, 4 ] }', { foo: [1, 2, 3, 4] });
    ck('BrokenInspect {}', new BrokenInspect());
    ck('{ foo: { bar: BrokenInspect {} } }', { foo: { bar: new BrokenInspect() } });
    ck('<<COULD NOT INSPECT>>', new BrokenClassName());
    ck('<<COULD NOT INSPECT>>', { foo: { bar: new BrokenClassName() } });

    // Wait a couple of ticks so we can be sure all the error messages
    // where printed
    for (let i = 0; i < 20; i += 1) {
      await nextTick();
    }
  });

  const filteredLogs = pipe(
    logs.split('\n'),
    filter((line) => line.startsWith('[ERROR]')),
    join('\n'),
  );

  assert.strictEqual(filteredLogs, multiline(`
    [ERROR] Error while inspecting object for log message: Error: 42
    [ERROR] Error while inspecting object for log message: Error: 42
    [ERROR] Error while inspecting object for log message: Error: 90
    [ERROR] Error while inspecting object for log message: Error: 90
    [ERROR] Error while inspecting object for log message: Error: 90
    [ERROR] Error while inspecting object for log message: Error: 90
  `));
});

it('serializeMessage', () => {
  const ck = (ref, ...msg) => assert.strictEqual(serializeMessage(msg), ref);
  ck('');
  ck('42', 42);
  ck('Hello 42 World', 'Hello', 42, 'World');
  ck('{ foo: 42 }', { foo: 42 });
  ck('{ foo: [ 1, 2, 3, 4 ] }', { foo: [1, 2, 3, 4] });

  class Foo {}
  const f = new Foo();
  f.bar = 42;
  ck('{ foo: Foo { bar: 42 } }', { foo: f });
});

it('jsonEncodeMessage', () => {
  class Foo {}
  const f = new Foo();
  f.bar = 42;
  assert.deepStrictEqual(
    JSON.parse(jsonEncodeMessage([{ foo: f }], { level: 'fatal' })),
    { level: 'fatal', message: '{ foo: Foo { bar: 42 } }' },
  );
});

class StringStream extends stream.Writable {
  constructor() {
    super();
    this._buf = [];
  }

  _write(chunk, enc, next) {
    this._buf.push(chunk);
    next();
  }

  extract() {
    const r = join(this._buf, '');
    this._buf = [];
    return r;
  }
}

/** Record stderr; strips all color */
const recordStderr = async (fn) => {
  const ss = new StringStream();
  const stderrBackup = console._stderr;
  try {
    console._stderr = ss;
    await fn();
  } finally {
    console._stderr = stderrBackup;
  }

  // Not testing color output here
  /* eslint-disable-next-line no-control-regex */
  return ss.extract().replace(/\x1b\[[0-9;]*m/g, '');
};

it('log()', async () => {
  const backup = rootLogger.loggers;
  try {
    rootLogger.loggers = null;

    // Just testing exception safety here; logging is tested
    // abundantly in testLogger
    const out = await recordStderr(() => err('Hello World', { foo: 42 }));
    assert(out.startsWith(multiline(`
      Failed to log message: Hello World { foo: 42 }
      Cause: TypeError: this.loggers is not iterable
    `)));
  } finally {
    rootLogger.loggers = backup;
  }
});

const logOutputDebug = multiline(`
  [ERROR] { foo: 23 }
  [FATAL] 
  [ERROR] 42
  [WARN] Hello 42 World
  [INFO] { foo: 42 }
  [VERBOSE] { foo: [ 1, 2, 3, 4 ] }
  [DEBUG] Nooo\n
`);

const logOutputInfo = multiline(`
  [ERROR] { foo: 23 }
  [FATAL] 
  [ERROR] 42
  [WARN] Hello 42 World
  [INFO] { foo: 42 }\n
`);

const logOutputWarn = multiline(`
  [ERROR] { foo: 23 }
  [FATAL] 
  [ERROR] 42
  [WARN] Hello 42 World\n
`);

const testLogger = (logger) => {
  const loggersBackup = rootLogger.loggers;

  try {
    rootLogger.loggers = dict({ default: logger });

    log([{ foo: 23 }], { level: 'error' });
    fatal();
    err(42);
    warn('Hello', 42, 'World');
    info({ foo: 42 });
    verbose({ foo: [1, 2, 3, 4] });
    debug('Nooo');
  } finally {
    rootLogger.loggers = loggersBackup;
  }
};

it('ConsoleLogger', async () => {
  let out = await recordStderr(() => testLogger(new ConsoleLogger({ level: 'debug' })));
  assert.strictEqual(out, logOutputDebug);

  out = await recordStderr(() => testLogger(new ConsoleLogger({ level: 'warn' })));
  assert.strictEqual(out, logOutputWarn);
});

it('StreamLogger', () => {
  const ss = new StringStream();

  testLogger(new StreamLogger(ss));
  assert.strictEqual(ss.extract(), logOutputInfo);

  testLogger(new StreamLogger(ss, { level: 'debug' }));
  assert.strictEqual(ss.extract(), logOutputDebug);

  testLogger(new StreamLogger(ss, { level: 'warn' }));
  assert.strictEqual(ss.extract(), logOutputWarn);
});

const endStreamAndSync = (str) => {
  const r = new Promise((res) => str.on('finish', () => res()));
  // It's important here that end is called after the promise is
  // installed since otherwise the finish event may be called before
  // the promise is setup => the promise is never resolved => infinite wait
  str.end();
  return r;
};

it('FileLogger', async () => {
  const tmpfile = `/tmp/helix-shared-testfile-${uuidgen()}.txt`;

  try {
    let logger = new FileLogger(tmpfile, { level: 'debug' });
    testLogger(logger);
    await endStreamAndSync(logger.stream);
    assert.strictEqual(await readFile(tmpfile, { encoding: 'utf-8' }), logOutputDebug);

    // Tests that append mode is properly used
    logger = new FileLogger(tmpfile, { level: 'warn' });
    testLogger(logger);
    await endStreamAndSync(logger.stream);
    assert.strictEqual(await readFile(tmpfile, { encoding: 'utf-8' }), `${logOutputDebug}${logOutputWarn}`);

    // Tests that append mode is properly used
    logger = new FileLogger(tmpfile);
    testLogger(logger);
    await endStreamAndSync(logger.stream);
    assert.strictEqual(await readFile(tmpfile, { encoding: 'utf-8' }), `${logOutputDebug}${logOutputWarn}${logOutputInfo}`);
  } finally {
    await unlink(tmpfile);
  }
});

it('MemLogger', () => {
  let logger = new MemLogger();
  testLogger(logger);
  assert.strictEqual(`${join(logger.buf, '\n')}\n`, logOutputInfo);

  logger = new MemLogger({ level: 'debug' });
  testLogger(logger);
  assert.strictEqual(`${join(logger.buf, '\n')}\n`, logOutputDebug);

  logger = new MemLogger({ level: 'warn' });
  testLogger(logger);
  assert.strictEqual(`${join(logger.buf, '\n')}\n`, logOutputWarn);
});

it('MultiLogger', async () => {
  const foo = new MemLogger({ level: 'debug' });
  const bar = new MemLogger({ level: 'debug' });
  const logger = new MultiLogger(dict({ foo, bar }));
  testLogger(logger);
  assert.strictEqual(`${join(foo.buf, '\n')}\n`, logOutputDebug);
  assert.strictEqual(`${join(bar.buf, '\n')}\n`, logOutputDebug);

  // ExceptionSafety

  foo.buf = null; // Intentionally break foo
  const backup = rootLogger.loggers;
  try {
    rootLogger.loggers = dict({ default: logger });
    info('Hello World');
  } finally {
    rootLogger.loggers = backup;
  }

  const logs = pipe(
    (`${join(bar.buf, '\n')}\n`).split('\n'),
    reject((line) => line.match(/^\s/)),
    map((line) => `${line}\n`),
    join(''),
  );

  assert.strictEqual(logs, logOutputDebug + multiline(`
    [INFO] Hello World
    [ERROR] MultiLogger encountered exception while logging to to MemLogger { level: 'debug', serializeOpts: {}, buf: null } :  TypeError: Cannot read property 'push' of null\n\n
  `));
});

it('recordLogs, assertLogs', () => {
  // assertLogs: without opts, recordLogs: with opts
  assertLogs(() => {
    info('Hello World');
    verbose('Foo');
    err('Bar');
  }, multiline(`
    [INFO] Hello World
    [ERROR] Bar\n
  `));

  // Default logger restored
  assert(rootLogger.loggers.get('default') instanceof ConsoleLogger);

  // assertLogs: with opts, recordLogs: with opts
  assertLogs({ level: 'warn' }, () => {
    info('Hello World');
    verbose('Foo');
    err('Bar');
  }, multiline(`
    [ERROR] Bar\n
  `));
  assert(rootLogger.loggers.get('default') instanceof ConsoleLogger);

  // recordLogs: with opts
  const logs = recordLogs(() => {
    info('Hello World');
    verbose('Foo');
    err('Bar');
  });
  assert(rootLogger.loggers.get('default') instanceof ConsoleLogger);
  assert.strictEqual(logs, multiline(`
    [INFO] Hello World
    [ERROR] Bar\n
  `));

  // Exception safety
  let ex;
  try {
    recordLogs(() => {
      throw new Error();
    });
  } catch (e) {
    ex = e;
  }
  assert(ex instanceof Error);
  assert(rootLogger.loggers.get('default') instanceof ConsoleLogger);
});

it('recordAsyncLogs, assertAsyncLogs', async () => {
  await assertAsyncLogs(async () => {
    info('Hello World');
    await sleep(1);
    verbose('Foo');
    await sleep(1);
    err('Bar');
  }, multiline(`
    [INFO] Hello World
    [ERROR] Bar\n
  `));
  assert(rootLogger.loggers.get('default') instanceof ConsoleLogger);

  await assertAsyncLogs({ level: 'warn' }, async () => {
    info('Hello World');
    await sleep(1);
    verbose('Foo');
    await sleep(1);
    err('Bar');
  }, multiline(`
    [ERROR] Bar\n
  `));
  assert(rootLogger.loggers.get('default') instanceof ConsoleLogger);

  const logs = await recordAsyncLogs(async () => {
    info('Hello World');
    await sleep(1);
    verbose('Foo');
    await sleep(1);
    err('Bar');
  });
  assert.strictEqual(logs, multiline(`
    [INFO] Hello World
    [ERROR] Bar\n
  `));
  assert(rootLogger.loggers.get('default') instanceof ConsoleLogger);

  // Exception safety
  let ex;
  try {
    await recordAsyncLogs(() => {
      throw new Error();
    });
  } catch (e) {
    ex = e;
  }
  assert(ex instanceof Error);
  assert(rootLogger.loggers.get('default') instanceof ConsoleLogger);
});
