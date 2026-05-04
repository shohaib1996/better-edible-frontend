export type AssetCategory = "social-media" | "print" | "email" | "video" | "logo" | "other";
export type AssetType = "file" | "text";
export type AssetStatus = "active" | "archived";
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
}

export interface IDigitalAssetResponse {
  success: boolean;
  asset: IDigitalAsset;
}

export interface IGetDigitalAssetsParams {
  category?: AssetCategory;
  productLine?: ProductLine;
  search?: string;
  status?: AssetStatus;
}
