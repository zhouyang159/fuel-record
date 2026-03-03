
export interface RecordType {
  id: string,
  date: string,
  time: string,
  mileage: string,
  price: string, // 机显单价
  realPrice: string, // 实际单价
  quantity: string, // 加油量
  pay: string, // 机显金额
  realPay: string, // 实际金额
  discountAmount: string, // 机显单价 - 实际单价 = 优惠金额
  isAddFull: boolean,
  isWarningLight: boolean,
  carName?: string,
  userNick?: string,

  fuelConsumption?: number,
}

export interface ShowCardType extends RecordType {
  cost: number,
  costLiter: number,
  diffMile: number,
}

