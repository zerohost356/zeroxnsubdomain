import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware — 2 chiều routing theo Host header
 *
 * zeroxn.qzz.io       → chỉ phục vụ website, /api/* → 404
 * api.zeroxn.qzz.io   → chỉ phục vụ /api/*, mọi trang website → 404 JSON
 * localhost / 127.0.0.1    → dev mode, pass through tất cả
 */

const API_HOST = "api.zeroxn.qzz.io";

// Local dev — không chặn gì cả
const DEV_HOSTS = new Set(["localhost", "127.0.0.1"]);

// Các path Next.js nội bộ không được chặn
const NEXT_INTERNAL_PREFIXES = [
  "/_next/",
  "/favicon",
  "/robots",
  "/sitemap",
  "/sw.js",
  "/site.webmanifest",
  "/og-image",
  "/offline",
];

function isNextInternal(path: string) {
  return NEXT_INTERNAL_PREFIXES.some((p) => path.startsWith(p));
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Không can thiệp vào file nội bộ Next.js
  if (isNextInternal(pathname)) return NextResponse.next();

  const rawHost = req.headers.get("host") ?? "";
  const hostname = rawHost.split(":")[0].toLowerCase();

  // ── Local dev: pass through tất cả ─────────────────────────
  if (DEV_HOSTS.has(hostname)) return NextResponse.next();

  const isApiSubdomain = hostname === API_HOST;
  const isApiPath = pathname.startsWith("/api/");

  // ── api.zeroxn.qzz.io: CHỈ cho /api/* đi qua ──────────
  if (isApiSubdomain && !isApiPath) {
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: "This subdomain only serves API endpoints.",
        hint: `Try: GET https://${API_HOST}/api/stock`,
      }),
      {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  // ── zeroxn.qzz.io: CHẶN /api/* → 404 page ─────────────
  if (!isApiSubdomain && isApiPath) {
    const url = req.nextUrl.clone();
    url.pathname = "/404";
    return NextResponse.rewrite(url, { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
