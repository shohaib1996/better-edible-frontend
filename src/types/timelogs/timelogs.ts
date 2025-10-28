export interface ITimelog {
  _id: string
  rep: {
    _id: string
    name: string
    phone: string
  }
  checkinTime: string
  checkoutTime: string | null
  createdAt: string
  updatedAt: string
}
