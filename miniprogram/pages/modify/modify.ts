import {RecordType} from '../../utils/types'
import {validateRecordNumber} from "../../utils/util";

Page({
  data: {
    fuelList: [] as RecordType[],
    record: {} as RecordType,
  },
  onLoad(){
    const eventChannel = this.getOpenerEventChannel()
    eventChannel.on('acceptDataFromOpenerPage', (data) => {
      const record = data.record as RecordType
      const fuelList = data.fuelList as RecordType[]
      
      this.setData({
        fuelList: fuelList,
        record: record,
      })
    })
  },
  onRecordChange(e: { detail: RecordType }) {
    this.setData({
      record: e.detail,
    })
  },
  updateRecord() {
    if(validateRecordNumber(this.data.fuelList, this.data.record) === false) {
      return
    }
    
    // 当前修改的记录 里程数不能大于 下一条记录的里程数，且不能小于上一条记录的里程数
    if (this.data.fuelList.length > 1) {
      for (let i = 0; i < this.data.fuelList.length; i++) {
        
        if (this.data.fuelList[i].id === this.data.record.id) {
          if (i === 0) {
            // 当前修改的是第一条记录， 也就是最新的那条记录
            if(Number(this.data.record.mileage) <= Number(this.data.fuelList[i + 1].mileage)) {
              wx.showToast({
                title: '里程数不能小于下一条记录',
                icon: 'none',
              })
              return
            }
          } else if(i === this.data.fuelList.length - 1)   {
            // 当前修改的是最后一条记录
            
            if(Number(this.data.record.mileage) >= Number(this.data.fuelList[i - 1].mileage)) {
              wx.showToast({
                title: '里程数不能大于上一条记录',
                icon: 'none',
              })
              return
            }
          } else {
            // 当前修改的不是第一条也不是最后一条记录
            if(Number(this.data.record.mileage) >= Number(this.data.fuelList[i - 1].mileage)) {
              wx.showToast({
                title: '里程数不能大于上一条记录',
                icon: 'none',
              })
              return
            }
            if(Number(this.data.record.mileage) <= Number(this.data.fuelList[i + 1].mileage)) {
              wx.showToast({
                title: '里程数不能小于下一条记录',
                icon: 'none',
              })
              return
            }
          }
        }
      }
    }
    
    
    const eventChannel = this.getOpenerEventChannel()
    eventChannel.emit('updateRecord', this.data.record)
    
    setTimeout(() => {
      wx.navigateBack()
    }, 0)
  }
})
