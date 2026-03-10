import { RecordType, ShowCardType } from '../../utils/types'
import Dialog from '../../miniprogram_npm/@vant/weapp/dialog/dialog'

const app = getApp()
const FUEL_LIST_TABLE = app.globalData.FUEL_LIST_TABLE as string
const CAR_LOAD_TIMEOUT = 10000
const POLL_INTERVAL = 300


Page({
  data: {
    currentCar: { name: '加载中...' } as any,
    carList: [] as any[],
    showCarPopup: false,
    fuelList: [] as RecordType[],
    showCardArr: [] as ShowCardType[],
    displayCardArr: [] as ShowCardType[],
    nbFrontColor: '#000000',
    nbBackgroundColor: '#ffffff',
    swipeCellId: -1 as number,
    isRefreshing: false,
    summaryBoard: {
      totalCost: 0,
      avgFuelConsumption: 0,
      totalMileage: 0,
      year: new Date().getFullYear()
    } as any,
    showYearPicker: false,
    yearRange: [] as number[],
  },
  onLoad() {
    const app = getApp()

    if (app.globalData.openid) {
      this.fetchFuelListByOpenid()
    } else {
      app.globalData.openidReadyCallback = () => {
        this.fetchFuelListByOpenid()
          .then(list => {
            this.setData({ fuelList: JSON.parse(JSON.stringify(list)) as RecordType[] })
            this.calCost()
          })
      }
    }

    this.initCarDataListener()
    this.generateYearRange()
  },
  onReady() {
    this.syncCarList()
    this.setCurrentCar()
    this.calCost()
  },
  onShow() {
    this.syncCarList()
    this.setCurrentCar()
    this.fetchFuelListByOpenid()
      .then(list => {
        this.setData({ fuelList: JSON.parse(JSON.stringify(list)) as RecordType[] })
        this.calCost()
      })
  },

  onPullDownRefresh() {
    this.setData({ isRefreshing: true })
    this.fetchFuelListByOpenid()
      .then(list => {
        this.setData({ 
          fuelList: JSON.parse(JSON.stringify(list)) as RecordType[],
          isRefreshing: false 
        })
        this.calCost()
        wx.stopPullDownRefresh()
        wx.showToast({ title: '刷新成功', icon: 'success', duration: 1500 })
      })
      .catch(() => {
        this.setData({ isRefreshing: false })
        wx.stopPullDownRefresh()
        wx.showToast({ title: '刷新失败', icon: 'error', duration: 1500 })
      })
  },

  initCarDataListener() {
    const app = getApp()
    const startTime = Date.now()

    const checkCarData = () => {
      if (Date.now() - startTime > CAR_LOAD_TIMEOUT) {
        this.setData({ currentCar: { name: '车辆数据加载失败' } })
        return
      }

      if (app.globalData.cars.length > 0) {
        this.setCurrentCar()
        return
      }

      setTimeout(checkCarData, POLL_INTERVAL)
    }

    if (!app.globalData.carReadyCallback) {
      app.globalData.carReadyCallback = () => {
        this.syncCarList()
        this.setCurrentCar()
        this.fetchFuelListByOpenid()
          .then(list => {
            this.setData({ fuelList: JSON.parse(JSON.stringify(list)) as RecordType[] })
            this.calCost()
          })
      }
    }

    checkCarData()
  },

  setCurrentCar() {
    const app = getApp()
    if (!app.globalData.cars || app.globalData.cars.length === 0) {
      this.setData({
        currentCar: { name: '暂无车辆' },
      })
      return
    }

    const currentCar = app.globalData.cars.find(car => car._id === app.globalData.currentCarId)
      || app.globalData.cars[0]

    this.setData({
      currentCar: currentCar || { name: '未知车辆' },
    })
  },

  syncCarList() {
    const app = getApp()
    this.setData({
      carList: app.globalData.cars || [],
    })
  },

  openCarPopup() {
    this.syncCarList()
    this.setData({ showCarPopup: true })
  },

  closeCarPopup() {
    this.setData({ showCarPopup: false })
  },

  switchCurrentCar(e: any) {
    const carId = e.currentTarget.dataset.id
    const app = getApp()
    if (!carId || carId === app.globalData.currentCarId) {
      this.closeCarPopup()
      return
    }

    this.setData({
      'summaryBoard.year': '全部',
    })


    app.globalData.currentCarId = carId
    this.syncCarList()
    this.setCurrentCar()
    this.closeCarPopup()
    this.closeAllSwipeCells()

    this.fetchFuelListByOpenid()
      .then(list => {
        this.setData({ fuelList: JSON.parse(JSON.stringify(list)) as RecordType[] })
        this.calCost()
      })
  },

  toCarsPage() {
    this.closeCarPopup()
    wx.navigateTo({
      url: '/pages/cars/cars',
    })
  },

  toAddPage() {
    this.closeCarPopup()
    wx.navigateTo({
      url: '/pages/addOrUpdate/addOrUpdate?mode=add',
    })
  },

  async removeAllRecordsByUserId(userId: string) {
    const db = wx.cloud.database()
    return await db.collection(FUEL_LIST_TABLE).where({ userId }).remove()
  },
  async fetchFuelListByOpenid() {
    const db = wx.cloud.database()
    const openid = getApp().globalData.openid as string
    const carId = getApp().globalData.currentCarId
    if (!carId) return []
    wx.showLoading({ title: '加载中...' })
    let res = await db.collection(FUEL_LIST_TABLE).where({ _openid: openid, carId }).get()
    wx.hideLoading()
    res.data.sort((a, b) => b.mileage - a.mileage)
    return res.data
  },
  onSwipeCellOpen(event) {
    const id = event.currentTarget.dataset.id
    this.setData({ swipeCellId: id })
  },
  onSwipeCellClose(event) {
    const clickId = event.currentTarget.dataset.id
    const { position, instance } = event.detail
    switch (position) {
      case 'cell': instance.close(); break
      case 'right':
        instance.close()
        Dialog.confirm({ message: '确定删除吗？' }).then(() => {
          instance.close()
          let deleteItem = this.data.fuelList.find(item => item.id === clickId)
          if (!deleteItem) return
          wx.cloud.database().collection(FUEL_LIST_TABLE).where({ _id: deleteItem._id }).remove()
            .then(() => {
              wx.showToast({ title: '删除成功', icon: 'none', duration: 2000 })
              this.fetchFuelListByOpenid()
                .then(list => {
                  this.setData({ fuelList: JSON.parse(JSON.stringify(list)) as RecordType[] })
                  this.calCost()
                })
            })
        })
        break
    }
    this.setData({ swipeCellId: -1 })
  },
  closeAllSwipeCells() {
    const len = this.data.displayCardArr.length
    for (let i = 0; i < len; i++) {
      const instance = this.selectComponent(`#swipe-${i}`)
      if (instance) instance.close()
    }
    this.setData({ swipeCellId: -1 })
  },
  calCost() {
    const showCardArr: ShowCardType[] = JSON.parse(JSON.stringify(this.data.fuelList))
    const n = showCardArr.length
    const segments: number[] = new Array(Math.max(0, n - 1)).fill(0)

    for (let k = 0; k < n - 1; k++) {
      const m1 = Number(showCardArr[k].mileage) || 0
      const m2 = Number(showCardArr[k + 1].mileage) || 0
      segments[k] = m1 - m2
      showCardArr[k].diffMile = segments[k]
    }
    if (n > 0) showCardArr[n - 1].diffMile = showCardArr[n - 1].diffMile || 0

    for (let i = 0; i < n; i++) {
      showCardArr[i].cost = 0
      showCardArr[i].costLiter = 0
      showCardArr[i].fuelConsumption = 0
    }

    const distribute = (s: number, e: number, totalLiters: number) => {
      const totalDistance = segments.slice(s, e).reduce((a, b) => a + b, 0)
      if (totalDistance <= 0) return
      const avgLPer100km = (totalLiters / totalDistance) * 100
      for (let k = s; k < e; k++) {
        const segDist = segments[k] || 0
        const consumeLiters = segDist * (avgLPer100km / 100)
        showCardArr[k].fuelConsumption = Number(avgLPer100km.toFixed(2))
        showCardArr[k].costLiter = -Number(consumeLiters.toFixed(2))
        const price = Number(showCardArr[k].price) || 0
        showCardArr[k].cost = segDist > 0 ? Number(((price * consumeLiters) / segDist).toFixed(2)) : 0
      }
    }

    const fullIndexes: number[] = []
    for (let i = 0; i < n; i++) if (showCardArr[i].isAddFull) fullIndexes.push(i)
    const covered = new Array(Math.max(0, n - 1)).fill(false)

    for (let fi = fullIndexes.length - 1; fi >= 1; fi--) {
      const oldIdx = fullIndexes[fi]
      const newIdx = fullIndexes[fi - 1]
      if (!(oldIdx > newIdx)) continue
      const s = newIdx
      const e = oldIdx
      const totalLiters = showCardArr.slice(s, e).reduce((sum, v) => sum + (Number(v.quantity) || 0), 0)
      distribute(s, e, totalLiters)
      for (let k = s; k < e; k++) covered[k] = true
    }

    const warnIndexes: number[] = []
    for (let i = 0; i < n; i++) if (showCardArr[i].isWarningLight) warnIndexes.push(i)
    for (let wi = warnIndexes.length - 1; wi >= 1; wi--) {
      const oldIdx = warnIndexes[wi]
      const newIdx = warnIndexes[wi - 1]
      if (!(oldIdx > newIdx)) continue
      const hasFull = showCardArr.slice(newIdx + 1, oldIdx).some(v => v.isAddFull)
      if (hasFull) continue
      const s = newIdx
      const e = oldIdx
      const totalDistance = segments.slice(s, e).reduce((a, b) => a + b, 0)
      if (totalDistance <= 0) continue
      const totalLiters = Number(showCardArr[oldIdx].quantity) || 0
      if (totalLiters > 0) {
        const avg = (totalLiters / totalDistance) * 100
        for (let k = s; k < e; k++) {
          if (covered[k]) continue
          const segDist = segments[k] || 0
          const consumeLiters = segDist * (avg / 100)
          showCardArr[k].fuelConsumption = Number(avg.toFixed(2))
          showCardArr[k].costLiter = -Number(consumeLiters.toFixed(2))
          const price = Number(showCardArr[k].price) || 0
          showCardArr[k].cost = segDist > 0 ? Number(((price * consumeLiters) / segDist).toFixed(2)) : 0
        }
      }
    }

    this.setData({ showCardArr })
    this.setData({ displayCardArr: showCardArr })
    this.calculateSummary()
  },
  calculateSummary() {
    const { fuelList, showCardArr, summaryBoard } = this.data
    const selectedYear = summaryBoard.year
    
    // Filter records by selected year (skip if '全部')
    let filteredList = fuelList
    let filteredShowCardArr = showCardArr
    if (selectedYear !== '全部') {
      filteredList = fuelList.filter(item => {
        const date = item.date || ''
        const year = parseInt(date.split('-')[0]) || 0
        return year === selectedYear
      })
      filteredShowCardArr = showCardArr.filter(item => {
        const date = item.date || ''
        const year = parseInt(date.split('-')[0]) || 0
        return year === selectedYear
      })
    }
    
    // Calculate total cost
    const totalCost = filteredList.reduce((sum, item) => {
      const pay = Number(item.pay) || 0
      return sum + pay
    }, 0)
    
    // Calculate average fuel consumption from showCardArr
    const validConsumptions = filteredShowCardArr.filter(item => item.fuelConsumption && item.fuelConsumption > 0)
    const avgFuelConsumption = validConsumptions.length > 0 
      ? (validConsumptions.reduce((sum, item) => sum + item.fuelConsumption, 0) / validConsumptions.length)
      : 0
    
    // Calculate total mileage (difference between first and last record)
    let totalMileage = 0
    if (filteredList.length >= 2) {
      const maxMileage = Math.max(...filteredList.map(item => Number(item.mileage) || 0))
      const minMileage = Math.min(...filteredList.map(item => Number(item.mileage) || 0))
      totalMileage = maxMileage - minMileage
    }
    
    this.setData({
      summaryBoard: {
        totalCost: Number(totalCost.toFixed(2)),
        avgFuelConsumption: Number(avgFuelConsumption.toFixed(2)),
        totalMileage: totalMileage,
        year: selectedYear
      }
    })
  },
  toModifyPage(e: any) {
    const navigate = () => {
      const id = e.currentTarget.dataset.id
      const record = this.data.fuelList.find(item => item.id === id)
      if (!record) return
      wx.navigateTo({
        url: '/pages/addOrUpdate/addOrUpdate?mode=update',
        success: (res) => {
          res.eventChannel.emit('acceptDataFromOpenerPage', { fuelList: this.data.fuelList, record })
        }
      })
    }

    if (this.data.swipeCellId === -1) {
      navigate()
    } else {
      if (this.data.swipeCellId === e.currentTarget.dataset.id) {
        console.log('点击了同一个打开的 SwipeCell，关闭它但不跳转')
      } else {
        this.closeAllSwipeCells()
        setTimeout(navigate, 10)
      }
    }
  },
  generateYearRange() {
    const currentYear = new Date().getFullYear()
    const yearRange: Array<number|string> = []
    yearRange.push('全部')
    for (let i = currentYear; i >= currentYear - 10; i--) {
      yearRange.push(i)
    }
    this.setData({ yearRange })
  },
  onYearSelectorTap() {
    this.setData({ showYearPicker: true })
  },
  onYearPickerChange(e: any) {
    const { value } = e.detail
    const selectedYear = this.data.yearRange[value[0]]
    
    // Filter fuelList and showCardArr by selected year, if not '全部'
    let filteredShowCardArr = this.data.showCardArr
    if (selectedYear !== '全部') {
      filteredShowCardArr = this.data.showCardArr.filter(item => {
        const date = item.date || ''
        const year = parseInt(date.split('-')[0]) || 0
        return year === selectedYear
      })
    }
    
    this.setData({
      showYearPicker: false,
      'summaryBoard.year': selectedYear,
      displayCardArr: filteredShowCardArr
    } as any)
    this.calculateSummary()
  },
  onYearPickerCancel() {
    this.setData({ showYearPicker: false })
  },
  noop() { },
})
