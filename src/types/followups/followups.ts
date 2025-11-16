export interface IFollowUp {
  _id: string;
  followupDate: string; // ISO date string
  interestLevel: string;
  comments: string;
  store: {
    _id: string;
    name: string;
    address: string;
  };
  rep: {
    _id: string;
    name: string;
  };
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  __v: number;
}
