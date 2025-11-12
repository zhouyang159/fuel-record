import {RecordType} from '../../utils/types'

Page({
  data: {
    record: {} as RecordType,
  },
  onLoad(){
    const eventChannel = this.getOpenerEventChannel()
    eventChannel.on('acceptDataFromOpenerPage', (data) => {
      const record = data.record as RecordType

      this.setData({
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
    const eventChannel = this.getOpenerEventChannel()
    eventChannel.emit('updateRecord', this.data.record)
    
    setTimeout(() => {
      wx.navigateBack()
    }, 0)
  }
})
