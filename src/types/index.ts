export * from "./reps/reps"
export * from "./timelogs/timelogs"
export * from "./store/store"
export * from "./order/order"
export * from "./delivery/delivery"
export interface IContact {
  _id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  importantToKnow: string;
  store: string;
}