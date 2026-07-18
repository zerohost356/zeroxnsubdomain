import axios from "axios";

const BASE = "https://mail.chatgpt.org.uk";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

interface Session {
  sid: string;
  token: string;
  email: string;
  expiresAt: number;
}

let session: Session = {
  sid: "",
  token: "",
  email: "",
  expiresAt: 0,
};

let authPromise: Promise<Session> | null = null;

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

const axiosHeaders = (sid: string, token?: string) => ({
  "User-Agent": UA,
  "Referer": BASE + "/",
  "Origin": BASE,
  ...(token ? { "X-Inbox-Token": token } : {}),
  "Cookie": `gm_sid=${sid}`,
});

function extractSidFromHeaders(headers: any): string {
  const setCookie = headers?.["set-cookie"] || [];
  for (const c of setCookie) {
    const m = c.match(/gm_sid=([^;]+)/);
    if (m) return m[1];
  }
  return "";
}

async function getSession(): Promise<string> {
  // The homepage is served from Cloudflare's CDN cache and no longer carries
  // a fresh Set-Cookie header. The /api/inbox-token endpoint issues the
  // session cookie directly, so use it to bootstrap a session instead.
  const res = await axios.post(BASE + "/api/inbox-token", {}, {
    headers: {
      "User-Agent": UA,
      "Content-Type": "application/json",
      "Referer": BASE + "/",
      "Origin": BASE,
    },
    timeout: 15000,
    transformResponse: [safeJsonTransform],
    validateStatus: () => true,
  });
  const sid = extractSidFromHeaders(res.headers);
  if (!sid) throw new Error("Could not get session cookie from upstream site");
  return sid;
}

async function getToken(sid: string, email?: string): Promise<{ token: string; email: string; expiresAt: number }> {
  const res = await axios.post(
    BASE + "/api/inbox-token",
    email ? { email } : {},
    {
      headers: {
        "User-Agent": UA,
        "Content-Type": "application/json",
        "Referer": BASE + "/",
        "Origin": BASE,
        "Cookie": `gm_sid=${sid}`,
      },
      timeout: 15000,
      transformResponse: [safeJsonTransform],
      validateStatus: () => true,
    }
  );
  const data = res.data;
  if (!data?.success || !data?.auth) {
    throw new Error("Failed to get inbox token: " + JSON.stringify(data));
  }
  return {
    token: data.auth.token as string,
    email: (data.auth.email || email || "") as string,
    expiresAt: (data.auth.expires_at || 0) as number,
  };
}

async function doAuth(email?: string): Promise<Session> {
  const sid = await getSession();
  const auth = await getToken(sid, email);
  return { sid, ...auth };
}

export async function freshAuth(): Promise<Session> {
  const sid = await getSession();
  const { token: initToken, expiresAt } = await getToken(sid);
  const res = await axios.get(BASE + "/api/generate-email", {
    headers: axiosHeaders(sid, initToken),
    timeout: 15000,
    transformResponse: [safeJsonTransform],
    validateStatus: () => true,
  });
  const email = res.data?.auth?.email || res.data?.data?.email || "";
  const token = res.data?.auth?.token || initToken;
  const newExpiresAt = res.data?.auth?.expires_at || expiresAt;
  const result: Session = { sid, token, email, expiresAt: newExpiresAt };
  session = result;
  authPromise = null;
  return result;
}

export async function ensureAuth(email?: string): Promise<Session> {
  if (email && session.email !== email) {
    const result = await doAuth(email);
    return result;
  }
  if (isTokenValid()) return session;

  if (!authPromise) {
    authPromise = doAuth(session.email || undefined).then((s) => {
      session = s;
      authPromise = null;
      return s;
    }).catch((err) => {
      authPromise = null;
      throw err;
    });
  }
  return authPromise;
}

export function extractToken(responseData: any) {
  if (responseData && responseData.auth && responseData.auth.token) {
    session.token = responseData.auth.token;
    session.email = responseData.auth.email || session.email;
    session.expiresAt = responseData.auth.expires_at || session.expiresAt;
  }
}

function invalidateSession() {
  session = { sid: "", token: "", email: session.email, expiresAt: 0 };
  authPromise = null;
}

export async function callUpstream(url: string, params: any, sid: string, token: string, _retried = false): Promise<any> {
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

export async function callUpstreamPost(url: string, body: any, sid: string, token: string, _retried = false): Promise<any> {
  const res = await axios.post(url, body, {
    headers: {
      ...axiosHeaders(sid, token),
      "Content-Type": "application/json",
    },
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
    if (parsed.name && !email.from_name) {
      email.from_name = parsed.name;
    }
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
