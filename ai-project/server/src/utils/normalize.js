'use strict';

/**
 * 职位数据规范化工具
 * 各数据源抓到的原始记录统一转为标准 job 结构
 */

const crypto = require('crypto');

const CATEGORIES = {
  central_soe: '央企招聘',
  state_owned: '国企招聘',
  civil_service: '公务员考试',
  big_company: '大企业社招'
};

/** 生成稳定 id：sourceId + externalId 的哈希 */
function jobId(sourceId, externalId) {
  return crypto
    .createHash('md5')
    .update(`${sourceId}:${externalId}`)
    .digest('hex');
}

/** 清洗文本：去空白、去 HTML 标签 */
function cleanText(str) {
  if (!str) return '';
  return String(str)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&amp;|&lt;|&gt;|&quot;/g, (m) => {
      const map = { '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"' };
      return map[m];
    })
    .replace(/\s+/g, ' ')
    .trim();
}

/** 解析常见日期格式为时间戳，失败返回 null */
function parseDate(str) {
  if (!str) return null;
  const s = cleanText(str);
  // 2024-03-05、2024/03/05、2024年3月5日
  const m = s.match(
    /(\d{4})[年/-](\d{1,2})[月/-](\d{1,2})(?:日)?/
  );
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]).getTime();
  // 今天/明天/昨天
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  if (s.includes('今天')) return now.getTime();
  if (s.includes('明天')) return now.getTime() + 86400000;
  if (s.includes('昨天')) return now.getTime() - 86400000;
  return null;
}

/** 归一化学历要求 */
function normEducation(str) {
  if (!str) return '';
  const s = cleanText(str);
  if (s.includes('博士')) return '博士';
  if (s.includes('硕士')) return '硕士及以上';
  if (s.includes('本科')) return '本科及以上';
  if (s.includes('大专') || s.includes('专科')) return '大专及以上';
  return s.slice(0, 30);
}

/**
 * 将数据源返回的原始记录标准化
 * @param {object} raw
 * @param {object} meta { sourceId, sourceName, category }
 */
function normalize(raw, meta) {
  const title = cleanText(raw.title);
  const externalId = raw.externalId || title;
  return {
    id: jobId(meta.sourceId, externalId),
    sourceId: meta.sourceId,
    sourceName: meta.sourceName,
    category: meta.category,
    categoryName: CATEGORIES[meta.category] || meta.category,
    title,
    company: cleanText(raw.company),
    location: cleanText(raw.location),
    education: normEducation(raw.education),
    experience: cleanText(raw.experience),
    salary: cleanText(raw.salary),
    deadline: parseDate(raw.deadline),
    deadlineText: cleanText(raw.deadline),
    publishDate: parseDate(raw.publishDate),
    publishDateText: cleanText(raw.publishDate),
    description: cleanText(raw.description).slice(0, 2000),
    link: raw.link || '',
    tags: Array.isArray(raw.tags) ? raw.tags.slice(0, 5) : []
  };
}

module.exports = { CATEGORIES, jobId, cleanText, parseDate, normEducation, normalize };
