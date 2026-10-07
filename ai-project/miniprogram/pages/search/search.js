const api = require('../../utils/api');

const CATEGORIES = [
  { key: '', name: '全部' },
  { key: 'central_soe', name: '央企' },
  { key: 'state_owned', name: '国企' },
  { key: 'civil_service', name: '公务员' },
  { key: 'big_company', name: '大厂社招' }
];

const EDUCATIONS = ['', '大专及以上', '本科及以上', '硕士及以上', '博士'];
const LOCATIONS = ['', '北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京', '苏州'];

Page({
  data: {
    categories: CATEGORIES,
    educations: EDUCATIONS,
    locations: LOCATIONS,
    keyword: '',
    category: '',
    education: '',
    location: '',
    results: [],
    searched: false
  },

  onKeywordInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  selectCategory(e) {
    this.setData({ category: e.currentTarget.dataset.key });
  },

  selectEducation(e) {
    this.setData({ education: e.currentTarget.dataset.value });
  },

  selectLocation(e) {
    this.setData({ location: e.currentTarget.dataset.value });
  },

  onSearch() {
    const { keyword, category, education, location } = this.data;
    api.get('/jobs', { keyword, category, education, location, size: 50 }).then((res) => {
      this.setData({ results: res.items, searched: true });
    }).catch(() => {});
  },

  clearFilters() {
    this.setData({ keyword: '', category: '', education: '', location: '' });
    this.onSearch();
  },

  goDetail(e) {
    wx.navigateTo({ url: `/pages/detail/detail?id=${e.currentTarget.dataset.id}` });
  }
});
