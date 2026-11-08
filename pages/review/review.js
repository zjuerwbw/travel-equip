const store = require('../../utils/store');
const { REVIEW_MARKS, catByKey } = require('../../utils/const');

Page({
  data: {
    planId: '',
    plan: null,
    marks: REVIEW_MARKS,
    items: [],
    planTotal: '',
    actualTotal: '',
    diff: '',
    unusedCount: 0,
    unusedWeight: ''
  },
  onLoad(options) {
    const p = store.getPlanById(options.planId);
    this.setData({ planId: options.planId, plan: p });
    wx.setNavigationBarTitle({ title: '重量复盘' });
  },
  onShow() {
    this.refresh();
  },
  refresh() {
    const items = store.getPacking(this.data.planId).map((it, i) => ({
      ...it,
      _i: i,
      actualQtyStr: it.actualQty === null ? String(it.qty) : String(it.actualQty),
      actualWeightStr: it.actualWeightG === null ? String(it.weightG) : String(it.actualWeightG),
      markText: this.markText(it.mark),
      catIcon: catByKey(it.cat1).icon
    }));
    const planSum = store.calcSummary(items, null);
    const actualTotal = store.calcActualSummary(items);
    const unused = items.filter((it) => it.mark === 'unused');
    const diff = actualTotal - planSum.total;
    this.setData({
      items,
      planTotal: store.fmtWeight(planSum.total),
      actualTotal: store.fmtWeight(actualTotal),
      diff: (diff >= 0 ? '+' : '') + store.fmtWeight(Math.abs(diff)) + (diff >= 0 ? ' 超出' : ' 节省'),
      unusedCount: unused.length,
      unusedWeight: store.fmtWeight(unused.reduce((s, it) => s + it.weightG * it.qty, 0))
    });
  },
  markText(mark) {
    const m = REVIEW_MARKS.find((x) => x.key === mark);
    return m ? m.label : '';
  },
  onActualQty(e) {
    const id = e.currentTarget.dataset.id;
    const v = Math.max(0, Number(e.detail.value) || 0);
    store.updatePackingItem(this.data.planId, id, { actualQty: v });
    this.refresh();
  },
  onActualWeight(e) {
    const id = e.currentTarget.dataset.id;
    const v = Math.max(0, Number(e.detail.value) || 0);
    store.updatePackingItem(this.data.planId, id, { actualWeightG: v });
    this.refresh();
  },
  onMark(e) {
    const { id, key } = e.currentTarget.dataset;
    store.updatePackingItem(this.data.planId, id, { mark: key });
    this.refresh();
  },
  onNote(e) {
    store.updatePackingItem(this.data.planId, e.currentTarget.dataset.id, { note: e.detail.value });
  },
  onSave() {
    wx.showModal({
      title: '提交复盘',
      content: '提交后计划状态将变更为"已复盘"。',
      success: (r) => {
        if (r.confirm) {
          store.updatePlanStatus(this.data.planId, 'reviewed');
          wx.showToast({ title: '复盘完成', icon: 'success' });
          setTimeout(() => wx.navigateBack(), 800);
        }
      }
    });
  }
});
