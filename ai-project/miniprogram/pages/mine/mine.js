const api = require('../../utils/api');

Page({
  data: {
    favorites: [],
    subscriptions: [],
    newKeyword: '',
    stats: null
  },

  onShow() {
    this.loadFavorites();
    this.loadSubscriptions();
    this.loadStats();
  },

  loadFavorites() {
    api.get('/favorites').then((favs) => this.setData({ favorites: favs })).catch(() => {});
  },

  loadSubscriptions() {
    api.get('/subscriptions').then((subs) => this.setData({ subscriptions: subs })).catch(() => {});
  },

  loadStats() {
    api.get('/stats').then((stats) => this.setData({ stats })).catch(() => {});
  },

  onKeywordInput(e) {
    this.setData({ newKeyword: e.detail.value });
  },

  addSubscription() {
    const kw = this.data.newKeyword.trim();
    if (!kw) {
      wx.showToast({ title: '请输入关键词', icon: 'none' });
      return;
    }
    api.post('/subscriptions', { keyword: kw }).then(() => {
      this.setData({ newKeyword: '' });
      this.loadSubscriptions();
      wx.showToast({ title: '订阅成功', icon: 'success' });
    }).catch(() => {});
  },

  removeSubscription(e) {
    const id = e.currentTarget.dataset.id;
    api.del(`/subscriptions/${id}`).then(() => this.loadSubscriptions()).catch(() => {});
  },

  removeFavorite(e) {
    const id = e.currentTarget.dataset.id;
    api.del(`/favorites/${id}`).then(() => this.loadFavorites()).catch(() => {});
  },

  goDetail(e) {
    wx.navigateTo({ url: `/pages/detail/detail?id=${e.currentTarget.dataset.id}` });
  }
});
