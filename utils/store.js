// 本地存储数据层：装备库 / 出行计划 / 打包清单（含重量快照）
const { STATUS_TEXT, ITEM_TAGS, REVIEW_MARKS } = require('./const');

const KEYS = { gears: 'og_gears', plans: 'og_plans', packing: 'og_packing' };

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
function read(key, def) {
  try {
    const v = wx.getStorageSync(key);
    return v === '' ? def : v;
  } catch (e) {
    return def;
  }
}
function write(key, val) {
  wx.setStorageSync(key, val);
}

// ---------- 装备 ----------
function getGears(includeArchived) {
  const list = read(KEYS.gears, []);
  return includeArchived ? list : list.filter((g) => g.status !== 'archived');
}
function getGearById(id) {
  return read(KEYS.gears, []).find((g) => g.id === id) || null;
}
function saveGear(gear) {
  const list = read(KEYS.gears, []);
  if (gear.id) {
    const i = list.findIndex((g) => g.id === gear.id);
    if (i > -1) {
      gear.updatedAt = Date.now();
      list[i] = gear;
    }
  } else {
    gear.id = uid();
    gear.status = gear.status || 'in_stock';
    gear.createdAt = Date.now();
    list.unshift(gear);
  }
  write(KEYS.gears, list);
  return gear;
}
// 删除规则：被计划引用过 → 归档；否则物理删除
function deleteGear(id) {
  const packing = read(KEYS.packing, {});
  const referenced = Object.keys(packing).some((pid) =>
    (packing[pid] || []).some((it) => it.gearId === id)
  );
  const list = read(KEYS.gears, []);
  if (referenced) {
    const g = list.find((x) => x.id === id);
    if (g) g.status = 'archived';
    write(KEYS.gears, list);
    return { archived: true };
  }
  write(KEYS.gears, list.filter((x) => x.id !== id));
  return { archived: false };
}

// ---------- 出行计划 ----------
function getPlans() {
  return read(KEYS.plans, []);
}
function getPlanById(id) {
  return read(KEYS.plans, []).find((p) => p.id === id) || null;
}
function savePlan(plan) {
  const list = read(KEYS.plans, []);
  if (plan.id) {
    const i = list.findIndex((p) => p.id === plan.id);
    if (i > -1) {
      plan.updatedAt = Date.now();
      list[i] = plan;
    }
  } else {
    plan.id = uid();
    plan.status = 'preparing';
    plan.createdAt = Date.now();
    list.unshift(plan);
  }
  write(KEYS.plans, list);
  return plan;
}
function updatePlanStatus(id, status) {
  const list = read(KEYS.plans, []);
  const p = list.find((x) => x.id === id);
  if (p) {
    p.status = status;
    write(KEYS.plans, list);
  }
  return p;
}
function deletePlan(id) {
  const list = read(KEYS.plans, []).filter((x) => x.id !== id);
  write(KEYS.plans, list);
  const packing = read(KEYS.packing, {});
  delete packing[id];
  write(KEYS.packing, packing);
}
// 即将出发：进行中优先，其次准备中按开始日期升序
function getUpcomingPlan() {
  const list = getPlans().filter((p) => p.status === 'ongoing' || p.status === 'preparing');
  if (!list.length) return null;
  list.sort((a, b) => {
    if (a.status === 'ongoing' && b.status !== 'ongoing') return -1;
    if (b.status === 'ongoing' && a.status !== 'ongoing') return 1;
    return (a.startDate || '').localeCompare(b.startDate || '');
  });
  return list[0];
}

