'use strict';

/**
 * 数据源：国企招聘（地方国企/省属企业）
 * 主数据源：国企招聘网（聚合地方国企招聘公告）
 * 备用：中智招聘 / 各地方国资委公告
 */

const cheerio = require('cheerio');
const { fetchPage } = require('../../utils/http');

const SOURCE = {
  id: 'state_owned',
  name: '国企招聘',
  category: 'state_owned'
};

// 国企招聘网（列表页，GBK 编码）
const GQZP_LIST = 'http://www.gqzhaopin.com/';
// 中智招聘国企专场（备用）
const CIZHIHAN_LIST = 'https://www.ciicjob.com/list.html';

/** 通用列表页解析：从 a 链接 + 日期文本中提取职位 */
function parseListPage(text, base, companyFallback) {
  const $ = cheerio.load(text);
  const items = [];
  $('a').each((_, el) => {
    const $a = $(el);
    const title = $a.text().trim();
    const href = $a.attr('href') || '';
    if (!title || title.length < 4) return;
    if (!/招聘|岗位|报名|公告|职位/.test(title)) return;
    // 就近找一个日期文本
    const scope = $a.closest('li').length ? $a.closest('li') : $a.parent();
    const dateText = scope.find('span, .date, .time, em').first().text().trim();
    const link = href.startsWith('http') ? href : base + href.replace(/^\.?\//, '');
    items.push({
      externalId: link,
      title,
      company: companyFallback,
      location: '',
      education: '',
      experience: '',
      salary: '',
      deadline: '',
      publishDate: dateText,
      description: '',
      link,
      tags: ['国企']
    });
  });
  return items.slice(0, 60);
}

async function fetch() {
  const errors = [];
  let jobs = [];
  try {
    const { text } = await fetchPage(GQZP_LIST, { encoding: 'gb18030' });
    jobs = parseListPage(text, GQZP_LIST, '国企招聘网');
    if (jobs.length) return jobs;
  } catch (e) {
    errors.push(`国企招聘网: ${e.message}`);
  }
  try {
    const { text } = await fetchPage(CIZHIHAN_LIST, { encoding: 'utf-8' });
    jobs = parseListPage(text, CIZHIHAN_LIST, '中智招聘');
    if (jobs.length) return jobs;
  } catch (e) {
    errors.push(`中智招聘: ${e.message}`);
  }
  if (errors.length) throw new Error(errors.join(' | '));
  return jobs;
}

module.exports = { ...SOURCE, fetch };
