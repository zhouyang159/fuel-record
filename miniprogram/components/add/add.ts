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

      if (Number.parseFloat(record.price) > 0) {
        if (Number.parseFloat(record.quantity) > 0) {
          // 如果单价有 并且 加油量有，则计算实付金额
          let pay = Number(record.price) * Number(record.quantity)
          record.pay = Number(pay).toFixed(2)
        } else if (Number.parseFloat(record.pay) > 0) {
          // 如果单价有 并且 实付金额有，则计算加油量
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