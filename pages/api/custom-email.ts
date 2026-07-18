import type { NextApiRequest, NextApiResponse } from "next";
import { ensureAuth, fetchInboxToken } from "../../lib/tempmail";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const { username, domain } = req.query;
  if (!username || !domain) {
    return res.status(400).json({
      success: false,
      error: "Missing required query params: username and domain",
      example: "/api/generator-email/custom?username=bucujjj&domain=inmune.ddns.net",
    });
  }
  try {
    const email = `${username}@${domain}`;
    const auth = await ensureAuth();
    const newAuth = await fetchInboxToken(auth.sid, email);

    return res.status(200).json({
      success: true,
      data: { email: newAuth.email || email },
      auth: {
        token: newAuth.token,
        email: newAuth.email || email,
        expires_at: newAuth.expiresAt,
      },
    });
  } catch (err: any) {
    console.error("custom email error:", err.message);
    const status = err.response?.status || 500;
    const data = err.response?.data || { error: err.message };
    return res.status(status).json(data);
  }
}
