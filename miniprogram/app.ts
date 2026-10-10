
import { CURRENT_CAR_ID_STORAGE_KEY } from './utils/constants'

const env_table_pre_name = 'dev' // 'dev' or 'pro'
const supabaseProjectUrl = 'https://aopqucxesuyozsggfuyv.supabase.co'

const apikey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvcHF1Y3hlc3V5b3pzZ2dmdXl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NTY3OTIsImV4cCI6MjA4OTEzMjc5Mn0.MrWpPPOjaOKL0IqLS-JgonKTQqOuG319MY2BLyYsnvw'



App<IAppOption>({
  globalData: {
    supabaseUrl: `${supabaseProjectUrl}/rest/v1`,
    supabaseFunctionsUrl: `${supabaseProjectUrl}/functions/v1`,
    wechatOpenIdFunctionName: 'wechat-openid',
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

    updateManager.onCheckForUpdate((res) => {
      console.log('hasUpdate', res.hasUpdate)
    })

    updateManager.onUpdateReady( () => {
      wx.showModal({
        title: '更新提示',
        content: '新版本已经准备好，是否重启应用？',
        success: (res) => {
          if (res.confirm) {
            updateManager.applyUpdate()
          }
        }
      })
    })

    try {
      const storedCurrentCarId = wx.getStorageSync(CURRENT_CAR_ID_STORAGE_KEY)
      if (storedCurrentCarId) {
        this.globalData.currentCarId = storedCurrentCarId
      }
    } catch (e) {
      console.error('读取当前车辆缓存失败：', e)
    }

    wx.showLoading({ title: '' })
    this.getWechatOpenId()
      .then(() => {
        this.fetchCarListByOpenid()
      })
      .catch((err) => {
        console.error('获取 OpenID 失败：', err)
        wx.showToast({
          title: '登录失败',
          icon: 'error'
        })
      })
      .finally(() => {
        wx.hideLoading()
      })

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
  },

  getWechatOpenId() {
    return new Promise<string>((resolve, reject) => {
      wx.login({
        success: (loginRes) => {
          const code = loginRes.code

          if (!code) {
            reject(new Error('wx.login 未返回 code'))
            return
          }

          wx.request({
            url: `${this.globalData.supabaseFunctionsUrl}/${this.globalData.wechatOpenIdFunctionName}`,
            method: 'POST',
            header: {
              'apikey': this.globalData.supabaseAnonKey,
              'Authorization': `Bearer ${this.globalData.supabaseAnonKey}`,
              'Content-Type': 'application/json'
            },
            data: { code },
            success: (res: WechatMiniprogram.RequestSuccessCallbackResult<any>) => {
              const result = (res.data || {}) as {
                openid?: string,
                error?: string,
                errcode?: number,
                errmsg?: string,
              }

              if (res.statusCode >= 400) {
                reject(new Error(result.error || `Edge Function 请求失败，状态码：${res.statusCode}`))
                return
              }

              const openid = String(result.openid || '')

              if (!openid) {
                reject(new Error(result.errmsg || result.error || 'Edge Function 未返回 openid'))
                return
              }

              this.globalData.openid = openid

              if (this.globalData.openidReadyCallback) {
                this.globalData.openidReadyCallback()
              }

              resolve(openid)
            },
            fail: (err) => {
              reject(err)
            }
          })
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  },

  fetchCarListByOpenid() {

    wx.request({
      url: `${this.globalData.supabaseUrl}/${this.globalData.CAR_LIST_TABLE}?select=*&_openid=eq.${this.globalData.openid}&order=created_at.asc`,
      method: 'GET',
      header: {
        'apikey': apikey,
        'Authorization': `Bearer ${apikey}`,
        'Content-Type': 'application/json'
      },
      success: (res: any) => {
        const cars = (res.data || []) as any[]
        this.globalData.cars = cars

        let preferredId = this.globalData.currentCarId
        if (!preferredId) {
          try {
            const storedCurrentCarId = wx.getStorageSync(CURRENT_CAR_ID_STORAGE_KEY)
            preferredId = storedCurrentCarId || null
          } catch (e) {
            preferredId = null
          }
        }

        const currentExists = cars.some((car: any) => car.id === preferredId)
        this.globalData.currentCarId = currentExists
          ? preferredId
          : (cars.length > 0 ? cars[0].id : null)

        try {
          if (this.globalData.currentCarId) {
            wx.setStorageSync(CURRENT_CAR_ID_STORAGE_KEY, this.globalData.currentCarId)
          } else {
            wx.removeStorageSync(CURRENT_CAR_ID_STORAGE_KEY)
          }
        } catch (e) {
          console.error('写入当前车辆缓存失败：', e)
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
