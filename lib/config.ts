/**
 * API base URL — tất cả client-side fetch đều gọi qua đây
 * Website:  zeroxn.qzz.io
 * API:      api.zeroxn.qzz.io
 */
export const API_BASE = "https://api.zeroxn.qzz.io";

/**
 * Tất cả process.env được đọc tập trung ở đây — không đọc process.env
 * trực tiếp ở nơi khác trong app code.
 */
export const IS_PRODUCTION = process.env.NODE_ENV === "production";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://zeroxn.qzz.io";

export const GOOGLE_SITE_VERIFICATION = process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION;
