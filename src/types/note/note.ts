import { Document, Types } from "mongoose";

export interface INote extends Document {
  _id: string,
  entityId: Types.ObjectId;
  author: Types.ObjectId;
  date: Date;
  disposition?: string;
  visitType?: string;
  content?: string;
  sample?: boolean;
  delivery?: boolean;
  payment?: {
    cash?: boolean;
    check?: boolean;
    noPay?: boolean;
    amount?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