// ---------- 打包清单 ----------
function getPacking(planId) {
  const map = read(KEYS.packing, {});
  return map[planId] || [];
}
function savePacking(planId, items) {
  const map = read(KEYS.packing, {});
  map[planId] = items;
  write(KEYS.packing, map);
}
// 添加装备到清单（重量取快照）；已存在则数量累加
function addGearToPacking(planId, gear) {
  const items = getPacking(planId);
  const exist = items.find((it) => it.gearId === gear.id);
  if (exist) {
    exist.qty += gear.qty || 1;
  } else {
    items.push({
      itemId: uid(),
      gearId: gear.id,
      name: gear.name,
      cat1: gear.cat1,
      cat2: gear.cat2 || '',
      weightG: gear.weightG, // 重量快照
      qty: gear.qty || 1,
      carryType: 'packed',
      tag: 'required',
      tagName: '必需',
      consumable: !!gear.isConsumable,
      actualQty: null,
      actualWeightG: null,
      mark: '',
      note: ''
    });
  }
  savePacking(planId, items);
  return items;
}
// 临时消耗品（食物/水等，不必先入装备库）
function addTempItem(planId, item) {
  const items = getPacking(planId);
  items.push({
    itemId: uid(),
    gearId: null,
    name: item.name,
    cat1: item.cat1 || 'cook',
    cat2: '临时消耗品',
    weightG: item.weightG,
    qty: item.qty || 1,
    carryType: 'packed',
    tag: 'required',
    tagName: '必需',
    consumable: true,
    actualQty: null,
    actualWeightG: null,
    mark: '',
    note: ''
  });
  savePacking(planId, items);
  return items;
}
function updatePackingItem(planId, itemId, patch) {
  const items = getPacking(planId);
  const it = items.find((x) => x.itemId === itemId);
  if (it) Object.assign(it, patch);
  savePacking(planId, items);
  return items;
}
function removePackingItem(planId, itemId) {
  const items = getPacking(planId).filter((x) => x.itemId !== itemId);
  savePacking(planId, items);
  return items;
}

// ---------- 重量汇总 ----------
function calcSummary(items, maxLoadKg) {
  let total = 0;
  let consumable = 0;
  const byCat = {};
  items.forEach((it) => {
    const w = Number(it.weightG || 0) * Number(it.qty || 0);
    total += w;
    if (it.consumable) consumable += w;
    byCat[it.cat1] = (byCat[it.cat1] || 0) + w;
  });
  const base = total - consumable;
  const cats = Object.keys(byCat).map((k) => ({
    key: k,
    weight: byCat[k],
    pct: total > 0 ? Math.round((byCat[k] / total) * 100) : 0
  }));
  cats.sort((a, b) => b.weight - a.weight);
  return {
    total,
    base,
    consumable,
    cats,
    maxLoadG: maxLoadKg ? maxLoadKg * 1000 : 0,
    over: maxLoadKg ? total > maxLoadKg * 1000 : false
  };
}
// 复盘实际汇总
function calcActualSummary(items) {
  let total = 0;
  items.forEach((it) => {
    const q = it.actualQty === null || it.actualQty === undefined ? it.qty : Number(it.actualQty);
    const w = it.actualWeightG === null || it.actualWeightG === undefined ? it.weightG : Number(it.actualWeightG);
    total += q * w;
  });
  return total;
}

// ---------- 工具 ----------
function fmtWeight(g) {
  g = Number(g) || 0;
  if (g >= 1000) {
    const kg = Math.round((g / 1000) * 100) / 100;
    return kg + 'kg';
  }
  return Math.round(g * 10) / 10 + 'g';
}
function calcDays(start, end) {
  if (!start || !end) return 1;
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (isNaN(s) || isNaN(e) || e < s) return 1;
  return Math.round((e - s) / 86400000) + 1;
}
function clearAll() {
  wx.removeStorageSync(KEYS.gears);
  wx.removeStorageSync(KEYS.plans);
  wx.removeStorageSync(KEYS.packing);
}

module.exports = {
  KEYS,
  getGears,
  getGearById,
  saveGear,
  deleteGear,
  getPlans,
  getPlanById,
  savePlan,
  updatePlanStatus,
  deletePlan,
  getUpcomingPlan,
  getPacking,
  savePacking,
  addGearToPacking,
  addTempItem,
  updatePackingItem,
  removePackingItem,
  calcSummary,
  calcActualSummary,
  fmtWeight,
  calcDays,
  clearAll,
  STATUS_TEXT,
  ITEM_TAGS,
  REVIEW_MARKS
};
