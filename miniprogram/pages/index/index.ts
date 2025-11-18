const app = getApp<IAppOption>()
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

import {RecordType, ShowCardType} from '../../utils/types'

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

function getDateString(): string {
  const date = new Date()

  const year = date.getFullYear()
  // 月份从0开始，需+1
  const month = date.getMonth() + 1
  const day = date.getDate()

  return `${year}-${month}-${day}`
}

function getTimeString(): string {
  const date = new Date()

  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  const formatNum = (num: number) => num.toString().padStart(2, '0')

  // 拼接格式（注意：你要的是“11-5”而非“11-05”，所以month和day不补零）
  return `${formatNum(hour)}:${formatNum(minute)}:${formatNum(second)}`
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
      id: '-1',
      date: getDateString(),
      time: getTimeString(),
      mileage: 0,

      price: 8,
      quantity: 0,
      pay: 0,
      isAddFull: false,
      isWarningLight: false,
    } as RecordType,

    fuelList: [
      // {
      //   id: '1',
      //   date: "11-6 14:22:30",
      //   mileage: 800,
      //   price: 8,
      //   quantity: 37.5,
      //   pay: 300,
      //   isAddFull: true,
      //   isWarningLight: false,
      // },
      // {
      //   id: '2',
      //   date: "11-5 14:30:30",
      //   mileage: 500,
      //   price: 8,
      //   quantity: 12.5,
      //   pay: 100,
      //   isAddFull: false,
      //   isWarningLight: false,
      // },
      // {
      //   id: '3',
      //   date: "10-11 14:22:30",
      //   mileage: 200,
      //   price: 8,
      //   quantity: 12.5,
      //   pay: 100,
      //   isAddFull: true,
      //   isWarningLight: false,
      // },
    ] as RecordType[],
    showCardArr: [] as ShowCardType[],
  },
  observers: {},
  lifetimes: {
    created() {
      console.log('组件实例被创建');

      const fuelListStr = wx.getStorageSync('fuelList')
      if (fuelListStr) {
        this.setData({
          fuelList: JSON.parse(fuelListStr)
        })
      }
    },
    attached() {
      console.log('组件实例进入页面节点树');

      this.calCost()
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
    onRecordChange(e: { detail: RecordType }) {

      let newVal = e.detail

      if (newVal.pay !== this.data.newRecord.pay) {
        // pay changed
        let quantity = newVal.pay / this.data.newRecord.price

        newVal.quantity = Number(quantity.toFixed(2))
      }

      this.setData({
        newRecord: newVal as RecordType,
      })
    },
    saveFuelList(fuelList: RecordType[]) {
      this.setData({
        fuelList: JSON.parse(JSON.stringify(fuelList))
      })
      wx.setStorageSync('fuelList', JSON.stringify(fuelList))
    },
    saveRecord() {
      if (this.data.fuelList.length > 0) {
        if (this.data.newRecord.mileage <= this.data.fuelList[0].mileage) {
          wx.showToast({
            title: '当前里程不能小于最后一次记录的里程数',
            icon: 'none',
            duration: 2000
          })
          return
        }
      }

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

      if (this.data.fuelList.length > 0) {
        if (this.data.fuelList[this.data.fuelList.length - 1].mileage >= this.data.newRecord.mileage) {
          wx.showToast({
            title: '当前里程不能小于最后一次记录的里程数',
            icon: 'none',
            duration: 2000
          })
          return
        }
      }


      let newRecord: RecordType = {
        ...this.data.newRecord,
        id: String(new Date().getTime()),
        date: getDateString(),
        time: getTimeString(),
      }

      let newFuelList = [
        newRecord,
        ...this.data.fuelList,
      ]

      this.saveFuelList(newFuelList)

      this.setData({
        newRecord: {
          id: String(new Date().getTime()),
          date: getDateString(),
          time: getTimeString(),
          mileage: 0,

          price: 8,
          quantity: 0,
          pay: 0,
          isAddFull: false,
          isWarningLight: false,
        }
      })

      wx.showToast({
        title: '保存成功',
        icon: 'none',
        duration: 2000
      })

      this.calCost()
    },
    deleteRecord(e: any) {
      const id = e.currentTarget.dataset.id;

      let newFuelList = this.data.fuelList.filter(item => item.id !== id)

      this.saveFuelList(newFuelList)

      this.calCost()

      wx.showToast({
        title: '删除成功',
        icon: 'none',
        duration: 2000
      })
    },

    calCost() {
      const showCardArr: ShowCardType[] = JSON.parse(JSON.stringify(this.data.fuelList));

      // 1) 计算段距离 segments，segments[k] 表示 record[k] -> record[k+1] 的距离
      const n = showCardArr.length;
      const segments: number[] = new Array(Math.max(0, n - 1)).fill(0);
      for (let k = 0; k < n - 1; k++) {
        segments[k] = showCardArr[k].mileage - showCardArr[k + 1].mileage;
        showCardArr[k].diffMile = segments[k];
      }
      if (n > 0) showCardArr[n - 1].diffMile = showCardArr[n - 1].diffMile ? showCardArr[n - 1].diffMile : 0;

      // 初始化字段
      for (let i = 0; i < n; i++) {
        showCardArr[i].cost = 0;
        showCardArr[i].costLiter = 0;
        showCardArr[i].fuleConsumption = 0;
      }

      // 辅助：把 totalLiters 按区间 s..e-1 的距离分配到每个段（写回到对应的 record[k]）
      function distribute(s: number, e: number, totalLiters: number) {
        const totalDistance = segments.slice(s, e).reduce((a, b) => a + b, 0);
        if (totalDistance <= 0) return;
        const avgLPer100km = (totalLiters / totalDistance) * 100;
        for (let k = s; k < e; k++) {
          const segDist = segments[k] || 0;
          const consumeLiters = segDist * (avgLPer100km / 100);
          showCardArr[k].fuleConsumption = Number(avgLPer100km.toFixed(2));
          showCardArr[k].costLiter = -Number(consumeLiters.toFixed(2));
          const price = showCardArr[k].price ? showCardArr[k].price : 0;
          showCardArr[k].cost = segDist > 0 ? Number(((price * consumeLiters) / segDist).toFixed(2)) : 0;
        }
      }

      // 2) full -> full（优先）
      const fullIndexes: number[] = [];
      for (let i = 0; i < n; i++) if (showCardArr[i].isAddFull) fullIndexes.push(i);
      const covered = new Array(Math.max(0, n - 1)).fill(false); // 标记哪些段已由 full->full 覆盖

      for (let fi = fullIndexes.length - 1; fi >= 1; fi--) {
        const oldIdx = fullIndexes[fi];     // 旧（时间早，索引大）
        const newIdx = fullIndexes[fi - 1]; // 新（时间晚，索引小）
        if (!(oldIdx > newIdx)) continue;

        const s = newIdx;
        const e = oldIdx;
        // totalLiters 按 APP 逻辑：sum quantity for k = s .. e-1 （包含 newIdx 的 quantity，排除 oldIdx）
        const totalLiters = showCardArr.slice(s, e).reduce((sum, v) => sum + (v.quantity || 0), 0);
        distribute(s, e, totalLiters);
        for (let k = s; k < e; k++) covered[k] = true;
      }

      // 3) warning -> warning（仅当两次 warning 之间没有 full；并按你要求 totalLiters = 旧的 warning 的 quantity）
      const warnIndexes: number[] = [];
      for (let i = 0; i < n; i++) if (showCardArr[i].isWarningLight) warnIndexes.push(i);

      for (let wi = warnIndexes.length - 1; wi >= 1; wi--) {
        const oldIdx = warnIndexes[wi];     // 旧（时间早）
        const newIdx = warnIndexes[wi - 1]; // 新（时间晚）
        if (!(oldIdx > newIdx)) continue;

        // 如果区间内存在 full -> 跳过（full->full 优先）
        const hasFull = showCardArr.slice(newIdx + 1, oldIdx).some(v => v.isAddFull);
        if (hasFull) continue;

        const s = newIdx;
        const e = oldIdx;
        const totalDistance = segments.slice(s, e).reduce((a, b) => a + b, 0);
        if (totalDistance <= 0) continue;

        // **关键改动**：warning->warning 的总油量按 旧的 warning 的 quantity（oldIdx 的 quantity）
        const totalLiters = showCardArr[oldIdx].quantity || 0;

        // 分配（跳过已被 full 覆盖的段）
        const totalDistanceForCalc = totalDistance; // 用整个区间 distance 计算 avg，然后跳过 covered 段写入
        if (totalDistanceForCalc > 0 && totalLiters > 0) {
          const avgLPer100km_warn = (totalLiters / totalDistanceForCalc) * 100;
          for (let k = s; k < e; k++) {
            if (covered[k]) continue;
            const segDist = segments[k] || 0;
            const consumeLiters = segDist * (avgLPer100km_warn / 100);
            showCardArr[k].fuleConsumption = Number(avgLPer100km_warn.toFixed(2));
            showCardArr[k].costLiter = -Number(consumeLiters.toFixed(2));
            const price = showCardArr[k].price ? showCardArr[k].price : 0;
            showCardArr[k].cost = segDist > 0 ? Number(((price * consumeLiters) / segDist).toFixed(2)) : 0;
          }
        }
      }

      // 写回
      this.setData({showCardArr});
    },

    toModifyPage(e: any) {
      const index = e.currentTarget.dataset.index; // 👈 Get the index
      const record = this.data.showCardArr[index];   // 👈 Access the tapped item

      wx.navigateTo({
        url: '/pages/modify/modify',
        events: {
          updateRecord: (newRecord: RecordType) => {
            let fuelList: RecordType[] = JSON.parse(JSON.stringify(this.data.fuelList))
            fuelList = fuelList.map(item => {
              if (item.id === newRecord.id) {
                return newRecord
              }
              return item
            })

            this.saveFuelList(fuelList)

            this.calCost()
          },
        },
        success: function (res) {
          res.eventChannel.emit('acceptDataFromOpenerPage', {record: record})
        }
      })
    },

    onChooseAvatar(e: any) {
      const {avatarUrl} = e.detail
      const {nickName} = this.data.userInfo
      this.setData({
        "userInfo.avatarUrl": avatarUrl,
        hasUserInfo: nickName && avatarUrl && avatarUrl !== defaultAvatarUrl,
      })
    },
    onInputChange(e: any) {
      const nickName = e.detail.value
      const {avatarUrl} = this.data.userInfo
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
