import { RecordType, ShowCardType } from '../../utils/types'
import { validateRecordNumber } from "../../utils/util"
import Dialog from '../../miniprogram_npm/@vant/weapp/dialog/dialog'



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

  const formatNum = (num: number) => num.toString().padStart(2, '0')

  // 拼接格式（注意：你要的是“11-5”而非“11-05”，所以month和day不补零）
  return `${formatNum(hour)}:${formatNum(minute)}`
}


const FUEL_LIST = 'fuel_list'

Component({
  data: {
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


    nbFrontColor: '#000000',
    nbBackgroundColor: '#ffffff',

    swipeCellId: -1 as number,
  },
  observers: {},
  lifetimes: {

    created: function () {
      console.log('组件实例被创建');

      const app = getApp()

      if (app.globalData.openid) {
        // openid已经有了
        this.fetchFuelListByOpenid()
      } else {
        // openid 还没有返回，设置回调
        app.globalData.openidReadyCallback = () => {
          this
            .fetchFuelListByOpenid()
            .then(list => {
              this.setData({
                fuelList: JSON.parse(JSON.stringify(list)) as RecordType[],
              })

              this.calCost()
            })
        }
      }

      let initPrice = wx.getStorageSync('price')
      if (initPrice) {
        this.setData({
          'newRecord.price': Number(initPrice)
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

      this.setData({
        newRecord: newVal as RecordType,
      })
    },
    async removeAllRecordsByUserId(userId: string) {
      const db = wx.cloud.database()

      return await db.collection(FUEL_LIST)
        .where({
          userId: userId,
        })
        .remove();
    },
    async fetchFuelListByOpenid() {
      const db = wx.cloud.database()

      const openid = getApp().globalData.openid as string

      wx.showLoading({
        title: '加载中...',
      })
      let res = await db.collection(FUEL_LIST)
        .where({
          _openid: openid,
        })
        .get()

      wx.hideLoading()

      res.data.sort((a, b) => {
        return b.mileage - a.mileage
      })

      return res.data
    },
    addRecord() {
      if (validateRecordNumber(this.data.fuelList, this.data.newRecord) === false) {
        return
      }

      if (this.data.fuelList.length > 0) {
        if (Number(this.data.newRecord.mileage) <= Number(this.data.fuelList[0].mileage)) {
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

      // check the newRecord.price if more than 2 decimal places, round to 2 decimal places
      newRecord.price = String(Number(newRecord.price).toFixed(2))
      newRecord.quantity = String(Number(newRecord.quantity).toFixed(2))
      newRecord.pay = String(Number(newRecord.pay).toFixed(2))


      const db = wx.cloud.database()

      db.collection(FUEL_LIST)
        .add({
          data: newRecord,
        })
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
            }
          })

          wx.setStorageSync('price', String(newRecord.price))

          wx
            .showToast({
              title: '保存成功',
              icon: 'none',
              duration: 2000
            })
            .then(() => {
              setTimeout(() => {
                this.fetchFuelListByOpenid()
                  .then(list => {
                    this.setData({
                      fuelList: JSON.parse(JSON.stringify(list)) as RecordType[],
                    })

                    this.calCost()
                  })
              }, 500);

            })
        })
    },

    onSwipeCellOpen(event) {
      const id = event.currentTarget.dataset.id;

      this.setData({ swipeCellId: id });
    },
    onSwipeCellClose(event) {

      const clickId = event.currentTarget.dataset.id;


      const { position, instance } = event.detail;
      switch (position) {
        case 'cell':
          instance.close();

          break;
        case 'right':
          instance.close();

          Dialog.confirm({
            message: '确定删除吗？',
          }).then(() => {
            instance.close();

            let deleteItem = this.data.fuelList.find(item => item.id === clickId)
            if (!deleteItem) {
              return
            }

            wx.cloud.database()
              .collection(FUEL_LIST)
              .where({
                _id: deleteItem._id,
              })
              .remove()
              .then(() => {
                wx.showToast({
                  title: '删除成功',
                  icon: 'none',
                  duration: 2000
                })

                this.fetchFuelListByOpenid()
                  .then(list => {
                    this.setData({
                      fuelList: JSON.parse(JSON.stringify(list)) as RecordType[],
                    })

                    this.calCost()
                  })
              })

          });
          break;
      }

      this.setData({ swipeCellId: -1 });
    },
    closeAllSwipeCells() {
      // 遍历所有 SwipeCell 并关闭
      const len = this.data.showCardArr.length;
      for (let i = 0; i < len; i++) {
        const instance = this.selectComponent(`#swipe-${i}`);
        if (instance) {
          instance.close();
        }
      }

      this.setData({ swipeCellId: -1 });
    },

    calCost() {
      const showCardArr: ShowCardType[] = JSON.parse(JSON.stringify(this.data.fuelList));

      // 1) 计算段距离 segments
      const n = showCardArr.length;
      const segments: number[] = new Array(Math.max(0, n - 1)).fill(0);

      for (let k = 0; k < n - 1; k++) {
        const m1 = Number(showCardArr[k].mileage) || 0;
        const m2 = Number(showCardArr[k + 1].mileage) || 0;
        segments[k] = m1 - m2;
        showCardArr[k].diffMile = segments[k];
      }
      if (n > 0) showCardArr[n - 1].diffMile = showCardArr[n - 1].diffMile || 0;

      // 初始化字段
      for (let i = 0; i < n; i++) {
        showCardArr[i].cost = 0;
        showCardArr[i].costLiter = 0;
        showCardArr[i].fuelConsumption = 0;
      }

      // 辅助函数 distribute
      const distribute = (s: number, e: number, totalLiters: number) => {
        const totalDistance = segments.slice(s, e).reduce((a, b) => a + b, 0);
        if (totalDistance <= 0) return;

        const avgLPer100km = (totalLiters / totalDistance) * 100;

        for (let k = s; k < e; k++) {
          const segDist = segments[k] || 0;
          const consumeLiters = segDist * (avgLPer100km / 100);

          showCardArr[k].fuelConsumption = Number(avgLPer100km.toFixed(2));
          showCardArr[k].costLiter = -Number(consumeLiters.toFixed(2));

          const price = Number(showCardArr[k].price) || 0;
          showCardArr[k].cost =
            segDist > 0 ? Number(((price * consumeLiters) / segDist).toFixed(2)) : 0;
        }
      };

      // 2) full -> full
      const fullIndexes: number[] = [];
      for (let i = 0; i < n; i++) if (showCardArr[i].isAddFull) fullIndexes.push(i);

      const covered = new Array(Math.max(0, n - 1)).fill(false);

      for (let fi = fullIndexes.length - 1; fi >= 1; fi--) {
        const oldIdx = fullIndexes[fi];
        const newIdx = fullIndexes[fi - 1];
        if (!(oldIdx > newIdx)) continue;

        const s = newIdx;
        const e = oldIdx;

        const totalLiters = showCardArr
          .slice(s, e)
          .reduce((sum, v) => sum + (Number(v.quantity) || 0), 0);

        distribute(s, e, totalLiters);

        for (let k = s; k < e; k++) covered[k] = true;
      }

      // 3) warning -> warning（仅当没有 full）
      const warnIndexes: number[] = [];
      for (let i = 0; i < n; i++) if (showCardArr[i].isWarningLight) warnIndexes.push(i);

      for (let wi = warnIndexes.length - 1; wi >= 1; wi--) {
        const oldIdx = warnIndexes[wi];
        const newIdx = warnIndexes[wi - 1];
        if (!(oldIdx > newIdx)) continue;

        const hasFull = showCardArr.slice(newIdx + 1, oldIdx).some(v => v.isAddFull);
        if (hasFull) continue;

        const s = newIdx;
        const e = oldIdx;
        const totalDistance = segments.slice(s, e).reduce((a, b) => a + b, 0);
        if (totalDistance <= 0) continue;

        const totalLiters = Number(showCardArr[oldIdx].quantity) || 0;

        if (totalLiters > 0) {
          const avg = (totalLiters / totalDistance) * 100;

          for (let k = s; k < e; k++) {
            if (covered[k]) continue;

            const segDist = segments[k] || 0;
            const consumeLiters = segDist * (avg / 100);

            showCardArr[k].fuelConsumption = Number(avg.toFixed(2));
            showCardArr[k].costLiter = -Number(consumeLiters.toFixed(2));

            const price = Number(showCardArr[k].price) || 0;
            showCardArr[k].cost =
              segDist > 0 ? Number(((price * consumeLiters) / segDist).toFixed(2)) : 0;
          }
        }
      }

      // 写回
      this.setData({ showCardArr });
    },

    toModifyPage(e: any) {
      const navigate = () => {
        const index = e.currentTarget.dataset.index; // 👈 Get the index
        const record = this.data.showCardArr[index];   // 👈 Access the tapped item

        wx.navigateTo({
          url: '/pages/modify/modify',
          events: {
            updateRecord: (newRecord: RecordType) => {
              wx.showLoading({
                title: '保存中...',
              })

              let _id = newRecord._id;

              delete newRecord._id;
              delete newRecord._openid;


              wx.cloud
                .database()
                .collection(FUEL_LIST)
                .where({
                  _id: _id,
                })
                .update({
                  data: newRecord,
                })
                .then(() => {
                  wx.showToast({
                    title: '修改成功',
                    icon: 'none',
                    duration: 2000
                  })

                  this.fetchFuelListByOpenid()
                    .then(list => {
                      this.setData({
                        fuelList: JSON.parse(JSON.stringify(list)) as RecordType[],
                      })

                      this.calCost()
                    })
                })
                .catch((err) => {
                  wx.showToast({
                    title: '修改失败',
                    icon: 'none',
                    duration: 2000
                  })
                })
                .finally(() => {
                  wx.hideLoading()
                })
            },
          },
          success: (res) => {
            res.eventChannel.emit('acceptDataFromOpenerPage', {
              fuelList: this.data.fuelList,
              record: record
            })
          }
        })
      }
      if (this.data.swipeCellId === -1) {
        // 没有打开的 SwipeCell，可以正常跳转
        console.log('没有打开的 SwipeCell，可以正常跳转');

        navigate()
      } else {
        // 有打开的 SwipeCell，先关闭它
        console.log('有打开的 SwipeCell.  不跳转');

        if (this.data.swipeCellId === e.currentTarget.dataset.id) {
          // 点击了同一个打开的 SwipeCell，关闭它但不跳转

          console.log('点击了同一个打开的 SwipeCell，关闭它但不跳转');
        } else {
          // 点击了不同的 SwipeCell，先关闭所有 SwipeCell
          console.log('点击了不同的 SwipeCell，先关闭所有 SwipeCell, 然后再跳转');
          this.closeAllSwipeCells()
          // 等待动画完成后再跳转
          setTimeout(() => {
            navigate()
          }, 10);
        }
      }
    },
  },
})
