export type DesignRequestStatus =
  | "pending"
  | "in-progress"
  | "revision-requested"
  | "completed";

export type DesignRequestType = "free" | "paid" | "inhouse";
export type DesignRequestSource = "store" | "rep" | "admin";
export type CommentAuthorRole = "store" | "designer" | "admin" | "rep";

export interface IComment {
  _id: string;
  authorId: string;
  authorName: string;
  authorRole: CommentAuthorRole;
  message: string;
  createdAt: string;
}

export interface IUploadedFile {
  _id: string;
  url: string;
  fileName: string;
  uploadedAt: string;
}

export interface ICompletedFile {
  _id: string;
  url: string;
  fileName: string;
  uploadedAt: string;
  sent: boolean;
  sentAt?: string;
  version: number;
}

export interface IDesignRequest {
  _id: string;
  requestId?: string;
  requestType: DesignRequestType;
  source: DesignRequestSource;
  storeId?: string;
  storeName?: string;
  contactId?: string;
  submittedBy: string;
  submittedByName: string;
  productLine?: string;
  format?: string;
  description: string;
  status: DesignRequestStatus;
  uploadedFiles: IUploadedFile[];
  completedFiles: ICompletedFile[];
  comments: IComment[];
  revisionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface IDesignRequestsResponse {
  success: boolean;
  requests: IDesignRequest[];
  total: number;
  page: number;
  pages: number;
}

export interface IDesignRequestResponse {
  success: boolean;
  request: IDesignRequest;
}

export interface IGetDesignRequestsParams {
  queue?: DesignRequestType;
  status?: DesignRequestStatus;
  excludeStatus?: DesignRequestStatus;
  storeId?: string;
  page?: number;
  limit?: number;
}

export interface ISubmitDesignRequestBody {
  requestType: DesignRequestType;
  source: DesignRequestSource;
  storeId?: string;
  storeName?: string;
  contactId?: string;
  submittedBy: string;
  submittedByName: string;
  productLine?: string;
  format: string;
  description: string;
}

export interface IPostCommentBody {
  authorId: string;
  authorName: string;
  authorRole: CommentAuthorRole;
  message: string;
}

export interface IRequestRevisionBody {
  authorId: string;
  authorName: string;
  message: string;
}
