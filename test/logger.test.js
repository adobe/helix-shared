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
/* eslint-disable no-underscore-dangle,no-console */

const fs = require('fs-extra');
const path = require('path');
const assert = require('assert');
const stream = require('stream');
const winston = require('winston');
const { Logger } = require('../src/index.js');

const LOG_DIR = path.resolve(__dirname, 'tmp', 'logs');

describe('Logger tests', () => {
  const consoleLogs = [];
  let consoleStdout;

  const tty = new stream.Writable();
  tty._write = (chunk, encoding, done) => {
    consoleLogs.push(chunk.toString('utf-8'));
    done();
  };
  tty.isTTY = true;

  const notty = new stream.Writable();
  notty._write = (chunk, encoding, done) => {
    consoleLogs.push(chunk.toString('utf-8'));
    done();
  };
  notty.isTTY = false;

  beforeEach(async () => {
    await fs.remove(LOG_DIR);
    winston.loggers.loggers.clear();
    consoleStdout = console._stdout;
    console._stdout = tty;
    consoleLogs.length = 0;
  });

  afterEach(() => {
    console._stdout = consoleStdout;
  });

  it('returns a default logger', () => {
    const log = Logger.getLogger();
    assert.ok(log);
  });

  it('returns the same logger twice', () => {
    const log1 = Logger.getLogger('foo');
    const log2 = Logger.getLogger('foo');
    assert.strictEqual(log1, log2);
  });

  it('can set a log files', async () => {
    const file1 = path.resolve(LOG_DIR, 'f1.log');
    const file2 = path.resolve(LOG_DIR, 'f2.log');
    const file3 = path.resolve(LOG_DIR, 'f3.json');
    const log = Logger.getLogger({
      logFile: [file1, file2, file3],
    });

    log.info('hello, world');
    log.error('gnu not unix');
    log.end();

    // maybe not the best condition to wait for the streams to close
    await new Promise((r) => setTimeout(r, 100));
    const f1 = await fs.readFile(file1, 'utf-8');
    const f2 = await fs.readFile(file2, 'utf-8');
    const f3 = await fs.readFile(file3, 'utf-8');
    assert.ok(/.*hello, world.*/.test(f1));
    assert.ok(/.*hello, world.*/.test(f2));
    const r1 = JSON.parse(f3.split('\n')[0]);
    delete r1['@timestamp'];
    assert.deepEqual(r1, {
      '@fields': {
        level: 'info',
      },
      '@message': 'hello, world',
    });

    const r2 = JSON.parse(f3.split('\n')[1]);
    delete r2['@timestamp'];
    assert.deepEqual(r2, {
      '@fields': {
        level: 'error',
      },
      '@message': 'gnu not unix',
    });
  });

  it('suppressed logs for tty', async () => {
    const file1 = path.resolve(LOG_DIR, 'f1.log');
    const log = Logger.getLogger({
      category: 'cli',
      logFile: ['-', file1],
    });
    log.info('normal info');
    log.error('normal error');
    log.info({
      progress: true,
      level: 'info',
      message: 'progress info',
    });
    log.close();

    // maybe not the best condition to wait for the streams to close
    await new Promise((r) => setTimeout(r, 100));
    const f1 = await fs.readFile(file1, 'utf-8');
    assert.ok(/.*progress info.*/.test(f1));

    // also test tty output
    assert.deepEqual(consoleLogs, [
      'normal info\n',
      '\u001b[31merror\u001b[39m: normal error\n',
    ]);
  });

  it('all logs for no tty', async () => {
    const file1 = path.resolve(LOG_DIR, 'f1.log');
    const log = Logger.getLogger({
      category: 'cli',
      logFile: ['-', file1],
    });
    console._stdout = notty;
    log.info('normal info');
    log.info({
      progress: true,
      level: 'info',
      message: 'progress info',
    });
    log.close();

    // maybe not the best condition to wait for the streams to close
    await new Promise((r) => setTimeout(r, 100));
    const f1 = await fs.readFile(file1, 'utf-8');
    assert.ok(/.*progress info.*/.test(f1));

    // also test tty output
    assert.deepEqual(consoleLogs, [
      'normal info\n',
      'progress info\n',
    ]);
  });

  it('all logs for no cli categ', async () => {
    const file1 = path.resolve(LOG_DIR, 'f1.log');
    const log = Logger.getLogger({
      category: 'hlx',
      logFile: ['-', file1],
    });
    console._stdout = notty;
    log.info('normal info');
    log.info({
      progress: true,
      level: 'info',
      message: 'progress info',
    });
    log.close();

    // maybe not the best condition to wait for the streams to close
    await new Promise((r) => setTimeout(r, 100));
    const f1 = await fs.readFile(file1, 'utf-8');
    assert.ok(/.*progress info.*/.test(f1));

    // also test tty output
    assert.deepEqual(consoleLogs, [
      '[hlx] \u001b[32minfo\u001b[39m: normal info\n',
      '[hlx] \u001b[32minfo\u001b[39m: progress info\n',
    ]);
  });

  it('test logger works', async () => {
    const log = Logger.getTestLogger();
    log.debug('hello, world');
    log.info('hello, world');
    log.warn('hello, world');
    const output = await log.getOutput();
    assert.equal(output, 'info: hello, world\nwarn: hello, world\n');
  });

  it('test logger can set log level', async () => {
    const log = Logger.getTestLogger({ level: 'debug' });
    log.debug('hello, world');
    log.info('hello, world');
    log.warn('hello, world');
    const output = await log.getOutput();
    assert.equal(output, 'debug: hello, world\ninfo: hello, world\nwarn: hello, world\n');
  });

  it('test loggers are not recycled', async () => {
    const log1 = Logger.getTestLogger();
    const log2 = Logger.getTestLogger();
    assert.notStrictEqual(log1, log2);
  });
});
