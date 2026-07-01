export interface IStoreUser {
  contactId: string;
  name: string;
  email: string;
  storeId: string;
  storeName: string;
  role: "store";
  repName?: string;
  repEmail?: string;
  repInitials?: string;
}

export interface ILoginResponse {
  success: boolean;
  user: IStoreUser;
}
