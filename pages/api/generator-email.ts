import type { NextApiRequest, NextApiResponse } from "next";
import { ensureAuth, getActiveDomains, fetchInboxToken, randomString } from "../../lib/tempmail";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    // Step 1: get a valid session
    const auth = await ensureAuth();

    // Step 2: get an active domain
    const domains = await getActiveDomains(auth.sid, auth.token);
    const domain = domains[Math.floor(Math.random() * domains.length)];

    // Step 3: generate a random prefix and create an inbox via inbox-token
    const prefix = randomString(8 + Math.floor(Math.random() * 5));
    const email = `${prefix}@${domain}`;

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
    console.error("generate-email error:", err.message);
    const status = err.response?.status || 500;
    const data = err.response?.data || { error: err.message };
    return res.status(status).json(data);
  }
}
