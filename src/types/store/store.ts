import { IRep } from "../reps/reps";

// Contact type inside a store
export interface IContact {
  name?: string;
  role?: string;
  email?: string;
  phone?: string;
}


// Base Store type (non-populated version)
export interface IStore {
  _id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  territory?: string;
  rep?: IRep | null; // just rep _id when not populated
  contacts: IContact[];
  blocked: boolean;
  terms?: string;
  group?: string;
  notesCount: number;
  lastOrderAt?: string | Date;
  createdAt: string;
  updatedAt: string;
}
