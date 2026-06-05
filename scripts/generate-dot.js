/**
 * 生成佛山企业点位模拟数据
 * 运行: node scripts/generate-dot.js
 * 输出: static/dot-1.json
 */
const fs = require('fs')
const path = require('path')

// 佛山五区
const districts = ['禅城区', '南海区', '顺德区', '三水区', '高明区']

// 行业
const industries = [
  '电气机械和器材制造业', '计算机、通信和其他电子设备制造业', '金属制品业',
  '非金属矿物制品业', '橡胶和塑料制品业', '通用设备制造业',
  '专用设备制造业', '汽车制造业', '纺织服装、服饰业',
  '家具制造业', '食品制造业', '医药制造业',
  '化学原料和化学制品制造业', '软件和信息技术服务业', '商务服务业',
  '批发业', '零售业', '互联网和相关服务',
  '研究和试验发展', '专业技术服务业', '科技推广和应用服务业',
  '建筑装饰、装修和其他建筑业', '房地产业', '餐饮业',
]

// 企业名称前缀
const namePrefixes = [
  '佛山市', '广东', '佛山', '佛山市南海', '佛山市顺德',
  '佛山市禅城', '佛山市三水', '佛山市高明',
]

// 企业名称核心词
const nameCores = [
  '宏创', '兴达', '金科', '德丰', '华瑞', '永昌', '泰和',
  '恒通', '明辉', '盛达', '源兴', '富华', '嘉盛', '瑞丰',
  '鼎盛', '盈科', '智造', '精工', '华兴', '润达',
  '博创', '新纪元', '领航', '卓越', '创鑫', '睿智',
  '顺盈', '瀚海', '天元', '中科', '万福', '鹏程',
  '博源', '佳信', '众联', '凯旋', '安达', '信达',
]

// 企业类型后缀
const nameSuffixes = [
  '有限公司', '科技有限公司', '实业有限公司', '制造有限公司',
  '贸易有限公司', '电子有限公司', '机械有限公司', '精密制造有限公司',
  '新材料有限公司', '智能科技有限公司', '信息技术有限公司',
  '环保科技有限公司', '机械设备有限公司', '电器有限公司',
  '智能装备有限公司', '供应链管理有限公司',
]

// 荣誉/资质
const honors = [
  '国家高新技术企业', '广东省专精特新企业', '广东省工程技术研究中心',
  '佛山市企业技术中心', '广东省著名商标', '中国驰名商标',
  'ISO9001认证', 'ISO14001认证', '国家知识产权优势企业',
  '广东省创新型企业', '佛山市百强企业', 'AAA级信用企业',
  '省级企业技术中心', '广东省智能制造试点示范',
  '国家科技型中小企业', '纳税超千万企业',
]

// 标签
const tags = [
  '高新技术企业', '科技型中小企业', '专精特新', '制造业龙头',
  '数字化转型示范', '绿色工厂', '出口创汇企业', '瞪羚企业',
  '隐形冠军', '上市后备企业', '规上企业', '创新型中小企业',
]

// 细分领域
const subdomains = [
  '智能家居', '工业机器人', '新能源汽车零部件', '高端装备制造',
  '半导体封装测试', 'LED照明', '陶瓷建材', '不锈钢加工',
  '纺织面料', '家具设计制造', '食品饮料加工', '生物医药',
  '电子商务', '软件开发', '工业设计', '精密模具',
  '环保设备', '冷链物流', '自动化设备', '新材料研发',
]

// 佛山五区的街道/镇
const towns = {
  '禅城区': ['祖庙街道', '石湾镇街道', '张槎街道', '南庄镇'],
  '南海区': ['桂城街道', '九江镇', '西樵镇', '丹灶镇', '狮山镇', '大沥镇', '里水镇'],
  '顺德区': ['大良街道', '容桂街道', '伦教街道', '勒流街道', '陈村镇', '北滘镇', '乐从镇', '龙江镇', '杏坛镇', '均安镇'],
  '三水区': ['西南街道', '云东海街道', '白坭镇', '乐平镇', '芦苞镇', '大塘镇', '南山镇'],
  '高明区': ['荷城街道', '杨和镇', '明城镇', '更合镇'],
}

// 道路名
const roadNames = [
  '工业大道', '科技路', '创业路', '兴业路', '发展大道',
  '建设路', '创新路', '富华路', '腾飞路', '振华路',
  '华宝路', '季华路', '桂澜路', '佛山大道', '岭南大道',
  '南海大道', '顺德大道', '三水大道', '高明大道', '海八路',
  '佛平路', '南国路', '碧桂路', '广佛路',
]

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick(arr) {
  return arr[randomInt(0, arr.length - 1)]
}

function pickMulti(arr, count) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

