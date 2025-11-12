
import { RecordType } from "../../utils/types";

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
    onMileageChange(e) {
      let record: RecordType = JSON.parse(JSON.stringify(this.data.record));
      record.mileage = Number(e.detail.value);
      
      this.triggerEvent('onRecordChange', record);
    },
    onPriceChange(e) {
      let record: RecordType = JSON.parse(JSON.stringify(this.data.record));
      record.price = e.detail.value;

      this.triggerEvent('onRecordChange', record);
    },
    onQuantityChange(e) {
      let record: RecordType = JSON.parse(JSON.stringify(this.data.record));
      record.quantity = Number(e.detail.value);

      this.triggerEvent('onRecordChange', record);
    },
    onPayChange(e) {
      let record: RecordType = JSON.parse(JSON.stringify(this.data.record));
      record.pay = Number(e.detail.value);

      this.triggerEvent('onRecordChange', record);
    },
    setAddFull(e) {
      let record: RecordType = JSON.parse(JSON.stringify(this.data.record));
      record.isAddFull = e.currentTarget.dataset.value === 'true'
      
      this.triggerEvent('onRecordChange', record);
    },
    setWarningLight(e) {
      let record: RecordType = JSON.parse(JSON.stringify(this.data.record));
      record.isWarningLight = e.currentTarget.dataset.value === 'true'

      this.triggerEvent('onRecordChange', record);
    },
  }
});