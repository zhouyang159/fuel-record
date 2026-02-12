import { RecordType } from "../../utils/types"

Component({
  properties: {
    record: {
      type: Object,
      value: {}
    }
  },
  lifetimes: {
    attached() {
    }
  },
  methods: {
    onDateChange: function (e) {
      let record: RecordType = JSON.parse(JSON.stringify(this.data.record))
      record.date = e.detail.value

      this.triggerEvent('onRecordChange', record)
    },
    onTimeChange: function (e) {
      let record: RecordType = JSON.parse(JSON.stringify(this.data.record))
      record.time = e.detail.value

      this.triggerEvent('onRecordChange', record)
    },
    onMileageChange(e) {
      let record: RecordType = JSON.parse(JSON.stringify(this.data.record))
      record.mileage = e.detail.value

      this.triggerEvent('onRecordChange', record)
    },
    onPriceChange(e) {
      let record: RecordType = JSON.parse(JSON.stringify(this.data.record))
      record.price = e.detail.value

      if (Number.parseFloat(record.price) > 0) {
        if (Number.parseFloat(record.quantity) > 0) {
          // 如果单价有 并且 加油量有，则计算机显金额
          let pay = Number(record.price) * Number(record.quantity)
          record.pay = Number(pay).toFixed(2)
        } else if (Number.parseFloat(record.pay) > 0) {
          // 如果单价有 并且 机显金额有，则计算加油量
          let quantity = Number(record.pay) / Number(record.price)
          record.quantity = Number(quantity).toFixed(2)
        }
      }

      this.triggerEvent('onRecordChange', record)
    },
    onQuantityChange(e) {
      let record: RecordType = JSON.parse(JSON.stringify(this.data.record))
      record.quantity = e.detail.value

      if (Number.parseFloat(record.quantity) > 0) {
        if (Number.parseFloat(record.quantity) > 0) {
          let pay = Number(record.price) * Number(record.quantity)
          record.pay = Number(pay).toFixed(2)
        } else if (Number.parseFloat(record.pay) > 0) {
          // 如果加油量有， 并且实付金额有，就计算单价
          let price = Number(record.pay) / Number(record.quantity)
          record.price = Number(price).toFixed(2)
        }
      }

      this.triggerEvent('onRecordChange', record)
    },
    onPayChange(e) {
      let record: RecordType = JSON.parse(JSON.stringify(this.data.record))
      record.pay = e.detail.value

      if (Number.parseFloat(record.pay) > 0) {
        if (Number.parseFloat(record.price) > 0) {
          let quantity = Number(record.pay) / Number(record.price)
          record.quantity = Number(quantity).toFixed(2)
        } else if (Number.parseFloat(record.quantity) > 0) {
          let price = Number(record.pay) / Number(record.quantity)
          record.price = Number(price).toFixed(2)
        }
      }

      this.triggerEvent('onRecordChange', record)
    },
    onRealPriceChange(e) {
      let record: RecordType = JSON.parse(JSON.stringify(this.data.record))
      record.realPrice = e.detail.value

      this.triggerEvent('onRecordChange', record)
    },
    onDiscountAmountChange(e) {
      let record: RecordType = JSON.parse(JSON.stringify(this.data.record))
      record.discountAmount = e.detail.value

      // 根据 输入的 优惠金额 计算 实付金额
      if (Number.parseFloat(record.discountAmount) > 0 && Number.parseFloat(record.pay) > 0) {
        let realPay = Number(record.pay) - Number(record.discountAmount)
        record.realPay = Number(realPay).toFixed(2)
      }

      // 根据 输入的 优惠金额 计算 优惠单价
      if (Number.parseFloat(record.discountAmount) > 0 && Number.parseFloat(record.quantity) > 0) {
        let discountPrice = Number(record.discountAmount) / Number(record.quantity)
        let realPrice = Number(record.price) - Number(discountPrice)
        record.realPrice = Number(realPrice).toFixed(2)
      }

      this.triggerEvent('onRecordChange', record)
    },
    onRealPayChange(e: any) {
      let record: RecordType = JSON.parse(JSON.stringify(this.data.record))
      record.realPay = e.detail.value

      // 根据 输入的 实付金额 计算 优惠金额
      if (Number.parseFloat(record.realPay) > 0 && Number.parseFloat(record.pay) > 0) {
        let discountAmount = Number(record.pay) - Number(record.realPay)
        record.discountAmount = Number(discountAmount).toFixed(2)
      }
      // 根据 输入的 实付金额 计算 优惠单价
      if (Number.parseFloat(record.realPay) > 0 && Number.parseFloat(record.quantity) > 0) {
        let realPrice = Number(record.realPay) / Number(record.quantity)
        record.realPrice = Number(realPrice).toFixed(2)
      }

      this.triggerEvent('onRecordChange', record)
    },


    setAddFull(e) {
      let record: RecordType = JSON.parse(JSON.stringify(this.data.record))
      record.isAddFull = e.currentTarget.dataset.value === 'true'

      this.triggerEvent('onRecordChange', record)
    },
    setWarningLight(e) {
      let record: RecordType = JSON.parse(JSON.stringify(this.data.record))
      record.isWarningLight = e.currentTarget.dataset.value === 'true'

      this.triggerEvent('onRecordChange', record)
    },
  }
})