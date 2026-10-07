'use strict';

/**
 * 服务入口：REST API + 每晚 12:00 定时刷新
 */

const express = require('express');
const config = require('./config');
const logger = require('./utils/logger');
const jobsApi = require('./api/jobs');
const userApi = require('./api/user');
const { startScheduler } = require('./scheduler');

const app = express();
app.use(express.json());

// 简单请求日志
app.use((req, res, next) => {
  res.on('finish', () => {
    logger.info(`${req.method} ${req.originalUrl} -> ${res.statusCode}`);
  });
  next();
});

app.get('/health', (req, res) => res.json({ code: 0, data: { status: 'ok', time: Date.now() } }));
app.use('/api', jobsApi);
app.use('/api/user', userApi);

// 启动定时任务（每晚 12:00 自动刷新收集）
startScheduler();

app.listen(config.port, () => {
  logger.info(`职位收集服务已启动: http://localhost:${config.port}`);
  logger.info(`当前职位总数: ${require('./db').count('jobs')}`);
});
