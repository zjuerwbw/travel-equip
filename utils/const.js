// 装备分类枚举（10 个一级分类，二级子类见 subs）
const CATEGORIES = [
  { key: 'clothing', name: '服装穿着', icon: '🧥', subs: ['排汗底层', '保暖中层', '外层防护', '配件'] },
  { key: 'footwear', name: '鞋袜', icon: '🥾', subs: ['鞋类', '袜子', '护具', '冰爪/雪套'] },
  { key: 'pack', name: '背包装载', icon: '🎒', subs: ['大背包(≥45L)', '小背包(<45L)', '腰包/胸前包', '防雨罩', '收纳袋'] },
  { key: 'shelter', name: '露营庇护', icon: '⛺', subs: ['帐篷', '天幕', '地布', '营钉营绳', '露宿袋'] },
  { key: 'sleep', name: '睡眠系统', icon: '🛏️', subs: ['睡袋', '睡垫', '充气枕', '吊床'] },
  { key: 'cook', name: '餐食炊事', icon: '🍳', subs: ['炉头', '燃料', '锅具', '餐具', '食物'], consumableSubs: ['燃料', '食物'] },
  { key: 'water', name: '饮水系统', icon: '💧', subs: ['水壶/水袋', '滤水器/净水片', '保温瓶'] },
  { key: 'electronics', name: '导航电子', icon: '🔦', subs: ['导航(GPS/地图/指北针)', '照明(头灯/营灯)', '电源(充电宝/太阳能)', '对讲机'] },
  { key: 'safety', name: '安全急救', icon: '⛑️', subs: ['急救包', '个人药品', '救生(哨子/保温毯)', '火种(打火机/火石)', '技术装备'] },
  { key: 'hygiene', name: '卫生工具', icon: '🧰', subs: ['卫生(防晒/驱蚊/洗漱)', '工具(刀/锯/钳/修补)', '其他杂项'] }
];

// 出行类型
const TRIP_TYPES = ['一日徒步', '多日徒步重装', '露营', '登山', '骑行', '溯溪', '滑雪', '自驾露营', '其他'];

// 计划状态
const STATUS_TEXT = {
  preparing: '准备中',
  ongoing: '进行中',
  completed: '已完成',
  reviewed: '已复盘',
  cancelled: '已取消'
};

// 打包清单项标签
const ITEM_TAGS = [
  { key: 'required', name: '必需' },
  { key: 'optional', name: '可选' },
  { key: 'spare', name: '备用' }
];

// 复盘标记
const REVIEW_MARKS = [
  { key: 'used', label: '✅ 用到' },
  { key: 'unused', label: '😴 没用' },
  { key: 'overpacked', label: '⚠️ 带多' },
  { key: 'missing', label: '❌ 缺了' },
  { key: 'replace', label: '🔄 换轻' }
];

function catByKey(key) {
  return CATEGORIES.find((c) => c.key === key) || { name: '其他', icon: '📦', subs: [] };
}
function tagByKey(key) {
  const t = ITEM_TAGS.find((x) => x.key === key);
  return t ? t.name : '必需';
}

module.exports = { CATEGORIES, TRIP_TYPES, STATUS_TEXT, ITEM_TAGS, REVIEW_MARKS, catByKey, tagByKey };
