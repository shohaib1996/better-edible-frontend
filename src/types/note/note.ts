// ================================
// FRONTEND NOTE INTERFACE
// ================================

export interface INote {
  // MongoDB id (from backend)
  _id?: string;

  // Store reference (populated or string)
  entityId: string | StoreInfo;

  // Rep reference (populated or string)
  author: string | AuthorInfo;

  // Raw fields
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

  date?: string;        // YYYY-MM-DD date string from backend
  createdAt?: string;   // auto timestamps
  updatedAt?: string;
}

// ================================
// POPULATED STORE INFO
// ================================
export interface StoreInfo {
  _id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  // Add any extra fields you have in the Store schema
}

// ================================
// POPULATED AUTHOR INFO (Rep)
// ================================
export interface AuthorInfo {
  _id: string;
  name: string;
  email?: string;
  role?: string;
  // Add more fields if your rep schema has more
}
