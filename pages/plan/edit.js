const store = require('../../utils/store');
const { TRIP_TYPES } = require('../../utils/const');

Page({
  data: {
    id: '',
    name: '',
    tripTypes: TRIP_TYPES,
    typeIndex: -1,
    destination: '',
    altitude: '',
    startDate: '',
    endDate: '',
    departureTime: '08:00',
    days: 0,
    tempLow: '',
    tempHigh: '',
    maxLoadKg: '',
    remark: '',
    minDate: '2020-01-01',
    altWarn: false
  },
  onLoad(options) {
    if (options.id) {
      const p = store.getPlanById(options.id);
      if (p) {
        this.setData({
          id: p.id,
          name: p.name,
          typeIndex: TRIP_TYPES.indexOf(p.tripType),
          destination: p.destination,
          altitude: p.altitude ? String(p.altitude) : '',
          startDate: p.startDate,
          endDate: p.endDate || p.startDate,
          departureTime: p.departureTime || '08:00',
          tempLow: p.tempLow || '',
          tempHigh: p.tempHigh || '',
          maxLoadKg: p.maxLoadKg ? String(p.maxLoadKg) : '',
          remark: p.remark || '',
          days: p.days || 1
        });
        wx.setNavigationBarTitle({ title: '编辑计划' });
      }
    }
  },
  onInput(e) {
    const f = e.currentTarget.dataset.field;
    this.setData({ [f]: e.detail.value });
  },
  onType(e) {
    this.setData({ typeIndex: Number(e.detail.value) }, () => this.autoName());
  },
  onDate(e) {
    const f = e.currentTarget.dataset.field;
    const patch = { [f]: e.detail.value };
    if (f === 'startDate' && !this.data.endDate) patch.endDate = e.detail.value;
    this.setData(patch, () => {
      this.setData({ days: store.calcDays(this.data.startDate, this.data.endDate) });
      this.autoName();
      this.checkAlt();
    });
  },
  onTime(e) {
    this.setData({ departureTime: e.detail.value });
  },
  onAlt(e) {
    this.setData({ altitude: e.detail.value }, () => this.checkAlt());
  },
  checkAlt() {
    this.setData({ altWarn: Number(this.data.altitude) >= 3500 });
  },
  // 默认计划名 = 目的地 + 起始日期
  autoName() {
    if (this.data.id) return; // 编辑态不自动覆盖
    const d = this.data;
    if (d.destination && d.startDate) {
      this.setData({ name: d.destination + ' ' + d.startDate });
    }
  },
  onSave() {
    const d = this.data;
    if (!d.name.trim()) return this.toast('请填写计划名称');
    if (d.typeIndex < 0) return this.toast('请选择出行类型');
    if (!d.destination.trim()) return this.toast('请填写目的地');
    if (!d.startDate) return this.toast('请选择出发日期');
    if (d.endDate && d.endDate < d.startDate) return this.toast('结束日期不能早于出发日期');
    const alt = Number(d.altitude) || 0;
    store.savePlan({
      id: d.id || undefined,
      name: d.name.trim(),
      tripType: TRIP_TYPES[d.typeIndex],
      destination: d.destination.trim(),
      altitude: alt,
      startDate: d.startDate,
      endDate: d.endDate || d.startDate,
      departureTime: d.departureTime,
      days: store.calcDays(d.startDate, d.endDate || d.startDate),
      tempLow: d.tempLow ? Number(d.tempLow) : null,
      tempHigh: d.tempHigh ? Number(d.tempHigh) : null,
      maxLoadKg: d.maxLoadKg ? Number(d.maxLoadKg) : null,
      remark: d.remark.trim()
    });
    wx.showToast({ title: '已保存', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 600);
  },
  toast(msg) {
    wx.showToast({ title: msg, icon: 'none' });
  }
});
