'use strict';

/**
 * 数据源：央企招聘（国务院国资委监管中央企业）
 * 主数据源：国聘网（国务院国资委指导的央企国企招聘平台）
 * 备用数据源：国务院国资委官网招聘专栏
 *
 * 说明：各站点页面结构可能调整，解析规则失效时该数据源会自动跳过并记录日志，
 * 不影响其他数据源运行。可在此处按需增加/修改解析规则。
 */

const cheerio = require('cheerio');
const { fetchPage, fetchJson } = require('../../utils/http');

const SOURCE = {
  id: 'central_soe',
  name: '央企招聘',
  category: 'central_soe'
};

/** 国聘网职位搜索接口（POST JSON） */
const IGOUPIN_API = 'https://www.iguopin.com/index.php?m=Home&c=Jobs&a=ajax_search';

/** 国务院国资委 招聘栏目 */
const SASAC_LIST = 'http://www.sasac.gov.cn/n2588035/n2587925/n2587935/index.html';

async function fetchFromIguopin() {
  const payload = {
    key: '',
    type: 'job',
    page: 1,
    page_size: 50,
    salary: '',
    education: '',
    experience: '',
    region: '',
    sort: 'update_time desc'
  };
  const json = await fetchJson(IGOUPIN_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: payload
  });

  const list = json?.data?.list || json?.data || json?.result?.list || [];
  return list.map((j) => ({
    externalId: String(j.id || j.job_id || j.jobid),
    title: j.job_name || j.position_name || j.title,
    company: j.company_name || j.cname,
    location: [j.city, j.district].filter(Boolean).join(' '),
    education: j.education || j.degree,
    experience: j.experience || j.work_year,
    salary: j.salary_text || j.salary,
    deadline: j.deadline || '',
    publishDate: j.update_time || j.create_time || '',
    description: j.job_desc || j.description,
    link: `https://www.iguopin.com/detail?id=${j.id || j.job_id}`,
    tags: (j.welfare || []).slice(0, 5)
  }));
}

async function fetchFromSasac() {
  const { text } = await fetchPage(SASAC_LIST, { encoding: 'gb18030' });
  const $ = cheerio.load(text);
  const items = [];
  // 招聘专栏常见结构：li > a + span(日期)
  $('li a').each((_, el) => {
    const $a = $(el);
    const title = $a.text().trim();
    const href = $a.attr('href') || '';
    if (!title || !href) return;
    const li = $a.closest('li');
    const dateText = li.find('span').last().text().trim();
    items.push({
      externalId: href,
      title,
      company: '国务院国资委',
      location: '北京',
      education: '',
      experience: '',
      salary: '',
      deadline: '',
      publishDate: dateText,
      description: '',
      link: href.startsWith('http') ? href : `http://www.sasac.gov.cn${href}`,
      tags: ['央企']
    });
  });
  return items;
}

/**
 * 抓取入口。任何数据源失败仅抛错给调度器记录，不影响整体。
 * @returns {Promise<Array>} 原始职位记录
 */
async function fetch() {
  const errors = [];
  let jobs = [];
  try {
    jobs = await fetchFromIguopin();
    if (jobs.length) return jobs;
  } catch (e) {
    errors.push(`国聘网: ${e.message}`);
  }
  try {
    jobs = await fetchFromSasac();
    if (jobs.length) return jobs;
  } catch (e) {
    errors.push(`国资委官网: ${e.message}`);
  }
  if (errors.length) throw new Error(errors.join(' | '));
  return jobs;
}

module.exports = { ...SOURCE, fetch };
