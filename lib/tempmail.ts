import axios from "axios";

const BASE = "https://mail.chatgpt.org.uk";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// Full browser-like headers to bypass Cloudflare bot detection
const browserBase = {
  "User-Agent": UA,
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "sec-ch-ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin",
  "Referer": BASE + "/",
  "Origin": BASE,
};

interface Session {
  sid: string;
  token: string;
  email: string;
  expiresAt: number;
}

let session: Session = { sid: "", token: "", email: "", expiresAt: 0 };

let domainsCache: { list: string[]; fetchedAt: number } = { list: [], fetchedAt: 0 };

function nowUnix() {
  return Math.floor(Date.now() / 1000);
}

function isTokenValid() {
  return session.sid && session.token && session.expiresAt - nowUnix() > 60;
}

function safeJsonTransform(data: any) {
  if (typeof data !== "string" || data.trim() === "") return {};
  try { return JSON.parse(data); } catch { return {}; }
}

export function randomString(length: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

/**
 * Call POST /api/inbox-token (optionally with an existingSid cookie and/or email).
 * Returns { sid, token, email, expiresAt }.
 * gm_sid is extracted from Set-Cookie on first call; reused afterwards.
 */
export async function fetchInboxToken(
  existingSid?: string,
  email?: string
): Promise<Session> {
  const headers: Record<string, string> = {
    ...browserBase,
    "Content-Type": "application/json",
  };
  if (existingSid) {
    headers["Cookie"] = `gm_sid=${existingSid}`;
  }

  const body = email ? { email } : {};
  const res = await axios.post(BASE + "/api/inbox-token", body, {
    headers,
    timeout: 15000,
    transformResponse: [safeJsonTransform],
    validateStatus: () => true,
  });

  const data = res.data;
  if (!data?.success || !data?.auth) {
    throw new Error("Failed to get inbox token: " + JSON.stringify(data));
  }

  // Extract gm_sid from Set-Cookie if present (first call / new session)
  let sid = existingSid || "";
  const setCookie: string[] = res.headers["set-cookie"] || [];
  for (const c of setCookie) {
    const m = c.match(/gm_sid=([^;]+)/);
    if (m) { sid = m[1]; break; }
  }

  if (!sid) {
    throw new Error("Could not obtain gm_sid session cookie from upstream");
  }

  return {
    sid,
    token: data.auth.token as string,
    email: (data.auth.email || data.data?.email || email || "") as string,
    expiresAt: (data.auth.expires_at || 0) as number,
  };
}

export async function ensureAuth(email?: string): Promise<Session> {
  // If a specific email is requested and differs from current session, get a fresh token for it
  if (email && session.email !== email) {
    const sid = session.sid || undefined;
    const auth = await fetchInboxToken(sid, email);
    if (!session.sid) session.sid = auth.sid;
    return auth;
  }

  // Refresh session if expired or missing
  if (!isTokenValid()) {
    const auth = await fetchInboxToken(undefined, session.email || undefined);
    session = { ...auth };
  }

  return session;
}

export function extractToken(responseData: any) {
  if (responseData?.auth?.token) {
    session.token = responseData.auth.token;
    session.email = responseData.auth.email || session.email;
    session.expiresAt = responseData.auth.expires_at || session.expiresAt;
  }
}

function invalidateSession() {
  session = { sid: "", token: "", email: session.email, expiresAt: 0 };
}

const axiosHeaders = (sid: string, token?: string) => ({
  ...browserBase,
  ...(token ? { "X-Inbox-Token": token } : {}),
  "Cookie": `gm_sid=${sid}`,
});

export async function callUpstream(
  url: string,
  params: any,
  sid: string,
  token: string,
  _retried = false
): Promise<any> {
  const res = await axios.get(url, {
    headers: axiosHeaders(sid, token),
    params,
    timeout: 15000,
    transformResponse: [safeJsonTransform],
    validateStatus: () => true,
  });
  if (res.status === 401 && !_retried) {
    invalidateSession();
    const fresh = await ensureAuth(session.email || undefined);
    return callUpstream(url, params, fresh.sid, fresh.token, true);
  }
  if (res.status >= 400) {
    const err: any = new Error(`Upstream error ${res.status}`);
    err.response = res;
    throw err;
  }
  return res;
}

export async function callUpstreamPost(
  url: string,
  body: any,
  sid: string,
  token: string,
  _retried = false
): Promise<any> {
  const res = await axios.post(url, body, {
    headers: { ...axiosHeaders(sid, token), "Content-Type": "application/json" },
    timeout: 15000,
    transformResponse: [safeJsonTransform],
    validateStatus: () => true,
  });
  if (res.status === 401 && !_retried) {
    invalidateSession();
    const fresh = await ensureAuth(session.email || undefined);
    return callUpstreamPost(url, body, fresh.sid, fresh.token, true);
  }
  if (res.status >= 400) {
    const err: any = new Error(`Upstream error ${res.status}`);
    err.response = res;
    throw err;
  }
  return res;
}

/**
 * Fetch active domains from upstream, cached for 5 minutes.
 */
export async function getActiveDomains(sid: string, token: string): Promise<string[]> {
  const CACHE_TTL = 300;
  if (domainsCache.list.length > 0 && nowUnix() - domainsCache.fetchedAt < CACHE_TTL) {
    return domainsCache.list;
  }

  const res = await callUpstream(BASE + "/api/domains/status", undefined, sid, token);
  extractToken(res.data);

  const domains = (res.data?.data?.domains || [])
    .filter((d: any) => d.is_active === 1 && d.mx_valid === 1)
    .map((d: any) => d.domain_name as string);

  if (domains.length === 0) throw new Error("No active domains available from upstream");

  domainsCache = { list: domains, fetchedAt: nowUnix() };
  return domains;
}

/**
 * Generate a fresh random email address and return a fully authenticated session.
 * Mirrors the /api/generator-email route logic from the reference implementation.
 */
export async function freshAuth(): Promise<Session> {
  // Step 1: get a valid session
  const auth = await ensureAuth();

  // Step 2: pick a random active domain
  const domains = await getActiveDomains(auth.sid, auth.token);
  const domain = domains[Math.floor(Math.random() * domains.length)];

  // Step 3: generate a random prefix and create an inbox via inbox-token
  const prefix = randomString(8 + Math.floor(Math.random() * 5));
  const email = `${prefix}@${domain}`;

  const newAuth = await fetchInboxToken(auth.sid, email);

  // Persist updated session token
  session.token = newAuth.token;
  session.expiresAt = newAuth.expiresAt;

  return {
    sid: auth.sid,
    token: newAuth.token,
    email: newAuth.email || email,
    expiresAt: newAuth.expiresAt,
  };
}

export function htmlToText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function parseFromAddress(raw: string): { name: string; email: string } {
  if (!raw) return { name: "", email: "" };
  const match = raw.match(/^"?(.+?)"?\s*<(.+?)>$/);
  if (match) return { name: match[1].trim(), email: match[2].trim() };
  return { name: "", email: raw.trim() };
}

export function fixEmailContent(email: any) {
  if (email.from_address && !email.from) {
    const parsed = parseFromAddress(email.from_address);
    email.from = parsed.email || email.from_address;
    if (parsed.name && !email.from_name) email.from_name = parsed.name;
  }
  if (!email.content && email.html_content) {
    email.content = htmlToText(email.html_content);
  }
  if (email.content) {
    email.content = email.content
      .replace(/\r\n/g, " ")
      .replace(/\r/g, " ")
      .replace(/\n/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
  }
  return email;
}

export { BASE };
