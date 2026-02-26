App<IAppOption>({
  globalData: {
    env: 'cloud1-8g65ecjm393c67f1' as string,
    openid: '' as string,
    openidReadyCallback: null,
    carReadyCallback: null, // Add this callback
    CAR_LIST_TABLE: 'car_list_dev',
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


      wx.cloud.database()
        .collection(this.globalData.CAR_LIST_TABLE as string)
        .get()
        .then(res => {
          this.globalData.cars = res.data
          this.globalData.currentCarId = res.data.length > 0 ? res.data[0]._id : null


          if (!res.data || res.data.length === 0) {
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
            return
          }


          if (this.globalData.carReadyCallback) {
            this.globalData.carReadyCallback()
          }
        })
    }
  },
})