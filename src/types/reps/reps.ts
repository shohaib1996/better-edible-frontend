export type RepType = "rep" | "delivery" | "both";
export type RepStatus = "active" | "inactive" | "suspended";

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
  createdAt: Date;
  updatedAt: Date;
  storeCount: number;
}
