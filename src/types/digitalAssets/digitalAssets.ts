export type AssetCategory = "Banner" | "ProductImage" | "Video" | "Email" | "Flyer" | "Social" | "Text" | "Other";
export type AssetType = "file" | "text";
export type AssetStatus = "active" | "archived" | "all";
export type ProductLine = "CannaCrispy" | "FiftyOneFifty" | "Bliss" | "YummyGummy";

export interface IDigitalAsset {
  _id: string;
  title: string;
  description?: string;
  category: AssetCategory;
  productLine?: ProductLine;
  assetType: AssetType;
  fileUrl?: string;
  previewUrl?: string;
  textContent?: string;
  tags: string[];
  status: AssetStatus;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface IDigitalAssetsResponse {
  success: boolean;
  assets: IDigitalAsset[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

export interface IDigitalAssetResponse {
  success: boolean;
  asset: IDigitalAsset;
}

export interface IGetDigitalAssetsParams {
  category?: AssetCategory;
  productLine?: ProductLine;
  assetType?: AssetType;
  search?: string;
  status?: AssetStatus;
  page?: number;
  limit?: number;
}
