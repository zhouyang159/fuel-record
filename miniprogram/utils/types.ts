
export interface RecordType {
  id: string,
  date: string,
  time: string,
  mileage: string,
  price: string,
  quantity: string,
  pay: string,
  isAddFull: boolean,
  isWarningLight: boolean,

  fuleConsumption?: number,
}

export interface ShowCardType extends RecordType {
  cost: number,
  costLiter: number,
  diffMile: number,
}

