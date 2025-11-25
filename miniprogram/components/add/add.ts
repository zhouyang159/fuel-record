import {RecordType} from "../../utils/types"

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
      
      if (isNaN(e.detail.value) === false) {
        if (isNaN(record.quantity) === false) {
          // 价格和数量都是合法数字

          let pay = Number(record.price) * Number(record.quantity)
          record.pay = pay.toFixed(2)
        }
      }

      this.triggerEvent('onRecordChange', record)
    },
    onQuantityChange(e) {
      let record: RecordType = JSON.parse(JSON.stringify(this.data.record))
      record.quantity = e.detail.value

      if (isNaN(e.detail.value) === false) {
        if (isNaN(record.price) === false) {
          // 价格和数量都是合法数字

          let pay = Number(record.price) * Number(record.quantity)
          record.pay = pay.toFixed(2)
        }
      }

      this.triggerEvent('onRecordChange', record)
    },
    onPayChange(e) {
      let record: RecordType = JSON.parse(JSON.stringify(this.data.record))
      record.pay = e.detail.value

      if (isNaN(e.detail.value) === false) {
        if (isNaN(record.price) === false) {
          // 价格和实付金额都是合法数字
          let quantity = Number(record.pay) / Number(record.price)
          record.quantity = Number(quantity.toFixed(2))
        }
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