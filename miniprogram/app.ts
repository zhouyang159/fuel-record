// app.ts
App<IAppOption>({
  globalData: {
    env: 'cloud1-8g65ecjm393c67f1',
    openid: '',
    openidReadyCallback: null,
  },
  onLaunch() {
    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库以使用云能力");
    } else {
      wx.cloud.init({
        env: this.globalData.env,
        traceUser: true,
      });

      
      wx.showLoading({
        title: ''
      })
      wx.cloud.callFunction({
        name: 'getOpenID', // 刚才新建的云函数名称
        success: (res) => {
          this.globalData.openid = res.result.openid;

          // 如果页面已经设置了回调，则执行
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
    }
  },
})