
const env_table_pre_name = 'dev'

const apikey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvcHF1Y3hlc3V5b3pzZ2dmdXl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NTY3OTIsImV4cCI6MjA4OTEzMjc5Mn0.MrWpPPOjaOKL0IqLS-JgonKTQqOuG319MY2BLyYsnvw'


App<IAppOption>({
  globalData: {
    supabaseUrl: 'https://aopqucxesuyozsggfuyv.supabase.co/rest/v1',
    supabaseAnonKey: apikey,

    userInfo: undefined as WechatMiniprogram.UserInfo | undefined,
    env: 'cloud1-8g65ecjm393c67f1' as string,
    openid: '' as string,
    openidReadyCallback: null,
    carReadyCallback: null,
    CAR_LIST_TABLE: env_table_pre_name + '_car_list',
    FUEL_LIST_TABLE: env_table_pre_name + '_fuel_list',
    currentCarId: null,
    cars: [] as any[],
  },
  onLaunch() {
    const updateManager = wx.getUpdateManager()

    updateManager.onCheckForUpdate(function (res) {
      console.log('hasUpdate', res.hasUpdate)
    })

    updateManager.onUpdateReady(function () {
      wx.showModal({
        title: '更新提示',
        content: '新版本已经准备好，是否重启应用？',
        success(res) {
          if (res.confirm) {
            updateManager.applyUpdate()
          }
        }
      })
    })

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
          const result = (res && res.result ? res.result : {}) as any
          this.globalData.openid = String(result.openid || '')
          if (!this.globalData.openid) {
            console.error('未获取到OpenID')
          }
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

    wx.request({
      url: `${this.globalData.supabaseUrl}/${this.globalData.CAR_LIST_TABLE}?select=*&_openid=eq.${this.globalData.openid}&order=created_at.desc`,
      method: 'GET',
      header: {
        'apikey': apikey,
        'Authorization': `Bearer ${apikey}`,
        'Content-Type': 'application/json'
      },
      success: (res: any) => {
        const cars = (res.data || []) as any[]
        this.globalData.cars = cars

        const currentExists = cars.some((car: any) => car.id === this.globalData.currentCarId)
        if (!currentExists) {
          this.globalData.currentCarId = cars.length > 0 ? cars[0].id : null
        }

        if (!cars || cars.length === 0) {
          // No cars found for this user, create a default one

          wx.request({
            url: `${this.globalData.supabaseUrl}/${this.globalData.CAR_LIST_TABLE}`,
            method: 'POST',
            header: {
              'apikey': apikey,
              'Authorization': `Bearer ${apikey}`,
              'Content-Type': 'application/json'
            },
            data: {
              _openid: this.globalData.openid,
              name: '默认车辆1'
            },
            success: () => {
              this.fetchCarListByOpenid()
            }
          })
        }

        if (this.globalData.carReadyCallback) {
          this.globalData.carReadyCallback()
        }
      },
      fail: (err) => {
        console.error(err)
      }
    })
  },
})
