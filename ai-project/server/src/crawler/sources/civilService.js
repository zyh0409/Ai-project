'use strict';

/**
 * 数据源：公务员考试（国考/省考招考公告）
 * 主数据源：国家公务员局官网 中央机关及其直属机构考试录用公务员专题
 * 备用：各省人事考试网公告
 */

const cheerio = require('cheerio');
const { fetchPage } = require('../../utils/http');

const SOURCE = {
  id: 'civil_service',
  name: '公务员考试',
  category: 'civil_service'
};

// 中央机关及其直属机构考试录用公务员专题网站
const SCS_HOME = 'http://bm.scs.gov.cn/';
// 国家公务员局
const SCS_GOV = 'http://www.scs.gov.cn/zggwy/';
// 人事考试网（备用）
const RENSHI = 'http://www.cpta.com.cn/';

function parseAnnouncements(text, base, orgName, tags) {
  const $ = cheerio.load(text);
  const items = [];
  $('a').each((_, el) => {
    const $a = $(el);
    const title = $a.text().trim();
    const href = $a.attr('href') || '';
    if (!title || title.length < 6) return;
    if (!/(公告|招考|报名|录用|调剂|面试|笔试)/.test(title)) return;
    const scope = $a.closest('li').length ? $a.closest('li') : $a.parent();
    const dateText = scope.find('span, .date, .time, em').first().text().trim();
    const link = href.startsWith('http') ? href : base + href.replace(/^\.?\//, '');
    items.push({
      externalId: link,
      title,
      company: orgName,
      location: '',
      education: '',
      experience: '',
      salary: '',
      deadline: '',
      publishDate: dateText,
      description: '',
      link,
      tags
    });
  });
  return items.slice(0, 60);
}

async function fetch() {
  const errors = [];
  let jobs = [];
  try {
    const { text } = await fetchPage(SCS_HOME, { encoding: 'utf-8' });
    jobs = parseAnnouncements(text, SCS_HOME, '国家公务员局', ['国考']);
    if (jobs.length) return jobs;
  } catch (e) {
    errors.push(`公务员专题网站: ${e.message}`);
  }
  try {
    const { text } = await fetchPage(SCS_GOV, { encoding: 'utf-8' });
    jobs = parseAnnouncements(text, SCS_GOV, '国家公务员局', ['国考']);
    if (jobs.length) return jobs;
  } catch (e) {
    errors.push(`国家公务员局: ${e.message}`);
  }
  try {
    const { text } = await fetchPage(RENSHI, { encoding: 'utf-8' });
    jobs = parseAnnouncements(text, RENSHI, '中国人事考试网', ['人事考试']);
    if (jobs.length) return jobs;
  } catch (e) {
    errors.push(`人事考试网: ${e.message}`);
  }
  if (errors.length) throw new Error(errors.join(' | '));
  return jobs;
}

module.exports = { ...SOURCE, fetch };
