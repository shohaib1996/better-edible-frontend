export type RepType = "rep" | "delivery" | "both" | "designer" | "pps" | "production" | "packaging";
export type RepStatus = "active" | "inactive" | "suspended";
export type PayType = "hourly" | "salary";

export interface IRep extends Document {
  _id: string;
  name: string;
  loginName: string;
  passwordHash: string;
  email?: string;
  phone?: string;
  repType: RepType;
  territory?: string;
  assignedStores: string[];
  checkin: boolean;
  status: RepStatus;
  fobId?: string | null;    // RFID fob UID
  payType: PayType;         // "hourly" (weekly) or "salary" (semi-monthly)
  createdAt: Date;
  updatedAt: Date;
  storeCount: number;
}
