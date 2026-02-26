const app = getApp()
const CAR_LIST_TABLE = app.globalData.CAR_LIST_TABLE

Page({
  data: {
    cars: []
  },

  onLoad() {
    this.fetchCarList()
  },

  fetchCarList() {
    wx.cloud.database()
      .collection(CAR_LIST_TABLE)
      .get()
      .then(res => {
        this.setData({ cars: res.data })
      })
  },

  addCar() {
    if (this.data.cars.length >= 5) {
      wx.showToast({ title: '最多添加5辆车', icon: 'error' })
      return
    }

    let newCar = { name: `车辆${this.data.cars.length + 1}` }

    wx.cloud.database()
      .collection(CAR_LIST_TABLE)
      .add({ data: newCar })
      .then(res => {
        this.fetchCarList()
        wx.showToast({ title: '添加成功', icon: 'success' })

        // Update global cars after add
        app.globalData.cars = this.data.cars
      })
  },

  setCurrentCar(event) {
    const carId = event.currentTarget.dataset.id
    const app = getApp()
    app.globalData.currentCarId = carId

    wx.navigateBack()
  },

  deleteCar(event) {
    const carId = event.currentTarget.dataset.id

    wx.showLoading({ title: '删除中...' })

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
        wx.hideLoading()
      })
  },
})