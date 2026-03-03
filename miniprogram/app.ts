App<IAppOption>({
  globalData: {
    userInfo: undefined as WechatMiniprogram.UserInfo | undefined,
    env: 'cloud1-8g65ecjm393c67f1' as string,
    openid: '' as string,
    openidReadyCallback: null,
    carReadyCallback: null, // Add this callback
    CAR_LIST_TABLE: 'car_list_dev',
    FUEL_LIST_TABLE: 'fuel_list_dev',
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

          // Fetch car list after we have the openid
          this.fetchCarListByOpenid();
        },
        fail: (err) => {
          console.error('云函数调用失败：', err);
          wx.hideLoading();
        },
      });


      // try to load user info if already authorized / stored
      wx.getSetting({
        success: (settingRes) => {
          const hasAuth = settingRes.authSetting && settingRes.authSetting['scope.userInfo']
          if (hasAuth) {
            wx.getUserInfo({
              success: (userRes) => {

                this.globalData.userInfo = userRes.userInfo
                try { wx.setStorageSync('userInfo', userRes.userInfo) } catch (e) { /* ignore */ }
                if (this.userInfoReadyCallback) this.userInfoReadyCallback(userRes)
              },
            })
          } else {
            // fallback: try reading from storage (if previously saved)
            try {
              const stored = wx.getStorageSync('userInfo')
              if (stored) this.globalData.userInfo = stored
            } catch (e) { }
          }
        }
      })
    }
  },

  fetchCarListByOpenid() {

    wx.cloud.database()
      .collection(this.globalData.CAR_LIST_TABLE as string)
      .where({
        _openid: this.globalData.openid,
      })
      .get()
      .then(res => {
        this.globalData.cars = res.data
        this.globalData.currentCarId = res.data.length > 0 ? res.data[0]._id : null

        if (!res.data || res.data.length === 0) {
          // No cars found for this user, create a default one

          const carTable = this.globalData.CAR_LIST_TABLE as string
          wx.cloud.database().collection(carTable).add({ data: { name: '默认车辆1' } })
            .then(addRes => {
              const created = [{ _id: addRes._id, name: '默认车辆1' }]
              this.globalData.cars = created
              this.globalData.currentCarId = addRes._id

              if (this.globalData.carReadyCallback) {
                this.globalData.carReadyCallback()
              }
            })
            .catch(err => {
              wx.showToast({ title: '创建默认车辆失败', icon: 'none' })
              console.error('创建默认车辆失败：', err)
              this.globalData.cars = []
              this.globalData.currentCarId = null
              if (this.globalData.carReadyCallback) {
                this.globalData.carReadyCallback()
              }
            })
        }


        if (this.globalData.carReadyCallback) {
          this.globalData.carReadyCallback()
        }
      })
  }
})