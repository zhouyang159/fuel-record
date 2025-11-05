// index.ts
// 获取应用实例
const app = getApp<IAppOption>()
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

interface RecordType {
  date: string,
  mileage: number,
  price: number,
  quantity: number,
  pay: number,
  isAddFull: boolean,
  isWarningLight: boolean,

  fuleConsumption?: number,
}

function getNowString(): string {
  const date = new Date()

  const year = date.getFullYear()
  // 月份从0开始，需+1
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  // 补零：不足两位的数字前加0（如1→01）
  const formatNum = (num: number) => num.toString().padStart(2, '0')

  // 拼接格式（注意：你要的是“11-5”而非“11-05”，所以month和day不补零）
  return `${year}-${month}-${day} ${formatNum(hour)}:${formatNum(minute)}:${formatNum(second)}`
}

Component({
  data: {
    userInfo: {
      avatarUrl: defaultAvatarUrl,
      nickName: '',
    },
    hasUserInfo: false,
    canIUseGetUserProfile: wx.canIUse('getUserProfile'),
    canIUseNicknameComp: wx.canIUse('input.type.nickname'),

    newRecord: {
      date: getNowString(),
      mileage: 0,

      price: 8,
      quantity: 0,
      pay: 0,
      isAddFull: true,
      isWarningLight: true,
    } as RecordType,

    fuelList: [
      {
        date: "2025-10-11 14:22:30",
        mileage: 0,
        price: 0,
        quantity: 0,
        pay: 0,
        isAddFull: true,
        isWarningLight: true,
      },
      {
        date: "2025-11-5 14:22:30",
        mileage: 300,
        price: 7.9,
        quantity: 5,
        pay: 192,
        isAddFull: true,
        isWarningLight: true,
      },
    ] as RecordType[],
  },
  lifetimes: {
    created() {
      console.log('组件实例被创建');
    },
    attached() {
      console.log('组件实例进入页面节点树');
      // ✅ Load from local storage
      const storedList = wx.getStorageSync('fuelList')
      if (storedList && Array.isArray(storedList) && storedList.length > 0) {
        this.setData({
          fuelList: storedList
        })
      }

      // ✅ Recalculate fuel consumption
      this.calFuleConsumption()
    },
    ready() {
      console.log('组件视图层布局完成');
    },
    moved() {
      console.log('组件实例被移动');
    },
    detached() {
      console.log('组件实例被移除');
    },
    error(err) {
      console.log('组件方法抛出错误', err);
    }
  },
  methods: {
    onMileageChange(e: any) {
      const mileage = Number(e.detail.value)
      this.setData({
        "newRecord.mileage": mileage
      })
    },
    onPriceChange(e: any) {
      const price = Number(e.detail.value)
      this.setData({
        "newRecord.price": price
      })
    },
    onQuantityChange(e: any) {
      const quantity = Number(e.detail.value)
      this.setData({
        "newRecord.quantity": quantity
      })
    },
    onPayChange(e: any) {
      const pay = Number(e.detail.value)
      let quantity = pay / this.data.newRecord.price

      this.setData({
        'newRecord.pay': pay,
        'newRecord.quantity': Number(quantity.toFixed(2)),
      })
    },
    saveRecord() {
      if (this.data.newRecord.mileage <= 0) {
        wx.showToast({
          title: '里程不能为空',
          icon: 'none',
          duration: 2000
        })
        return
      }

      if (this.data.newRecord.price <= 0) {
        wx.showToast({
          title: '单价不能为空',
          icon: 'none',
          duration: 2000
        })
        return
      }

      if (this.data.newRecord.quantity <= 0) {
        wx.showToast({
          title: '加油量不能为空',
          icon: 'none',
          duration: 2000
        })
        return
      }

      if (this.data.newRecord.pay <= 0) {
        wx.showToast({
          title: '机显金不能为空',
          icon: 'none',
          duration: 2000
        })
        return
      }

      if (this.data.fuelList[this.data.fuelList.length - 1].mileage >= this.data.newRecord.mileage) {
        wx.showToast({
          title: '当前里程不能小于最后一次记录的里程数',
          icon: 'none',
          duration: 2000
        })
        return
      }


      let newRecord: RecordType = {
        date: getNowString(),
        mileage: this.data.newRecord.mileage,
        price: this.data.newRecord.price,
        quantity: this.data.newRecord.quantity,
        pay: this.data.newRecord.price,
        isAddFull: true,
        isWarningLight: true,
      }

      let newArr = [
        ...this.data.fuelList,
        newRecord,
      ]

      this.setData({
        fuelList: JSON.parse(JSON.stringify(newArr))
      })

      // ✅ Save to local storage
      wx.setStorageSync('fuelList', newArr)

      this.calFuleConsumption()

      wx.showToast({
        title: '保存成功',
        icon: 'none',
        duration: 2000
      })

      this.setData({
        newRecord: {
          date: getNowString(),
          mileage: 0,

          price: 0,
          quantity: 0,
          pay: 200,
          isAddFull: true,
          isWarningLight: true,
        }
      })
    },

    calFuleConsumption() {
      // 计算油耗
      let newArr = JSON.parse(JSON.stringify(this.data.fuelList))
      if (newArr.length >= 2) {
        for (let i = 1; i < newArr.length; i++) {

          let quantity = newArr[i].quantity
          let distance = newArr[i].mileage - newArr[i - 1].mileage

          // 计算油耗 L/100km
          const consumption = (quantity / distance) * 100
          const formatted = Number(consumption.toFixed(1))

          newArr[i].fuleConsumption = formatted
        }
      }

      // ✅ Save to local storage
      wx.setStorageSync('fuelList', newArr)

      this.setData({
        fuelList: newArr,
      })
    },

    // 事件处理函数
    bindViewTap() {
      wx.navigateTo({
        url: '../logs/logs',
      })
    },
    onChooseAvatar(e: any) {
      const { avatarUrl } = e.detail
      const { nickName } = this.data.userInfo
      this.setData({
        "userInfo.avatarUrl": avatarUrl,
        hasUserInfo: nickName && avatarUrl && avatarUrl !== defaultAvatarUrl,
      })
    },
    onInputChange(e: any) {
      const nickName = e.detail.value
      const { avatarUrl } = this.data.userInfo
      this.setData({
        "userInfo.nickName": nickName,
        hasUserInfo: nickName && avatarUrl && avatarUrl !== defaultAvatarUrl,
      })
    },
    getUserProfile() {
      // 推荐使用wx.getUserProfile获取用户信息，开发者每次通过该接口获取用户个人信息均需用户确认，开发者妥善保管用户快速填写的头像昵称，避免重复弹窗
      wx.getUserProfile({
        desc: '展示用户信息', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
        success: (res) => {
          console.log(res)
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    },
  },
})
