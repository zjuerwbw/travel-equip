const store = require('../../utils/store');
const { CATEGORIES, catByKey } = require('../../utils/const');

Page({
  data: {
    keyword: '',
    activeCat: 'all',
    cats: [{ key: 'all', name: '全部', icon: '📦' }].concat(
      CATEGORIES.map((c) => ({ key: c.key, name: c.name, icon: c.icon }))
    ),
    list: []
  },
  onShow() {
    this.refresh();
  },
  refresh() {
    let gears = store.getGears(true); // 含归档，标记展示
    const kw = this.data.keyword.trim();
    if (kw) {
      gears = gears.filter((g) =>
        (g.name + (g.brand || '') + (g.model || '') + (g.remark || '')).indexOf(kw) > -1
      );
    }
    if (this.data.activeCat !== 'all') {
      gears = gears.filter((g) => g.cat1 === this.data.activeCat);
    }
    const list = gears.map((g) => ({
      id: g.id,
      name: g.name,
      sub: (g.brand || '') + (g.model ? ' ' + g.model : ''),
      weight: store.fmtWeight(g.weightG),
      qty: g.qty,
      catIcon: catByKey(g.cat1).icon,
      catName: catByKey(g.cat1).name,
      archived: g.status === 'archived'
    }));
    this.setData({ list });
  },
  onSearch(e) {
    this.setData({ keyword: e.detail.value }, () => this.refresh());
  },
  onCat(e) {
    this.setData({ activeCat: e.currentTarget.dataset.key }, () => this.refresh());
  },
  onAdd() {
    wx.navigateTo({ url: '/pages/gear/edit' });
  },
  onItem(e) {
    wx.navigateTo({ url: '/pages/gear/edit?id=' + e.currentTarget.dataset.id });
  }
});
