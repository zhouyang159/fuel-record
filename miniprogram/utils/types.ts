
export interface RecordType {
  id: string,
  date: string,
  time: string,
  mileage: number,
  price: number,
  quantity: number,
  pay: number,
  isAddFull: boolean,
  isWarningLight: boolean,

  fuleConsumption?: number,
}

export interface ShowCardType extends RecordType {
  cost: number,
  costLiter: number,
  diffMile: number,
}

