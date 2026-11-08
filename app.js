App({
  onLaunch() {
    // 初始化存储结构（如不存在则创建）
    const keys = ['og_gears', 'og_plans', 'og_packing'];
    keys.forEach((k) => {
      if (wx.getStorageSync(k) === '') {
        wx.setStorageSync(k, k === 'og_packing' ? {} : []);
      }
    });
  }
});
