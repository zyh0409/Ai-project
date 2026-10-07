'use strict';

/**
 * 数据源：大企业社招（头部大厂/名企社会招聘）
 * 主数据源：拉勾/智联等聚合招聘公开页面（best-effort 解析）
 * 说明：企业官网招聘页通常为 JS 动态渲染且风控严格，此处演示
 *       "通用列表页解析" 模式，生产环境可按需接入官方开放 API。
 */

const cheerio = require('cheerio');
const { fetchPage } = require('../../utils/http');

const SOURCE = {
  id: 'big_company',
  name: '大企业社招',
  category: 'big_company'
};

// 备用：拉勾网社会招聘（公开列表）
const LAGOU = 'https://www.lagou.com/zhaopin/';
// 智联招聘（备用）
const ZHAOPIN = 'https://sou.zhaopin.com/?jl=530&kw=社招';

function parseListPage(text, base, companyFallback, tags) {
  const $ = cheerio.load(text);
  const items = [];
  $('a').each((_, el) => {
    const $a = $(el);
    const title = $a.text().trim();
    const href = $a.attr('href') || '';
    if (!title || title.length < 4) return;
    if (!/(招聘|工程师|经理|专员|顾问|设计师|运营|产品|开发|测试|运维)/.test(title)) return;
    const scope = $a.closest('li').length ? $a.closest('li') : $a.parent();
    const meta = scope.text().replace(/\s+/g, ' ');
    const locationMatch = meta.match(/(北京|上海|广州|深圳|杭州|成都|武汉|南京|苏州|西安|长沙|天津|重庆)/);
    const salaryMatch = meta.match(/(\d+[Kk]?-\d+[Kk]?|面议)/);
    const link = href.startsWith('http') ? href : base + href.replace(/^\.?\//, '');
    items.push({
      externalId: link,
      title,
      company: companyFallback,
      location: locationMatch ? locationMatch[1] : '',
      education: '',
      experience: '',
      salary: salaryMatch ? salaryMatch[1] : '',
      deadline: '',
      publishDate: '',
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
    const { text } = await fetchPage(LAGOU, { encoding: 'utf-8' });
    jobs = parseListPage(text, LAGOU, '拉勾网', ['社招']);
    if (jobs.length) return jobs;
  } catch (e) {
    errors.push(`拉勾网: ${e.message}`);
  }
  try {
    const { text } = await fetchPage(ZHAOPIN, { encoding: 'utf-8' });
    jobs = parseListPage(text, ZHAOPIN, '智联招聘', ['社招']);
    if (jobs.length) return jobs;
  } catch (e) {
    errors.push(`智联招聘: ${e.message}`);
  }
  if (errors.length) throw new Error(errors.join(' | '));
  return jobs;
}

module.exports = { ...SOURCE, fetch };
