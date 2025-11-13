

export interface INote extends Document {
  _id: string,
  entityId: string;
  author: string;
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
