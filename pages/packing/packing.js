const store = require('../../utils/store');
const { CATEGORIES, catByKey, ITEM_TAGS } = require('../../utils/const');

Page({
  data: {
    planId: '',
    planName: '',
    groups: [],
    summary: { total: '', base: '', consumable: '', over: false, cats: [] },
    showCats: false,
    showPicker: false,
    pickerKeyword: '',
    pickerCats: [],
    pickerList: [],
    showTemp: false,
    tempName: '',
    tempWeight: '',
    tempQty: '1'
  },
  onLoad(options) {
    const p = store.getPlanById(options.planId);
    this.setData({ planId: options.planId, planName: p ? p.name : '' });
    wx.setNavigationBarTitle({ title: '打包清单' });
  },
  onShow() {
    this.refresh();
    this.loadPicker();
  },
  refresh() {
    const items = store.getPacking(this.data.planId);
    const plan = store.getPlanById(this.data.planId) || {};
    const sum = store.calcSummary(items, plan.maxLoadKg);
    const groups = [];
    items.forEach((it, i) => {
      const cat = catByKey(it.cat1);
      let g = groups.find((x) => x.key === it.cat1);
      if (!g) {
        g = { key: it.cat1, name: cat.name, icon: cat.icon, weight: 0, items: [] };
        groups.push(g);
      }
      g.items.push({
        ...it,
        _i: i,
        weightStr: store.fmtWeight(it.weightG),
        subtotal: store.fmtWeight(it.weightG * it.qty),
        carryText: it.carryType === 'worn' ? '🧍穿着' : '🎒背负'
      });
      g.weight += it.weightG * it.qty;
    });
    groups.forEach((g) => (g.weightStr = store.fmtWeight(g.weight)));
    this.setData({
      groups,
      summary: {
        total: store.fmtWeight(sum.total),
        base: store.fmtWeight(sum.base),
        consumable: store.fmtWeight(sum.consumable),
        over: sum.over,
        maxLoad: plan.maxLoadKg ? plan.maxLoadKg + 'kg' : '',
        cats: sum.cats.map((c) => ({ ...c, name: catByKey(c.key).name, weightStr: store.fmtWeight(c.weight) }))
      }
    });
  },
  // ---------- 清单项操作 ----------
  onQty(e) {
    const v = Math.max(1, Math.floor(Number(e.detail.value) || 1));
    store.updatePackingItem(this.data.planId, e.currentTarget.dataset.id, { qty: v });
    this.refresh();
  },
  onWeight(e) {
    const v = Math.max(0, Number(e.detail.value) || 0);
    store.updatePackingItem(this.data.planId, e.currentTarget.dataset.id, { weightG: v });
    this.refresh();
  },
  onCarry(e) {
    const items = store.getPacking(this.data.planId);
    const it = items.find((x) => x.itemId === e.currentTarget.dataset.id);
    store.updatePackingItem(this.data.planId, it.itemId, {
      carryType: it.carryType === 'worn' ? 'packed' : 'worn'
    });
    this.refresh();
  },
  onTag(e) {
    const i = Number(e.detail.value);
    store.updatePackingItem(this.data.planId, e.currentTarget.dataset.id, {
      tag: ITEM_TAGS[i].key,
      tagName: ITEM_TAGS[i].name
    });
    this.refresh();
  },
  onConsumable(e) {
    store.updatePackingItem(this.data.planId, e.currentTarget.dataset.id, { consumable: e.detail.value });
    this.refresh();
  },
  onDelItem(e) {
    store.removePackingItem(this.data.planId, e.currentTarget.dataset.id);
    this.refresh();
  },
  // ---------- 装备选择弹层 ----------
  loadPicker() {
    const cats = CATEGORIES.map((c) => ({
      key: c.key,
      name: c.icon + ' ' + c.name,
      gears: store.getGears().filter((g) => g.cat1 === c.key)
    })).filter((c) => c.gears.length);
    this.setData({ pickerCats: cats });
    this.filterPicker();
  },
  filterPicker() {
    const kw = this.data.pickerKeyword.trim();
    let list = this.data.pickerCats;
    if (kw) {
      list = list
        .map((c) => ({
          ...c,
          gears: c.gears.filter((g) => (g.name + (g.brand || '') + (g.model || '')).indexOf(kw) > -1)
        }))
        .filter((c) => c.gears.length);
    }
    this.setData({ pickerList: list });
  },
  onPickerInput(e) {
    this.setData({ pickerKeyword: e.detail.value }, () => this.filterPicker());
  },
  openPicker() {
    this.setData({ showPicker: true });
  },
  closePicker() {
    this.setData({ showPicker: false });
  },
  onPickGear(e) {
    const gear = store.getGearById(e.currentTarget.dataset.id);
    if (gear) {
      store.addGearToPacking(this.data.planId, gear);
      this.refresh();
      wx.showToast({ title: '已加入', icon: 'success', duration: 600 });
    }
  },
  stop() {}, // 阻止冒泡

  // ---------- 临时消耗品 ----------
  openTemp() {
    this.setData({ showTemp: true, tempName: '', tempWeight: '', tempQty: '1' });
  },
  closeTemp() {
    this.setData({ showTemp: false });
  },
  onTempInput(e) {
    this.setData({ [e.currentTarget.dataset.field]: e.detail.value });
  },
  onSaveTemp() {
    const d = this.data;
    if (!d.tempName.trim()) return wx.showToast({ title: '请填写名称', icon: 'none' });
    const w = Number(d.tempWeight);
    if (!w || w <= 0) return wx.showToast({ title: '请填写重量', icon: 'none' });
    store.addTempItem(this.data.planId, {
      name: d.tempName.trim(),
      weightG: w,
      qty: Math.max(1, Math.floor(Number(d.tempQty) || 1))
    });
    this.setData({ showTemp: false });
    this.refresh();
  },

  toggleCats() {
    this.setData({ showCats: !this.data.showCats });
  }
});
