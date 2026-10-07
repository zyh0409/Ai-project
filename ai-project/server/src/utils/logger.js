'use strict';

/** 简单日志工具：带时间戳与控制台分级输出 */

function ts() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function log(level, ...args) {
  const msg = args.map(String).join(' ');
  // eslint-disable-next-line no-console
  console.log(`[${ts()}] [${level.toUpperCase()}] ${msg}`);
}

module.exports = {
  info: (...args) => log('info', ...args),
  warn: (...args) => log('warn', ...args),
  error: (...args) => log('error', ...args)
};
