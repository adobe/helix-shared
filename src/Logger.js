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

'use strict';

const path = require('path');
const winston = require('winston');
const fs = require('fs-extra');
const { MESSAGE, LEVEL } = require('triple-beam');

const MY_LEVELS = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    verbose: 3,
    debug: 4,
    silly: 5,
  },
  colors: {
    // use default colors
  },
};

/**
 * Winston format that suppresses messages when the `info.progress` is `true` and console._stdout
 * is a TTY. This is used to log steps during a progress meter.
 */
const progressFormat = winston.format((info) => {
  // eslint-disable-next-line no-underscore-dangle,no-console
  if (info.progress && console._stdout.isTTY) {
    return false;
  }
  return info;
});

/**
 * Winston format that is used for a command line application where `info` messages are rendered
 * without level.
 */
const commandLineFormat = winston.format((info) => {
  if (info[LEVEL] === 'info') {
    // eslint-disable-next-line no-param-reassign
    info[MESSAGE] = `${info.message}`;
  } else {
    // eslint-disable-next-line no-param-reassign
    info[MESSAGE] = `${info.level}: ${info.message}`;
  }
  return info;
});


function getLogger(config) {
  let categ;
  if (typeof config === 'string') {
    categ = config;
  } else {
    categ = (config && config.category) || 'hlx';
  }

  if (winston.loggers.has(categ)) {
    return winston.loggers.get(categ);
  }

  const level = (config && config.level) || (this && this.level) || 'info';
  const logsDir = path.normalize((config && config.logsDir) || 'logs');

  const logFiles = config && Array.isArray(config.logFile)
    ? config.logFile
    : ['-', (config && config.logFile) || path.join(logsDir, `${categ}-server.log`)];

  const transports = [];
  logFiles.forEach((logFile) => {
    if (logFile === '-') {
      const formats = [];
      if (categ === 'cli') {
        formats.push(progressFormat());
        formats.push(winston.format.colorize());
        formats.push(commandLineFormat());
      } else {
        formats.push(winston.format.colorize());
        formats.push(winston.format.printf(info => `[${categ}] ${info.level}: ${info.message}`));
      }
      transports.push(new winston.transports.Console({
        level,
        format: winston.format.combine(...formats),
      }));
    } else {
      fs.ensureDirSync(path.dirname(logFile));
      transports.push(new winston.transports.File({
        level: 'debug',
        filename: logFile,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`),
        ),
      }));
    }
  });

  const logger = winston.loggers.add(categ, {
    level,
    levels: MY_LEVELS.levels,
    transports,
  });
  logger.getLogger = getLogger.bind(logger);
  winston.addColors(MY_LEVELS.colors);
  return logger;
}

// configure with defaults
module.exports.getLogger = getLogger;
