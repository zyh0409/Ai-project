// app.js
App({
  globalData: {
    // 登录态（真实环境应通过 wx.login 换取 openid）
    openid: 'default-user'
  },
  onLaunch() {
    // 首次启动时同步一次最新职位
    const api = require('./utils/api');
    api.get('/jobs', { size: 1 }).catch(() => {});
  }
});
