const store = require('../../utils/store');

Page({
  data: {
    gearCount: 0,
    planCount: 0,
    reviewedCount: 0,
    totalWeight: ''
  },
  onShow() {
    const gears = store.getGears();
    const plans = store.getPlans();
    this.setData({
      gearCount: gears.length,
      planCount: plans.filter((p) => p.status !== 'cancelled').length,
      reviewedCount: plans.filter((p) => p.status === 'reviewed').length,
      totalWeight: store.fmtWeight(gears.reduce((s, g) => s + g.weightG * g.qty, 0))
    });
  },
  onClear() {
    wx.showModal({
      title: '清空所有数据',
      content: '将删除全部装备、计划与打包数据，且无法恢复。确定继续吗？',
      confirmColor: '#e5484d',
      success: (r) => {
        if (r.confirm) {
          store.clearAll();
          wx.showToast({ title: '已清空', icon: 'success' });
        }
      }
    });
  }
});
