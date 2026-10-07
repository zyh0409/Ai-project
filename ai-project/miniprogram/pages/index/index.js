const api = require('../../utils/api');

const CATEGORIES = [
  { key: '', name: '全部' },
  { key: 'central_soe', name: '央企招聘' },
  { key: 'state_owned', name: '国企招聘' },
  { key: 'civil_service', name: '公务员考试' },
  { key: 'big_company', name: '大企业社招' }
];

Page({
  data: {
    categories: CATEGORIES,
    activeCategory: '',
    jobs: [],
    page: 1,
    size: 15,
    hasMore: true,
    loading: false,
    lastSyncText: ''
  },

  onLoad() {
    this.loadJobs(true);
    this.loadStats();
  },

  onPullDownRefresh() {
    this.loadJobs(true).then(() => {
      this.loadStats();
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    this.loadJobs(false);
  },

  loadJobs(reset) {
    if (this.data.loading) return Promise.resolve();
    const page = reset ? 1 : this.data.page + 1;
    if (!reset && !this.data.hasMore) return Promise.resolve();
    this.setData({ loading: true });

    return api
      .get('/jobs', {
        category: this.data.activeCategory,
        page,
        size: this.data.size
      })
      .then((res) => {
        const jobs = reset ? res.items : this.data.jobs.concat(res.items);
        this.setData({
          jobs,
          page,
          hasMore: jobs.length < res.total,
          loading: false
        });
      })
      .catch(() => this.setData({ loading: false }));
  },

  loadStats() {
    api.get('/stats').then((res) => {
      if (res.lastSync) {
        const d = new Date(res.lastSync.finishedAt);
        this.setData({ lastSyncText: `上次更新 ${d.getMonth() + 1}-${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` });
      }
    }).catch(() => {});
  },

  switchCategory(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ activeCategory: key, jobs: [], page: 1, hasMore: true });
    this.loadJobs(true);
  },

  goDetail(e) {
    wx.navigateTo({ url: `/pages/detail/detail?id=${e.currentTarget.dataset.id}` });
  }
});
