'use strict';

const path = require('path');

const ROOT = path.resolve(__dirname, '..');

module.exports = {
  // 服务端口
  port: process.env.PORT || 3000,

  // 数据存储目录
  dataDir: path.join(ROOT, 'data'),

  // 每晚 12:00 定时刷新（cron 表达式）
  cron: process.env.CRON || '0 0 * * *',

  // 同步超时（毫秒）
  syncTimeout: 120000,

  // 数据源开关
  sources: {
    centralSoe: { enabled: true },   // 央企招聘
    stateOwned: { enabled: true },   // 国企招聘
    civilService: { enabled: true }, // 公务员考试
    bigCompany: { enabled: true }    // 大企业社招
  },

  // 抓取请求配置
  http: {
    timeout: 20000,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    },
    // 代理（从环境变量读取，支持 HTTP_PROXY / HTTPS_PROXY）
    proxy: process.env.HTTPS_PROXY || process.env.HTTP_PROXY || undefined
  }
};
