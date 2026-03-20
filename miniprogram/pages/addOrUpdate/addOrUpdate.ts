import { RecordType } from '../../utils/types'
import { validateRecordNumber } from '../../utils/util'

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

function createDefaultRecord(): RecordType {
  return {
    id: '-1',
    date: getDateString(),
    time: getTimeString(),
    mileage: '',
    price: '',
    realPrice: '',
    quantity: '',
    pay: '',
    realPay: '',
    discountAmount: '',
    isAddFull: false,
    isWarningLight: false,
  }
}

const app = getApp()
const FUEL_LIST_TABLE = app.globalData.FUEL_LIST_TABLE as string

Page({
  data: {
    mode: 'add',
    currentCar: { name: '加载中...' } as any,
    isSaving: false,
    fuelList: [] as RecordType[],
    record: createDefaultRecord() as RecordType,
  },

  onLoad(options: Record<string, string>) {
    const mode = options && options.mode === 'update' ? 'update' : 'add'
    const pageTitle = mode === 'update' ? '修改记录' : '新增记录'

    this.setData({ mode, pageTitle })
    wx.setNavigationBarTitle({ title: pageTitle })
    this.setCurrentCar()

    if (mode === 'add') {
      const initPrice = wx.getStorageSync('price')
      if (initPrice) {
        this.setData({ 'record.price': String(initPrice) })
      }
      return
    }

    const eventChannel = this.getOpenerEventChannel()
    eventChannel.on('acceptDataFromOpenerPage', (data: any) => {
      const record = JSON.parse(JSON.stringify(data.record || {}))
      const fuelList = JSON.parse(JSON.stringify(data.fuelList || []))

      this.setData({
        record,
        fuelList,
      })
    })
  },

  onShow() {
    this.setCurrentCar()
  },

  setCurrentCar() {
    const app = getApp()
    if (!app.globalData.cars || app.globalData.cars.length === 0) {
      this.setData({ currentCar: { name: '暂无车辆' } })
      return
    }

    const currentCar = app.globalData.cars.find((car: any) => car.id === app.globalData.currentCarId)
      || app.globalData.cars[0]

    if (currentCar) {
      app.globalData.currentCarId = currentCar.id
    }

    this.setData({ currentCar: currentCar || { name: '未知车辆' } })
  },

  onRecordChange(e: { detail: RecordType }) {
    this.setData({ record: e.detail as RecordType })
  },

  async fetchFuelListByOpenid() {
    const openid = getApp().globalData.openid as string
    const carId = getApp().globalData.currentCarId
    if (!carId) return []

    try {
      const response = await new Promise((resolve, reject) => {
        wx.request({
          url: `${app.globalData.supabaseUrl}/${FUEL_LIST_TABLE}?select=*&_openid=eq.${openid}&carId=eq.${carId}&order=mileage.desc`,
          method: 'GET',
          header: {
            'apikey': app.globalData.supabaseAnonKey,
            'Authorization': `Bearer ${app.globalData.supabaseAnonKey}`,
            'Content-Type': 'application/json'
          },
          success: (res: any) => {
            const data = res.data || []
            resolve(data)
          },
          fail: (err) => {
            reject(err)
          }
        })
      })
      return response as any[]
    } catch (err) {
      console.error('Failed to fetch fuel list:', err)
      return []
    }
  },

  validateUpdateMileage() {
    const fuelList = this.data.fuelList
    const record = this.data.record

    if (fuelList.length <= 1) return true

    for (let i = 0; i < fuelList.length; i++) {
      if (fuelList[i].id !== record.id) continue

      if (i === 0) {
        if (Number(record.mileage) <= Number(fuelList[i + 1].mileage)) {
          wx.showToast({ title: '里程数不能小于下一条记录', icon: 'none' })
          return false
        }
      } else if (i === fuelList.length - 1) {
        if (Number(record.mileage) >= Number(fuelList[i - 1].mileage)) {
          wx.showToast({ title: '里程数不能大于上一条记录', icon: 'none' })
          return false
        }
      } else {
        if (Number(record.mileage) >= Number(fuelList[i - 1].mileage)) {
          wx.showToast({ title: '里程数不能大于上一条记录', icon: 'none' })
          return false
        }
        if (Number(record.mileage) <= Number(fuelList[i + 1].mileage)) {
          wx.showToast({ title: '里程数不能小于下一条记录', icon: 'none' })
          return false
        }
      }
    }

    return true
  },

  async saveRecord() {
    if (this.data.isSaving) return

    this.setData({ isSaving: true })

    if (this.data.mode === 'update') {
      this.updateRecord()
      return
    }

    this.addRecord()
  },

  async addRecord() {
    const app = getApp()
    if (!app.globalData.currentCarId) {
      wx.showToast({ title: '请先选择车辆', icon: 'none' })
      this.setData({ isSaving: false })
      return
    }

    const fuelList = await this.fetchFuelListByOpenid()
    if (validateRecordNumber(fuelList, this.data.record) === false) {
      this.setData({ isSaving: false })
      return
    }

    if (fuelList.length > 0 && Number(this.data.record.mileage) <= Number(fuelList[0].mileage)) {
      wx.showToast({ title: '当前里程不能小于最后一次记录的里程数', icon: 'none', duration: 2000 })
      this.setData({ isSaving: false })
      return
    }

    const newRecord: RecordType = {
      ...this.data.record,
      id: String(new Date().getTime()),
      date: getDateString(),
      time: getTimeString(),
    }
    
    // Convert empty strings to null and format numbers
    const formatField = (value: string) => value ? String(Number(value).toFixed(2)) : null
    
    const carName = (this.data.currentCar && this.data.currentCar.name) || ''
    const userNick = (app.globalData.userInfo && (app.globalData.userInfo as any).nickName)
      || (wx.getStorageSync('userInfo') && (wx.getStorageSync('userInfo') as any).nickName)
      || ''

    const recordData = {
      date: newRecord.date,
      time: newRecord.time,
      mileage: newRecord.mileage ? Number(newRecord.mileage) : null,
      price: formatField(newRecord.price),
      realPrice: formatField(newRecord.realPrice),
      quantity: formatField(newRecord.quantity),
      pay: formatField(newRecord.pay),
      realPay: formatField(newRecord.realPay),
      discountAmount: formatField(newRecord.discountAmount),
      isAddFull: newRecord.isAddFull,
      isWarningLight: newRecord.isWarningLight,
      carId: app.globalData.currentCarId,
      carName, 
      userNick,
      _openid: app.globalData.openid
    }

    wx.request({
      url: `${app.globalData.supabaseUrl}/${FUEL_LIST_TABLE}`,
      method: 'POST',
      header: {
        'apikey': app.globalData.supabaseAnonKey,
        'Authorization': `Bearer ${app.globalData.supabaseAnonKey}`,
        'Content-Type': 'application/json'
      },
      data: recordData,
      success: () => {
        wx.setStorageSync('price', String(newRecord.price))
        wx.showToast({ title: '保存成功', icon: 'none', duration: 1200 })
          .then(() => {
            setTimeout(() => wx.navigateBack(), 200)
          })
      },
      fail: () => {
        wx.showToast({ title: '保存失败', icon: 'none' })
      },
      complete: () => {
        this.setData({ isSaving: false })
      }
    })
  },

  updateRecord() {
    if (validateRecordNumber(this.data.fuelList, this.data.record) === false) {
      this.setData({ isSaving: false })
      return
    }

    if (!this.validateUpdateMileage()) {
      this.setData({ isSaving: false })
      return
    }

    const recordAny = this.data.record as any
    const recordId = recordAny.id
    if (!recordId) {
      wx.showToast({ title: '记录ID缺失', icon: 'none' })
      this.setData({ isSaving: false })
      return
    }
    wx.showLoading({ title: '保存中...' })

    const payload = { ...recordAny }
    delete payload.id
    delete payload._openid
    delete payload.cost
    delete payload.costLiter
    delete payload.diffMile
    delete payload.fuelConsumption

    // Keep numeric fields compatible with Supabase numeric/int columns.
    const toNullableFloat = (value: any) => {
      if (value === '' || value === null || value === undefined) return null
      const num = Number(value)
      return Number.isNaN(num) ? null : Number(num.toFixed(2))
    }
    const toNullableInt = (value: any) => {
      if (value === '' || value === null || value === undefined) return null
      const num = Number(value)
      return Number.isNaN(num) ? null : Math.trunc(num)
    }

    payload.mileage = toNullableInt(payload.mileage)
    payload.price = toNullableFloat(payload.price)
    payload.realPrice = toNullableFloat(payload.realPrice)
    payload.quantity = toNullableFloat(payload.quantity)
    payload.pay = toNullableFloat(payload.pay)
    payload.realPay = toNullableFloat(payload.realPay)
    payload.discountAmount = toNullableFloat(payload.discountAmount)

    wx.request({
      url: `${app.globalData.supabaseUrl}/${FUEL_LIST_TABLE}?id=eq.${recordId}`,
      method: 'PATCH' as any,
      header: {
        'apikey': app.globalData.supabaseAnonKey,
        'Authorization': `Bearer ${app.globalData.supabaseAnonKey}`,
        'Content-Type': 'application/json'
      },
      data: payload,
      success: () => {
        wx.showToast({ title: '修改成功', icon: 'none', duration: 1200 })
          .then(() => {
            setTimeout(() => wx.navigateBack(), 200)
          })
      },
      fail: () => {
        wx.showToast({ title: '修改失败', icon: 'none', duration: 2000 })
      },
      complete: () => {
        wx.hideLoading()
        this.setData({ isSaving: false })
      }
    })
  },
})
