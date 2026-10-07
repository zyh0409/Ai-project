/**
 * 后端接口地址配置
 * 注意：部署到线上后，需在小程序管理后台「开发管理-服务器域名」中
 * 配置 request 合法域名，且必须为 https。
 */
module.exports = {
  // 本地调试地址（微信开发者工具需勾选「不校验合法域名」）
  baseUrl: 'http://localhost:3000/api',
  timeout: 15000
};
