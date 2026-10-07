/**
 * API 请求封装（Promise 化 wx.request）
 */
const config = require('./config');

function request(method, path, data) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: config.baseUrl + path,
      method,
      data,
      timeout: config.timeout,
      header: {
        'Content-Type': 'application/json',
        // 真实环境通过 wx.login 换取 openid 后注入
        'X-Openid': getApp().globalData.openid || 'default-user'
      },
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300 && res.data && res.data.code === 0) {
          resolve(res.data.data);
        } else {
          const msg = (res.data && res.data.message) || `请求失败(${res.statusCode})`;
          wx.showToast({ title: msg, icon: 'none' });
          reject(new Error(msg));
        }
      },
      fail(err) {
        wx.showToast({ title: '网络异常，请稍后重试', icon: 'none' });
        reject(err);
      }
    });
  });
}

module.exports = {
  get: (path, data) => request('GET', path, data),
  post: (path, data) => request('POST', path, data),
  del: (path) => request('DELETE', path)
};
