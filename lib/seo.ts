import { SITE_URL } from "./config";

export { SITE_URL };

export const SEO = {
  siteName: "TempMail",
  defaultTitle: "TempMail – Free Disposable Email Address",
  defaultDescription:
    "Generate a free temporary email instantly. No registration required. Real-time inbox with SSE streaming. 1,200+ available domains.",
  twitterHandle: "",
};

export function pageUrl(path: string): string {
  return `${SITE_URL}${path}`;
}
