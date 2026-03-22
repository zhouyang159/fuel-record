const app = getApp()

Page({
  data: {
    cars: [] as any[],
    isMutating: false,
    mutatingText: '',
  },

  onLoad() {
    this.fetchCarList()
  },

  fetchCarList() {
    const app = getApp()

    if (!app.globalData.openid) {
      console.error('OpenID not available')
      return
    }

    wx.request({
      url: `${app.globalData.supabaseUrl}/${app.globalData.CAR_LIST_TABLE}?select=*&_openid=eq.${app.globalData.openid}&order=created_at.asc`,
      method: 'GET',
      header: {
        'apikey': app.globalData.supabaseAnonKey,
        'Authorization': `Bearer ${app.globalData.supabaseAnonKey}`,
        'Content-Type': 'application/json'
      },
      success: (res: any) => {
        const cars = res.data || [] as any[]
        this.setData({ cars })
        app.globalData.cars = cars

        const currentCarExists = cars.some((car: any) => car.id === app.globalData.currentCarId)
        if (!currentCarExists) {
          app.globalData.currentCarId = cars.length > 0 ? cars[0].id : null
        }
      },
      fail: (err) => {
        console.error('Failed to fetch car list:', err)
      }
    })
  },

  addCar() {
    if (this.data.isMutating) return

    if (this.data.cars.length >= 5) {
      wx.showToast({ title: '最多添加 5 辆车', icon: 'error' })
      return
    }
    const app = getApp()
    const userNick = (app.globalData.userInfo && (app.globalData.userInfo as any).nickName)
      || (wx.getStorageSync('userInfo') && (wx.getStorageSync('userInfo') as any).nickName)
      || ''

    let newCar = {
      name: `车辆${this.data.cars.length + 1}`,
      userNick,
      _openid: app.globalData.openid
    }
    this.setData({ isMutating: true, mutatingText: '正在添加' })

    wx.request({
      url: `${app.globalData.supabaseUrl}/${app.globalData.CAR_LIST_TABLE}`,
      method: 'POST',
      header: {
        'apikey': app.globalData.supabaseAnonKey,
        'Authorization': `Bearer ${app.globalData.supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      data: newCar,
      success: () => {
        this.fetchCarList()
        wx.showToast({ title: '添加成功', icon: 'success' })
      },
      fail: () => {
        wx.showToast({ title: '添加失败', icon: 'error' })
      },
      complete: () => {
        this.setData({ isMutating: false, mutatingText: '' })
      }
    })
  },

  setCurrentCar(event) {
    const carId = event.currentTarget.dataset.id
    const app = getApp()
    app.globalData.currentCarId = carId

    wx.navigateBack()
  },

  deleteCar(event) {
    if (this.data.isMutating) return

    if (this.data.cars.length <= 1) {
      wx.showToast({ title: '至少保留一辆车', icon: 'none' })
      return
    }

    wx.showModal({
      title: '删除车辆',
      content: '确定要删除这辆车吗？这将删除与该车相关的所有加油记录，且无法恢复。',
      confirmText: '删除',
      confirmColor: '#d9534f',
      cancelText: '取消',
      success: (res) => {
        if (!res.confirm) return

        const carId = event.currentTarget.dataset.id

        this.setData({ isMutating: true, mutatingText: '正在删除' })

        // Remove fuel records first, then delete car only if that succeeds
        wx.request({
          url: `${app.globalData.supabaseUrl}/${app.globalData.FUEL_LIST_TABLE}?carId=eq.${carId}`,
          method: 'DELETE',
          header: {
            'apikey': app.globalData.supabaseAnonKey,
            'Authorization': `Bearer ${app.globalData.supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          success: () => {
            // Now delete the car
            wx.request({
              url: `${app.globalData.supabaseUrl}/${app.globalData.CAR_LIST_TABLE}?id=eq.${carId}`,
              method: 'DELETE',
              header: {
                'apikey': app.globalData.supabaseAnonKey,
                'Authorization': `Bearer ${app.globalData.supabaseAnonKey}`,
                'Content-Type': 'application/json',
              },
              success: () => {
                wx.showToast({ title: '删除成功', icon: 'success' })
                this.fetchCarList()
              },
              fail: () => {
                wx.showToast({ title: '删除失败', icon: 'error' })
              },
              complete: () => {
                this.setData({ isMutating: false, mutatingText: '' })
              }
            })
          },
          fail: (err) => {
            console.error('deleteCar error', err)
            wx.showToast({ title: '删除失败，请稍后重试', icon: 'error' })
            this.setData({ isMutating: false, mutatingText: '' })
          }
        })
      }
    })
  },

  renameCar(event) {
    const carId = event.currentTarget.dataset.id
    const currentName = event.currentTarget.dataset.name || ''

    wx.showModal({
      title: '修改车辆名称',
      editable: true,
      content: currentName,
      placeholderText: '请输入车辆名称',
      success: (res) => {
        if (!res.confirm) return

        const newName = (res.content || '').trim()
        if (!newName) {
          wx.showToast({ title: '名称不能为空', icon: 'none' })
          return
        }

        wx.showLoading({ title: '保存中...' })
        wx.request({
          url: `${app.globalData.supabaseUrl}/${app.globalData.CAR_LIST_TABLE}?id=eq.${carId}`,
          method: 'PATCH',
          header: {
            'apikey': app.globalData.supabaseAnonKey,
            'Authorization': `Bearer ${app.globalData.supabaseAnonKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          data: { name: newName },
          success: () => {
            wx.showToast({ title: '修改成功', icon: 'success' })
          },
          fail: () => {
            wx.showToast({ title: '修改失败', icon: 'error' })
          },
          complete: () => {
            wx.hideLoading()
            this.fetchCarList()
          }
        })
      }
    })
  },

  noop() { }
})
