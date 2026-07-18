import type { NextApiRequest, NextApiResponse } from "next";
import { freshAuth } from "../../lib/tempmail";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    const auth = await freshAuth();
    return res.status(200).json({ success: true, auth: { email: auth.email, token: auth.token, expires_at: auth.expiresAt } });
  } catch (err: any) {
    const status = err.response?.status || 500;
    const data = err.response?.data || { error: err.message };
    return res.status(status).json(data);
  }
}
