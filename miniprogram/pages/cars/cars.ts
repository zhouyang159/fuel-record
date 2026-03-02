const app = getApp()
const CAR_LIST_TABLE = app.globalData.CAR_LIST_TABLE

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
    return wx.cloud.database()
      .collection(CAR_LIST_TABLE)
      .get()
      .then(res => {
        const cars = res.data || []
        this.setData({ cars })
        app.globalData.cars = cars

        const currentCarExists = cars.some(car => car._id === app.globalData.currentCarId)
        if (!currentCarExists) {
          app.globalData.currentCarId = cars.length > 0 ? cars[0]._id : null
        }
      })
  },

  addCar() {
    if (this.data.isMutating) return

    if (this.data.cars.length >= 5) {
      wx.showToast({ title: '最多添加5辆车', icon: 'error' })
      return
    }

    let newCar = { name: `车辆${this.data.cars.length + 1}` }
    this.setData({ isMutating: true, mutatingText: '正在添加' })

    wx.cloud.database()
      .collection(CAR_LIST_TABLE)
      .add({ data: newCar })
      .then(() => {
        this.fetchCarList()
        wx.showToast({ title: '添加成功', icon: 'success' })
      })
      .finally(() => {
        this.setData({ isMutating: false, mutatingText: '' })
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

    const carId = event.currentTarget.dataset.id

    this.setData({ isMutating: true, mutatingText: '正在删除' })

    wx.cloud.database()
      .collection(CAR_LIST_TABLE)
      .doc(carId)
      .remove()
      .then(() => {
        wx.showToast({ title: '删除成功', icon: 'success' })
        this.fetchCarList()
      })
      .catch(() => {
        wx.showToast({ title: '删除失败', icon: 'error' })
      })
      .finally(() => {
        this.setData({ isMutating: false, mutatingText: '' })
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
        wx.cloud.database()
          .collection(CAR_LIST_TABLE)
          .doc(carId)
          .update({ data: { name: newName } })
          .then(() => {
            wx.showToast({ title: '修改成功', icon: 'success' })
            this.fetchCarList()
          })
          .catch(() => {
            wx.showToast({ title: '修改失败', icon: 'error' })
          })
          .finally(() => {
            wx.hideLoading()
          })
      }
    })
  },

  noop() {}
})
