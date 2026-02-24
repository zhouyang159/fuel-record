App<IAppOption>({
  globalData: {
    env: 'cloud1-8g65ecjm393c67f1',
    openid: '',
    openidReadyCallback: null,
    carReadyCallback: null, // Add this callback
    CAR_LIST: 'car_list',
    currentCarId: null,
    cars: [] as any[],
  },
  onLaunch() {
    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库以使用云能力");
    } else {
      wx.cloud.init({
        env: this.globalData.env,
        traceUser: true,
      });

      wx.showLoading({ title: '' })
      wx.cloud.callFunction({
        name: 'getOpenID',
        success: (res) => {
          this.globalData.openid = res.result.openid;
          if (this.globalData.openidReadyCallback) {
            this.globalData.openidReadyCallback();
          }
          wx.hideLoading();
        },
        fail: (err) => {
          console.error('云函数调用失败：', err);
          wx.hideLoading();
        },
      });

      // Update this part to trigger callback
      wx.cloud.database()
        .collection(this.globalData.CAR_LIST)
        .get()
        .then(res => {
          this.globalData.cars = res.data
          this.globalData.currentCarId = res.data.length > 0 ? res.data[0]._id : null
          
          // Trigger callback when car data is loaded
          if (this.globalData.carReadyCallback) {
            this.globalData.carReadyCallback()
          }
        })
    }
  },
})