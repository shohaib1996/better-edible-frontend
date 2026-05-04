export interface IStoreUser {
  contactId: string;
  name: string;
  email: string;
  storeId: string;
  storeName: string;
  role: "store";
}

export interface ILoginResponse {
  success: boolean;
  user: IStoreUser;
}
