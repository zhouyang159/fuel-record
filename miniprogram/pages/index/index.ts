
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

interface ShowCardType extends RecordType {
  cost: number,
  costLiter: number,
  diffMile: number,
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
  // return `${year}-${month}-${day} ${formatNum(hour)}:${formatNum(minute)}:${formatNum(second)}`
  return `${month}-${day} ${formatNum(hour)}:${formatNum(minute)}:${formatNum(second)}`
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
      mileage: 0,

      price: 8,
      quantity: 0,
      pay: 0,
      isAddFull: false,
      isWarningLight: false,
    } as RecordType,

    fuelList: [
      {
        date: "11-6 14:22:30",
        mileage: 800,
        price: 8,
        quantity: 37.5,
        pay: 300,
        isAddFull: true,
        isWarningLight: false,
      },
      {
        date: "11-5 14:30:30",
        mileage: 500,
        price: 8,
        quantity: 12.5,
        pay: 100,
        isAddFull: false,
        isWarningLight: false,
      },
      {
        date: "10-11 14:22:30",
        mileage: 200,
        price: 8,
        quantity: 12.5,
        pay: 100,
        isAddFull: true,
        isWarningLight: false,
      },
    ] as RecordType[],
    showCardArr: [] as ShowCardType[],
  },
  observers: {
    'fuelList': function (newVal: RecordType[]) {

    }
  },
  lifetimes: {
    created() {
      console.log('组件实例被创建');
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
    setAddFull(e: any) {
      const value = e.currentTarget.dataset.value === 'true'
      this.setData({
        'newRecord.isAddFull': value
      })
    },
    setWarningLight(e: any) {
      const value = e.currentTarget.dataset.value === 'true'
      this.setData({
        'newRecord.isWarningLight': value
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
        ...this.data.newRecord,
        date: getNowString(),
      }

      let newArr = [
        newRecord,
        ...this.data.fuelList,
      ]

      this.setData({
        fuelList: JSON.parse(JSON.stringify(newArr))
      })

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

    calCost() {
      // 深拷贝一份用于计算并回写 showCardArr
      const showCardArr: ShowCardType[] = JSON.parse(JSON.stringify(this.data.fuelList));

      // 先算 diffMile（当前 - 下一个）
      for (let i = 0; i < showCardArr.length - 1; i++) {
        const cur = showCardArr[i];
        const next = showCardArr[i + 1];
        cur.diffMile = cur.mileage - next.mileage;
      }
      // 最后一条初始化
      const last = showCardArr[showCardArr.length - 1];
      last.diffMile = last.diffMile ?? 0;
      last.cost = 0;
      last.costLiter = 0;
      last.fuleConsumption = 0;

      // 收集所有 isAddFull 为 true 的索引（数组是最新在前）
      const fullIndexes: number[] = [];
      for (let i = 0; i < showCardArr.length; i++) {
        if (showCardArr[i].isAddFull) fullIndexes.push(i);
      }

      // 按“从旧到新”配对 full -> full：
      // fullIndexes 中索引数字越大时间越老；所以从数组尾部往前遍历相邻配对
      for (let f = fullIndexes.length - 1; f >= 1; f--) {
        const oldIdx = fullIndexes[f];     // 旧（里程小，时间早）
        const newIdx = fullIndexes[f - 1]; // 新（里程大，时间晚）

        // 防护：索引顺序必须是 oldIdx > newIdx
        if (!(oldIdx > newIdx)) continue;

        const totalDistance = showCardArr[newIdx].mileage - showCardArr[oldIdx].mileage;
        if (totalDistance <= 0) continue;

        // 计算区间总油量：sum quantity for k = newIdx ... (oldIdx - 1)
        let totalLiters = 0;
        for (let k = newIdx; k < oldIdx; k++) {
          totalLiters += (showCardArr[k].quantity || 0);
        }

        // 平均油耗（升/100km）
        const avgLPer100km = (totalLiters / totalDistance) * 100;

        // 把这个区间按每条记录的 diffMile 分配消耗（并写回到对应的记录）
        for (let k = newIdx; k < oldIdx; k++) {
          const seg = showCardArr[k];
          const segDist = seg.diffMile || 0;
          const consumeLiters = segDist * (avgLPer100km / 100); // 该段消耗
          seg.fuleConsumption = Number(avgLPer100km.toFixed(2)); // 显示每百公里油耗
          seg.costLiter = -Number(consumeLiters.toFixed(2));     // 负值表示消耗（与 APP 风格一致）
          seg.cost = segDist > 0 ? Number(((seg.price * consumeLiters) / segDist).toFixed(2)) : 0; // 每公里费用
        }
      }

      // 未被任何 full->full 区间覆盖的条目，保证字段存在（可按需改为估算）
      for (let i = 0; i < showCardArr.length; i++) {
        if (typeof showCardArr[i].cost === 'undefined') showCardArr[i].cost = 0;
        if (typeof showCardArr[i].costLiter === 'undefined') showCardArr[i].costLiter = 0;
        if (typeof showCardArr[i].fuleConsumption === 'undefined') showCardArr[i].fuleConsumption = 0;
      }

      // 写回
      this.setData({
        showCardArr
      });
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
