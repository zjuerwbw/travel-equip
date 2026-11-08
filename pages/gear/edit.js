const store = require('../../utils/store');
const { CATEGORIES } = require('../../utils/const');

Page({
  data: {
    id: '',
    isEdit: false,
    name: '',
    catIndex: -1,
    subIndex: -1,
    catNames: CATEGORIES.map((c) => c.icon + ' ' + c.name),
    subs: [],
    subNames: [],
    brand: '',
    model: '',
    weightInput: '',
    unit: 'g', // g | kg
    qty: '1',
    isConsumable: false,
    remark: '',
    archived: false
  },
  onLoad(options) {
    if (options.id) {
      const g = store.getGearById(options.id);
      if (g) {
        const catIndex = CATEGORIES.findIndex((c) => c.key === g.cat1);
        const subs = catIndex > -1 ? CATEGORIES[catIndex].subs : [];
        const subIndex = g.cat2 ? subs.indexOf(g.cat2) : -1;
        this.setData({
          id: g.id,
          isEdit: true,
          name: g.name,
          catIndex,
          subs,
          subNames: subs,
          subIndex,
          brand: g.brand || '',
          model: g.model || '',
          weightInput: String(g.weightG),
          unit: 'g',
          qty: String(g.qty || 1),
          isConsumable: !!g.isConsumable,
          remark: g.remark || '',
          archived: g.status === 'archived'
        });
        wx.setNavigationBarTitle({ title: '编辑装备' });
      }
    }
  },
  onInput(e) {
    const f = e.currentTarget.dataset.field;
    this.setData({ [f]: e.detail.value });
  },
  onUnit() {
    const { unit, weightInput } = this.data;
    if (weightInput === '') {
      this.setData({ unit: unit === 'g' ? 'kg' : 'g' });
      return;
    }
    const v = Number(weightInput);
    if (isNaN(v) || v <= 0) {
      this.setData({ unit: unit === 'g' ? 'kg' : 'g' });
      return;
    }
    // 切换单位时换算当前输入值
    const nv = unit === 'g' ? Math.round((v / 1000) * 1000) / 1000 : Math.round(v * 1000);
    this.setData({ unit: unit === 'g' ? 'kg' : 'g', weightInput: String(nv) });
  },
  onCat(e) {
    const i = Number(e.detail.value);
    const subs = CATEGORIES[i].subs || [];
    this.setData({
      catIndex: i,
      subs,
      subNames: subs,
      subIndex: -1,
      // 燃料/食物默认视为消耗品
      isConsumable: (CATEGORIES[i].consumableSubs || []).length > 0 ? this.data.isConsumable : false
    });
  },
  onSub(e) {
    const i = Number(e.detail.value);
    const cat = CATEGORIES[this.data.catIndex];
    const isConsumable = (cat.consumableSubs || []).indexOf(cat.subs[i]) > -1;
    this.setData({ subIndex: i, isConsumable });
  },
  onConsumable(e) {
    this.setData({ isConsumable: e.detail.value });
  },
  onSave() {
    const d = this.data;
    if (!d.name.trim()) return this.toast('请填写装备名称');
    if (d.catIndex < 0) return this.toast('请选择分类');
    const w = Number(d.weightInput);
    if (!w || w <= 0) return this.toast('请填写有效重量');
    const weightG = d.unit === 'kg' ? Math.round(w * 1000) : w;
    const qty = Math.max(1, Math.floor(Number(d.qty) || 1));
    store.saveGear({
      id: d.id || undefined,
      name: d.name.trim(),
      cat1: CATEGORIES[d.catIndex].key,
      cat2: d.subIndex > -1 ? d.subs[d.subIndex] : '',
      brand: d.brand.trim(),
      model: d.model.trim(),
      weightG,
      qty,
      isConsumable: d.isConsumable,
      remark: d.remark.trim(),
      status: d.archived ? 'archived' : 'in_stock'
    });
    wx.showToast({ title: '已保存', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 600);
  },
  onArchive() {
    const d = this.data;
    if (!d.id) return;
    wx.showModal({
      title: '归档装备',
      content: '归档后从默认列表隐藏，但保留历史计划数据。',
      success: (r) => {
        if (r.confirm) {
          const g = store.getGearById(d.id);
          g.status = 'archived';
          store.saveGear(g);
          wx.showToast({ title: '已归档', icon: 'success' });
          setTimeout(() => wx.navigateBack(), 600);
        }
      }
    });
  },
  onDelete() {
    const d = this.data;
    if (!d.id) return;
    wx.showModal({
      title: '删除装备',
      content: '若该装备已被出行计划引用，将自动转为归档而非删除。',
      success: (r) => {
        if (r.confirm) {
          const res = store.deleteGear(d.id);
          wx.showToast({ title: res.archived ? '已归档（有引用）' : '已删除', icon: 'success' });
          setTimeout(() => wx.navigateBack(), 800);
        }
      }
    });
  },
  toast(msg) {
    wx.showToast({ title: msg, icon: 'none' });
  }
});
