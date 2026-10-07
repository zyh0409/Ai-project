'use strict';

/**
 * 种子数据脚本：生成各分类示例职位
 * 用途：在真实数据源不可用/未配置时，保证小程序开箱即有数据展示。
 * 运行：npm run seed
 */

const db = require('../db');
const logger = require('../utils/logger');
const { normalize } = require('../utils/normalize');

const now = Date.now();
const DAY = 86400000;

// [sourceId, sourceName, category]
const META = {
  central_soe: { sourceId: 'central_soe', sourceName: '央企招聘', category: 'central_soe' },
  state_owned: { sourceId: 'state_owned', sourceName: '国企招聘', category: 'state_owned' },
  civil_service: { sourceId: 'civil_service', sourceName: '公务员考试', category: 'civil_service' },
  big_company: { sourceId: 'big_company', sourceName: '大企业社招', category: 'big_company' }
};

const RAW = [
  // ===== 央企招聘 =====
  { m: 'central_soe', title: '中国石化2025年度校园招聘', company: '中国石油化工集团有限公司', location: '北京 朝阳', education: '本科及以上', experience: '应届毕业生', salary: '10-15K', deadline: '2026-11-30', publishDate: '今天', description: '面向2025届毕业生，招聘化工、机械、电气、财务、法律等岗位，五险一金+企业年金。', tags: ['五险一金', '企业年金', '央企'] },
  { m: 'central_soe', title: '国家电网2025年第一批招聘公告', company: '国家电网有限公司', location: '北京', education: '硕士及以上', experience: '应届毕业生', salary: '面议', deadline: '2026-12-15', publishDate: '2026-10-05', description: '招聘电气工程、计算机、通信、财务等专业，提供有竞争力的薪酬与完善的职业发展通道。', tags: ['央企', '电气'] },
  { m: 'central_soe', title: '中国建筑集团社会招聘-项目管理岗', company: '中国建筑集团有限公司', location: '深圳', education: '本科及以上', experience: '3年以上', salary: '15-25K', deadline: '2026-11-20', publishDate: '2026-10-03', description: '负责大型工程项目的统筹管理，具有一级建造师证书者优先。', tags: ['社招', '项目管理'] },
  { m: 'central_soe', title: '中国移动研究院招聘-算法工程师', company: '中国移动通信集团', location: '北京 西城', education: '硕士及以上', experience: '不限', salary: '20-40K', deadline: '2026-12-01', publishDate: '2026-10-02', description: '从事通信网络智能优化算法研发，参与国家级科研项目。', tags: ['算法', '央企'] },
  { m: 'central_soe', title: '中国商飞招聘-飞机设计工程师', company: '中国商用飞机有限责任公司', location: '上海 浦东', education: '硕士及以上', experience: '不限', salary: '18-30K', deadline: '2026-11-25', publishDate: '2026-10-01', description: '参与大型客机总体设计与气动布局研究，航空航天类专业优先。', tags: ['航空', '央企'] },
  { m: 'central_soe', title: '中国中车招聘-机械工程师', company: '中国中车集团有限公司', location: '株洲', education: '本科及以上', experience: '1-3年', salary: '10-16K', deadline: '2026-12-10', publishDate: '2026-09-28', description: '负责轨道交通装备机械结构设计、仿真与优化。', tags: ['轨道交通', '央企'] },

  // ===== 国企招聘 =====
  { m: 'state_owned', title: '上汽集团2025年社会招聘', company: '上海汽车集团股份有限公司', location: '上海', education: '本科及以上', experience: '不限', salary: '12-20K', deadline: '2026-11-18', publishDate: '2026-10-06', description: '招聘汽车研发、智能制造、市场运营等多类岗位，国企福利完善。', tags: ['汽车', '国企'] },
  { m: 'state_owned', title: '首钢集团招聘-财务管理人员', company: '首钢集团有限公司', location: '北京 石景山', education: '本科及以上', experience: '3年以上', salary: '10-18K', deadline: '2026-11-30', publishDate: '2026-10-05', description: '负责集团财务核算与预算管理，持注册会计师证书者优先。', tags: ['财务', '国企'] },
  { m: 'state_owned', title: '上海城投招聘-工程管理岗', company: '上海城投（集团）有限公司', location: '上海', education: '本科及以上', experience: '2年以上', salary: '12-20K', deadline: '2026-12-05', publishDate: '2026-10-04', description: '负责城市基础设施项目的建设管理与协调。', tags: ['工程', '国企'] },
  { m: 'state_owned', title: '广东能源集团招聘-新能源开发', company: '广东省能源集团有限公司', location: '广州', education: '硕士及以上', experience: '不限', salary: '15-25K', deadline: '2026-11-22', publishDate: '2026-10-03', description: '从事风电、光伏等新能源项目的开发与运营。', tags: ['新能源', '国企'] },
  { m: 'state_owned', title: '山东重工集团招聘-机械工程师', company: '山东重工集团有限公司', location: '济南', education: '本科及以上', experience: '1-3年', salary: '10-15K', deadline: '2026-12-08', publishDate: '2026-09-30', description: '负责重型装备的机械设计与制造工艺。', tags: ['装备制造', '国企'] },
  { m: 'state_owned', title: '北京燃气集团招聘-安全管理岗', company: '北京市燃气集团有限责任公司', location: '北京', education: '本科及以上', experience: '2年以上', salary: '9-14K', deadline: '2026-11-28', publishDate: '2026-09-29', description: '负责燃气输配安全体系建设与现场安全管理。', tags: ['安全', '国企'] },

  // ===== 公务员考试 =====
  { m: 'civil_service', title: '2026年国家公务员考试录用公告', company: '国家公务员局', location: '全国', education: '本科及以上', experience: '不限', salary: '按国家规定', deadline: '2026-10-25', publishDate: '2026-10-06', description: '2026年度中央机关及其直属机构考试录用公务员，计划招录3.9万人，报名时间10月15日至24日。', tags: ['国考', '公告'] },
  { m: 'civil_service', title: '2026年北京市公务员考试公告', company: '北京市公务员局', location: '北京', education: '本科及以上', experience: '不限', salary: '按国家规定', deadline: '2026-11-08', publishDate: '2026-10-04', description: '北京市各级机关2026年度考试录用公务员，含市级机关与区县岗位。', tags: ['省考', '北京'] },
  { m: 'civil_service', title: '2026年广东省公务员招考公告', company: '广东省人事考试中心', location: '广东', education: '大专及以上', experience: '不限', salary: '按国家规定', deadline: '2026-11-15', publishDate: '2026-10-03', description: '广东省2026年考试录用公务员，涵盖珠三角及粤东西北地区岗位。', tags: ['省考', '广东'] },
  { m: 'civil_service', title: '2026年中央机关遴选公务员公告', company: '国家公务员局', location: '北京', education: '本科及以上', experience: '2年以上基层工作经历', salary: '按国家规定', deadline: '2026-11-02', publishDate: '2026-10-01', description: '中央机关面向基层公开遴选公务员，报名条件以公告为准。', tags: ['遴选', '公告'] },
  { m: 'civil_service', title: '2026年上海市公务员考试公告', company: '上海市公务员局', location: '上海', education: '本科及以上', experience: '不限', salary: '按国家规定', deadline: '2026-11-12', publishDate: '2026-09-29', description: '上海市2026年度考试录用公务员公告，含专业类别划分说明。', tags: ['省考', '上海'] },
  { m: 'civil_service', title: '2026年国家公务员补充录用公告', company: '国家公务员局', location: '全国', education: '本科及以上', experience: '不限', salary: '按国家规定', deadline: '2026-12-01', publishDate: '2026-09-27', description: '面向2026年度国考笔试合格考生进行补充录用，具体岗位以专题网站发布为准。', tags: ['国考', '补录'] },

  // ===== 大企业社招 =====
  { m: 'big_company', title: '华为技术有限公司招聘-高级软件工程师', company: '华为技术有限公司', location: '深圳', education: '本科及以上', experience: '3年以上', salary: '30-60K', deadline: '2026-12-31', publishDate: '2026-10-06', description: '负责分布式系统核心模块研发，熟悉C++/Go，有高并发经验者优先。', tags: ['软件', '深圳'] },
  { m: 'big_company', title: '腾讯招聘-产品经理（社招）', company: '腾讯科技（深圳）有限公司', location: '深圳', education: '本科及以上', experience: '3年以上', salary: '25-50K', deadline: '2026-12-20', publishDate: '2026-10-05', description: '负责社交/内容类产品规划与运营，具备优秀的数据分析能力。', tags: ['产品', '互联网'] },
  { m: 'big_company', title: '阿里巴巴招聘-数据科学家', company: '阿里巴巴集团', location: '杭州', education: '硕士及以上', experience: '2年以上', salary: '30-55K', deadline: '2026-12-15', publishDate: '2026-10-04', description: '从事电商推荐系统算法研发，熟悉机器学习与深度学习框架。', tags: ['算法', '电商'] },
  { m: 'big_company', title: '字节跳动招聘-前端开发工程师', company: '字节跳动', location: '北京', education: '本科及以上', experience: '2年以上', salary: '25-45K', deadline: '2026-12-18', publishDate: '2026-10-03', description: '负责产品前端架构与性能优化，熟悉React/Vue生态。', tags: ['前端', '北京'] },
  { m: 'big_company', title: '宁德时代招聘-电池研发工程师', company: '宁德时代新能源科技股份有限公司', location: '宁德', education: '硕士及以上', experience: '不限', salary: '20-35K', deadline: '2026-11-30', publishDate: '2026-10-02', description: '从事动力电池材料与电芯研发，电化学/材料专业优先。', tags: ['新能源', '电池'] },
  { m: 'big_company', title: '比亚迪招聘-整车研发工程师', company: '比亚迪股份有限公司', location: '深圳', education: '本科及以上', experience: '1年以上', salary: '15-30K', deadline: '2026-12-10', publishDate: '2026-10-01', description: '负责整车车身/底盘设计与开发，掌握CATIA者优先。', tags: ['汽车', '研发'] },
  { m: 'big_company', title: '美团招聘-运营经理', company: '美团', location: '北京', education: '本科及以上', experience: '3年以上', salary: '20-35K', deadline: '2026-12-05', publishDate: '2026-09-30', description: '负责本地生活业务运营策略制定与执行。', tags: ['运营', '本地生活'] },
  { m: 'big_company', title: '小米集团招聘-硬件工程师', company: '小米科技有限责任公司', location: '北京', education: '本科及以上', experience: '2年以上', salary: '20-40K', deadline: '2026-12-08', publishDate: '2026-09-28', description: '负责智能硬件产品硬件设计与测试验证。', tags: ['硬件', '智能'] }
];

const stat = db.bulkUpsert(
  'jobs',
  RAW.map((r) => normalize(r, META[r.m]))
);

logger.info(`种子数据写入完成：新增 ${stat.added} 条，更新 ${stat.updated} 条，职位总数 ${stat.total}`);
