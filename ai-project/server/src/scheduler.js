'use strict';

/**
 * 定时任务：每晚 12:00 自动刷新收集
 * 使用 node-cron，表达式与配置 cron 一致（默认 0 0 * * *）
 */

const cron = require('node-cron');
const config = require('./config');
const logger = require('./utils/logger');
const { runSync } = require('./crawler');

let task = null;

function startScheduler() {
  if (task) return task;
  logger.info(`定时任务已注册：每天 ${config.cron} 自动刷新`);
  task = cron.schedule(config.cron, async () => {
    logger.info('定时触发：开始自动刷新收集');
    try {
      await runSync();
    } catch (e) {
      logger.error('定时同步异常:', e.message);
    }
  });
  return task;
}

module.exports = { startScheduler };
