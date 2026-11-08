const store = require('../../utils/store');
const { STATUS_TEXT } = require('../../utils/const');

Page({
  data: {
    id: '',
    p: null,
    itemText: '',
    weight: '',
    baseWeight: '',
    statusText: '',
    canStart: false,
    canFinish: false,
    canReview: false,
    canCancel: false,
    canDelete: false,
    canEdit: false
  },
  onLoad(options) {
    this.setData({ id: options.id });
  },
  onShow() {
    this.refresh();
  },
  refresh() {
    const p = store.getPlanById(this.data.id);
    if (!p) {
      wx.navigateBack();
      return;
    }
    const items = store.getPacking(p.id);
    const sum = store.calcSummary(items, p.maxLoadKg);
    const temp = p.tempLow !== null && p.tempLow !== undefined && p.tempHigh !== null && p.tempHigh !== undefined;
    this.setData({
      p: {
        name: p.name,
        type: p.tripType,
        destination: p.destination,
        altitude: p.altitude ? p.altitude + ' m' : '未填写',
        date: p.startDate + (p.endDate && p.endDate !== p.startDate ? ' ~ ' + p.endDate : ''),
        time: p.departureTime || '—',
        days: p.days || 1,
        temp: temp ? p.tempLow + ' ~ ' + p.tempHigh + '℃' : '未填写',
        maxLoad: p.maxLoadKg ? p.maxLoadKg + ' kg' : '未设置',
        remark: p.remark || ''
      },
      itemText: items.length ? items.length + ' 件' : '未打包',
      weight: items.length ? store.fmtWeight(sum.total) : '—',
      baseWeight: items.length ? store.fmtWeight(sum.base) + '（基础重量）' : '—',
      statusText: STATUS_TEXT[p.status],
      canStart: p.status === 'preparing',
      canFinish: p.status === 'ongoing',
      canReview: p.status === 'completed' || p.status === 'reviewed',
      canCancel: p.status === 'preparing' || p.status === 'ongoing',
      canDelete: p.status !== 'ongoing',
      canEdit: p.status === 'preparing' || p.status === 'ongoing'
    });
  },
  goPacking() {
    wx.navigateTo({ url: '/pages/packing/packing?planId=' + this.data.id });
  },
  goReview() {
    wx.navigateTo({ url: '/pages/review/review?planId=' + this.data.id });
  },
  goEdit() {
    wx.navigateTo({ url: '/pages/plan/edit?id=' + this.data.id });
  },
  onAction(e) {
    const a = e.currentTarget.dataset.action;
    if (a === 'start') {
      store.updatePlanStatus(this.data.id, 'ongoing');
      this.refresh();
    } else if (a === 'finish') {
      store.updatePlanStatus(this.data.id, 'completed');
      this.refresh();
    } else if (a === 'cancel') {
      wx.showModal({
        title: '取消计划',
        content: '确定取消该出行计划吗？',
        success: (r) => {
          if (r.confirm) {
            store.updatePlanStatus(this.data.id, 'cancelled');
            this.refresh();
          }
        }
      });
    } else if (a === 'delete') {
      wx.showModal({
        title: '删除计划',
        content: '将同时删除该计划的打包清单数据，确定吗？',
        success: (r) => {
          if (r.confirm) {
            store.deletePlan(this.data.id);
            wx.navigateBack();
          }
        }
      });
    }
  }
});
