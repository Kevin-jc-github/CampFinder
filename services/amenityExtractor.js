const VERSION = 'amenity-rules-v1';

const RULES = [
  { amenity: '卫生间', positive: [/卫生间|洗手间|厕所|restroom|toilet/i], negative: [/无(?:公共)?卫生间|没有厕所|不提供厕所|no (?:public )?(?:restroom|toilet)/i] },
  { amenity: '淋浴', positive: [/淋浴|洗澡|热水澡|shower/i], negative: [/无(?:法|公共)?淋浴|没有淋浴|不能洗澡|没有热水|no shower/i] },
  { amenity: '水电桩', positive: [/水电桩|房车水电|充电桩|rv hookup|electric hookup/i], negative: [/无水电桩|不提供水电|no (?:rv |electric )?hookup/i] },
  { amenity: '停车场', positive: [/停车场|免费停车|可停车|parking/i], negative: [/无法停车|禁止停车|无停车场|no parking/i] },
  { amenity: '可明火', positive: [/可明火|允许明火|可以生火|篝火|campfire allowed/i], negative: [/禁止明火|严禁用火|不可生火|no (?:open )?fire/i] },
  { amenity: '可带宠物', positive: [/可带宠物|宠物友好|允许宠物|欢迎(?:携带|带)宠物|pet[- ]friendly|pets allowed/i], negative: [/禁止宠物|不可带宠物|谢绝宠物|no pets/i] },
  { amenity: '儿童活动', positive: [/亲子活动|儿童活动|儿童乐园|自然教育|kids? activit|playground/i], negative: [/不适合儿童|禁止儿童|adults only/i] },
  { amenity: '装备租赁', positive: [/装备租赁|帐篷租赁|租帐篷|拎包入住|gear rental|tent rental/i], negative: [/不提供装备|需自带帐篷|no (?:gear|tent) rental/i] },
  { amenity: '餐饮', positive: [/提供餐饮|营地餐厅|咖啡|烧烤套餐|早餐|food|restaurant|cafe/i], negative: [/不提供餐饮|需自备食物|no food/i] },
  { amenity: '手机信号', positive: [/手机信号|移动信号|联通信号|电信信号|4g|5g|mobile signal/i], negative: [/无信号|没有手机信号|手机失联|no (?:mobile )?signal/i] }
];

function matchingSnippet(text, match) {
  const index = match.index || 0;
  return text.slice(Math.max(0, index - 24), Math.min(text.length, index + match[0].length + 24)).trim();
}

function extractAmenities(text = '') {
  const normalized = String(text).replace(/\s+/g, ' ').trim();
  if (!normalized) return { positive: [], negative: [], modelVersion: VERSION };
  const positive = [];
  const negative = [];
  for (const rule of RULES) {
    const negativeMatch = rule.negative.map(pattern => pattern.exec(normalized)).find(Boolean);
    if (negativeMatch) {
      negative.push({ amenity: rule.amenity, confidence: 0.92, evidenceText: matchingSnippet(normalized, negativeMatch), modelVersion: VERSION });
      continue;
    }
    const positiveMatch = rule.positive.map(pattern => pattern.exec(normalized)).find(Boolean);
    if (positiveMatch) positive.push({ amenity: rule.amenity, confidence: 0.78, evidenceText: matchingSnippet(normalized, positiveMatch), modelVersion: VERSION });
  }
  return { positive, negative, modelVersion: VERSION };
}

module.exports = { VERSION, extractAmenities };
