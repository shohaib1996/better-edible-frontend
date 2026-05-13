function insertFlag(url: string, flag: string): string {
  return url.replace("/upload/", `/upload/${flag}/`);
}

/**
 * Returns the URL as-is for inline viewing in the browser.
 * Cloudinary /image/upload/ PDFs open natively in the browser tab.
 */
export function cloudinaryViewUrl(url: string): string {
  return url;
}

/**
 * Forces a file download via Cloudinary's fl_attachment flag,
 * which sets Content-Disposition: attachment on the response.
 */
export function cloudinaryDownloadUrl(url: string): string {
  if (!url.includes("res.cloudinary.com")) return url;
  return insertFlag(url, "fl_attachment");
}
