const api = require('../../utils/api');

Page({
  data: {
    id: '',
    job: null,
    favorited: false,
    loading: true
  },

  onLoad(options) {
    this.setData({ id: options.id });
    this.loadDetail();
  },

  loadDetail() {
    api.get(`/jobs/${this.data.id}`).then((job) => {
      this.setData({ job, loading: false });
      // 判断是否已收藏
      api.get('/favorites').then((favs) => {
        const favorited = favs.some((f) => f.id === job.id);
        this.setData({ favorited });
      }).catch(() => {});
    }).catch(() => this.setData({ loading: false }));
  },

  toggleFavorite() {
    if (!this.data.job) return;
    const { id, favorited } = this.data;
    const req = favorited ? api.del(`/favorites/${id}`) : api.post('/favorites', { jobId: id });
    req.then(() => {
      this.setData({ favorited: !favorited });
      wx.showToast({ title: favorited ? '已取消收藏' : '收藏成功', icon: 'success' });
    }).catch(() => {});
  },

  openLink() {
    const { link } = this.data.job;
    if (!link) {
      wx.showToast({ title: '暂无原文链接', icon: 'none' });
      return;
    }
    wx.setClipboardData({ data: link });
  },

  goSearch() {
    wx.switchTab({ url: '/pages/search/search' });
  }
});
