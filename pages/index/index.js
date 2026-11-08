const store = require('../../utils/store');
const { STATUS_TEXT } = require('../../utils/const');

Page({
  data: {
    gearCount: 0,
    totalWeight: 0,
    planCount: 0,
    upcoming: null,
    upcomingWeight: ''
  },
  onShow() {
    const gears = store.getGears();
    const totalWeight = gears.reduce((s, g) => s + g.weightG * g.qty, 0);
    const plans = store.getPlans().filter((p) => p.status !== 'cancelled');
    const up = store.getUpcomingPlan();
    let upcoming = null;
    let upcomingWeight = '';
    if (up) {
      const items = store.getPacking(up.id);
      const sum = store.calcSummary(items, up.maxLoadKg);
      upcoming = {
        id: up.id,
        name: up.name,
        statusText: STATUS_TEXT[up.status],
        date: up.startDate + (up.endDate && up.endDate !== up.startDate ? ' ~ ' + up.endDate : ''),
        destination: up.destination
      };
      if (items.length) upcomingWeight = store.fmtWeight(sum.total);
    }
    this.setData({
      gearCount: gears.length,
      totalWeight: store.fmtWeight(totalWeight),
      planCount: plans.length,
      upcoming,
      upcomingWeight
    });
  },
  goGear() {
    wx.navigateTo({ url: '/pages/gear/edit' });
  },
  goPlan() {
    wx.navigateTo({ url: '/pages/plan/edit' });
  },
  goUpcoming() {
    if (this.data.upcoming) {
      wx.navigateTo({ url: '/pages/plan/detail?id=' + this.data.upcoming.id });
    }
  }
});