// 生成统一社会信用代码（18位）
function generateCreditCode() {
  const chars = '0123456789ABCDEFGHJKLMNPQRTUWXY'
  let code = '9144060' // 佛山区域码
  for (let i = 0; i < 10; i++) {
    code += chars[randomInt(0, chars.length - 1)]
  }
  return code
}

// 生成手机号
function generatePhone() {
  const prefixes = ['134', '135', '136', '137', '138', '139', '150', '151', '152', '158', '159', '188', '189']
  return pick(prefixes) + String(randomInt(10000000, 99999999))
}

// 生成企业名称
function generateEnterpriseName(index) {
  const prefix = pick(namePrefixes)
  const core = pick(nameCores)
  // 部分企业加上编号避免重名
  const suffix = pick(nameSuffixes)
  if (Math.random() < 0.15) {
    return `${prefix}${core}${suffix.replace('有限公司', index + suffix)}`
  }
  return `${prefix}${core}${suffix}`
}

// 生成地址
function generateAddress(district) {
  const town = pick(towns[district])
  const road = pick(roadNames)
  const number = randomInt(1, 300)
  const building = randomInt(1, 30)
  const floor = randomInt(1, 8)
  return `${district}${town}${road}${number}号${building}栋${floor}楼`
}

// 佛山坐标范围（大致）
// 经度: 112.8 ~ 113.3
// 纬度: 22.8 ~ 23.3
function generateCoordinate(district) {
  // 各区大致中心偏移
  const offsets = {
    '禅城区': { lon: [113.10, 113.15], lat: [22.98, 23.05] },
    '南海区': { lon: [113.05, 113.20], lat: [23.00, 23.15] },
    '顺德区': { lon: [113.15, 113.30], lat: [22.78, 22.95] },
    '三水区': { lon: [112.82, 113.00], lat: [23.12, 23.30] },
    '高明区': { lon: [112.70, 112.90], lat: [22.80, 22.95] },
  }
  const o = offsets[district]
  const lon = o.lon[0] + Math.random() * (o.lon[1] - o.lon[0])
  const lat = o.lat[0] + Math.random() * (o.lat[1] - o.lat[0])
  return { lon: Math.round(lon * 1000000) / 1000000, lat: Math.round(lat * 1000000) / 1000000 }
}

// 生成联系人姓名
const surname = ['陈', '李', '黄', '张', '梁', '何', '刘', '吴', '罗', '周', '林', '黎', '邓', '冯', '王', '杨', '谭', '谢', '苏', '潘', '卢', '叶', '陆', '麦', '欧阳', '区']
const givenName = ['志强', '伟强', '志华', '伟华', '国强', '建华', '国华', '文杰', '俊杰', '志强', '海', '杰', '勇', '军', '平', '明', '峰', '辉', '斌', '敏', '丽', '霞', '秀英', '志明', '志伟', '伟杰', '少华', '少锋', '永强', '永锋', '振华', '志锋']

function generateContact() {
  return pick(surname) + pick(givenName)
}

// 生成企业主数据
function generateEnterprise(index) {
  const district = pick(districts)
  const coord = generateCoordinate(district)
  const kindWeights = [0, 0, 0, 0, 0, 1, 1, 1, 2, 2] // 0普通,1高新,2重点
  const kind = pick(kindWeights)

  return {
    id: `440600${String(index + 1).padStart(6, '0')}`,
    name: generateEnterpriseName(index),
    industry: pick(industries),
    district,
    honorInfo: Math.random() < 0.4 ? pickMulti(honors, randomInt(1, 3)).join('、') : '',
    enterpriseKind: kind,
    creditCode: generateCreditCode(),
    address: generateAddress(district),
    phone: generatePhone(),
    contact: generateContact(),
    xdnBqtype: Math.random() < 0.5 ? pick(tags) : '',
    ywXdnName: Math.random() < 0.4 ? pick(subdomains) : '',
    lon: coord.lon,
    lat: coord.lat,
  }
}

function main() {
  const count = 10000
  const enterprises = []

  for (let i = 0; i < count; i++) {
    enterprises.push(generateEnterprise(i))
  }

  const data = {
    code: 200,
    message: 'success',
    data: {
      enterprises,
    },
  }

  const outputPath = path.resolve(__dirname, '..', 'static', 'dot-1.json')
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8')

  const stats = fs.statSync(outputPath)
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2)
  console.log(`✅ 已生成 ${count} 条企业数据`)
  console.log(`📁 输出文件: ${outputPath}`)
  console.log(`📦 文件大小: ${sizeMB} MB`)
  console.log(`\n📊 各区分布:`)
  const distCount = {}
  enterprises.forEach(e => {
    distCount[e.district] = (distCount[e.district] || 0) + 1
  })
  Object.entries(distCount).forEach(([d, c]) => {
    console.log(`   ${d}: ${c} 家`)
  })
}

main()
