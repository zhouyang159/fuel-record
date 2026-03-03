import { RecordType, ShowCardType } from '../../utils/types'
import { validateRecordNumber } from '../../utils/util'
import Dialog from '../../miniprogram_npm/@vant/weapp/dialog/dialog'

function getDateString(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${year}-${month}-${day}`
}

function getTimeString(): string {
  const date = new Date()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const formatNum = (num: number) => num.toString().padStart(2, '0')
  return `${formatNum(hour)}:${formatNum(minute)}`
}

const app = getApp()
const FUEL_LIST_TABLE = app.globalData.FUEL_LIST_TABLE as string
const CAR_LOAD_TIMEOUT = 10000
const POLL_INTERVAL = 300


Page({
  data: {
    currentCar: { name: '加载中...' } as any,
    newRecord: {
      id: '-1',
      date: getDateString(),
      time: getTimeString(),
      mileage: '',
      price: '',
      quantity: '',
      pay: '',
      isAddFull: false,
      isWarningLight: false,
    } as RecordType,
    fuelList: [] as RecordType[],
    showCardArr: [] as ShowCardType[],
    nbFrontColor: '#000000',
    nbBackgroundColor: '#ffffff',
    swipeCellId: -1 as number,
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

    let initPrice = wx.getStorageSync('price')
    if (initPrice) {
      this.setData({ 'newRecord.price': Number(initPrice) })
    }

    this.initCarDataListener()
  },
  onReady() {
    this.setCurrentCar()
    this.calCost()
  },
  onShow() {
    this.setCurrentCar()
    this.fetchFuelListByOpenid()
      .then(list => {
        this.setData({ fuelList: JSON.parse(JSON.stringify(list)) as RecordType[] })
        this.calCost()
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
      return
    }

    const currentCar = app.globalData.cars.find(car => car._id === app.globalData.currentCarId)
      || app.globalData.cars[0]

    this.setData({
      currentCar: currentCar || { name: '未知车辆' },
    })
  },

  toCarsPage() {
    wx.navigateTo({
      url: '/pages/cars/cars',
    })
  },

  onRecordChange(e: { detail: RecordType }) {
    let newVal = e.detail
    this.setData({ newRecord: newVal as RecordType })
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
  addRecord() {
    if (validateRecordNumber(this.data.fuelList, this.data.newRecord) === false) return
    if (this.data.fuelList.length > 0 && Number(this.data.newRecord.mileage) <= Number(this.data.fuelList[0].mileage)) {
      wx.showToast({ title: '当前里程不能小于最后一次记录的里程数', icon: 'none', duration: 2000 })
      return
    }

    let newRecord: RecordType = {
      ...this.data.newRecord,
      id: String(new Date().getTime()),
      date: getDateString(),
      time: getTimeString(),
    }
    newRecord.price = String(Number(newRecord.price).toFixed(2))
    newRecord.quantity = String(Number(newRecord.quantity).toFixed(2))
    newRecord.pay = String(Number(newRecord.pay).toFixed(2))

    const db = wx.cloud.database()
    const app = getApp()
    const carName = (this.data.currentCar && this.data.currentCar.name) || ''
    const userNick = (app.globalData.userInfo && (app.globalData.userInfo as any).nickName)
      || (wx.getStorageSync('userInfo') && (wx.getStorageSync('userInfo') as any).nickName)
      || ''

    db.collection(FUEL_LIST_TABLE).add({ data: { ...newRecord, carId: app.globalData.currentCarId, carName, userNick } })
      .then(() => {
        this.setData({
          newRecord: {
            id: String(new Date().getTime()),
            date: getDateString(),
            time: getTimeString(),
            mileage: newRecord.mileage,
            price: newRecord.price,
            quantity: '',
            pay: '',
            isAddFull: false,
            isWarningLight: false,
            carName,
            userNick,
          }
        })
        wx.setStorageSync('price', String(newRecord.price))
        wx.showToast({ title: '保存成功', icon: 'none', duration: 2000 })
          .then(() => {
            setTimeout(() => {
              this.fetchFuelListByOpenid()
                .then(list => {
                  this.setData({ fuelList: JSON.parse(JSON.stringify(list)) as RecordType[] })
                  this.calCost()
                })
            }, 500)
          })
      })
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
    const len = this.data.showCardArr.length
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
  },
  toModifyPage(e: any) {
    const navigate = () => {
      const index = e.currentTarget.dataset.index
      const record = this.data.showCardArr[index]
      wx.navigateTo({
        url: '/pages/modify/modify',
        events: {
          updateRecord: (newRecord: RecordType) => {
            wx.showLoading({ title: '保存中...' })
            let _id = newRecord._id
            delete newRecord._id
            delete newRecord._openid
            wx.cloud.database().collection(FUEL_LIST_TABLE).where({ _id }).update({ data: newRecord })
              .then(() => {
                wx.showToast({ title: '修改成功', icon: 'none', duration: 2000 })
                this.fetchFuelListByOpenid()
                  .then(list => {
                    this.setData({ fuelList: JSON.parse(JSON.stringify(list)) as RecordType[] })
                    this.calCost()
                  })
              })
              .catch(() => wx.showToast({ title: '修改失败', icon: 'none', duration: 2000 }))
              .finally(() => wx.hideLoading())
          }
        },
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
})
