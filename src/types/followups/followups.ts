export type FollowupStatus = "open" | "resolved";

export interface IFollowupHistoryEntry {
  date: string;
  comments: string;
  interestLevel?: string;
  changedAt: string;
  action: "created" | "rescheduled" | "resolved";
}

export interface IFollowUp {
  _id: string;
  followupDate: string; // YYYY-MM-DD
  interestLevel?: string;
  comments: string;
  store: {
    _id: string;
    name: string;
    address?: string;
    city?: string;
    state?: string;
  };
  rep: {
    _id: string;
    name: string;
  };
  status: FollowupStatus;
  resolvedAt?: string;
  history: IFollowupHistoryEntry[];
  setByDriver?: boolean;   // true when a driver created this on behalf of the rep
  setByName?: string;      // name of the driver who set it
  createdAt: string;
  updatedAt: string;
  __v: number;
}

// Response shape from GET /followups/rep/:repId
export interface IRepFollowupsResponse {
  overdue: IFollowUp[];
  dueToday: IFollowUp[];
  upcoming: IFollowUp[];
  total: number;
}
