const store = require('../../utils/store');
const { STATUS_TEXT } = require('../../utils/const');

const TABS = [
  { key: 'all', name: '全部' },
  { key: 'preparing', name: '准备中' },
  { key: 'ongoing', name: '进行中' },
  { key: 'done', name: '已完成' },
  { key: 'cancelled', name: '已取消' }
];

Page({
  data: {
    tabs: TABS,
    activeTab: 'all',
    list: []
  },
  onShow() {
    this.refresh();
  },
  refresh() {
    let plans = store.getPlans();
    const t = this.data.activeTab;
    if (t === 'done') {
      plans = plans.filter((p) => p.status === 'completed' || p.status === 'reviewed');
    } else if (t !== 'all') {
      plans = plans.filter((p) => p.status === t);
    }
    const list = plans.map((p) => {
      const items = store.getPacking(p.id);
      const sum = store.calcSummary(items, p.maxLoadKg);
      return {
        id: p.id,
        name: p.name,
        statusText: STATUS_TEXT[p.status],
        reviewed: p.status === 'reviewed',
        date: p.startDate + (p.endDate && p.endDate !== p.startDate ? ' ~ ' + p.endDate : ''),
        destination: p.destination,
        altitude: p.altitude ? p.altitude + 'm' : '',
        days: p.days || 1,
        weight: items.length ? store.fmtWeight(sum.total) : '未打包'
      };
    });
    this.setData({ list });
  },
  onTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.key }, () => this.refresh());
  },
  onAdd() {
    wx.navigateTo({ url: '/pages/plan/edit' });
  },
  onItem(e) {
    wx.navigateTo({ url: '/pages/plan/detail?id=' + e.currentTarget.dataset.id });
  }
});
