import {RecordType} from "./types";

export const formatTime = (date: Date) => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return (
    [year, month, day].map(formatNumber).join('/') +
    ' ' +
    [hour, minute, second].map(formatNumber).join(':')
  )
}

const formatNumber = (n: number) => {
  const s = n.toString()
  return s[1] ? s : '0' + s
}


export const validateRecordNumber = (fuelList: RecordType[], newRecord: RecordType) => {

  // use regular expression to validate price is a valid number (integer or float)
  const numberRegex = /^\d+(\.\d+)?$/;

  if (!numberRegex.test(String(newRecord.mileage))) {
    wx.showToast({
      title: '里程必须是有效数字',
      icon: 'none',
      duration: 2000
    })
    return false
  }

  if (!numberRegex.test(String(newRecord.price))) {
    wx.showToast({
      title: '单价必须是有效数字',
      icon: 'none',
      duration: 2000
    })
    return false
  }

  if (!numberRegex.test(String(newRecord.quantity))) {
    wx.showToast({
      title: '加油量必须是有效数字',
      icon: 'none',
      duration: 2000
    })
    return false
  }

  if (!numberRegex.test(String(newRecord.pay))) {
    wx.showToast({
      title: '实付金额必须是有效数字',
      icon: 'none',
      duration: 2000
    })
    return false
  }
  
  return true
}
