import type { NextApiRequest, NextApiResponse } from "next";
import { ensureAuth, callUpstream, extractToken, BASE } from "../../lib/tempmail";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    const auth = await ensureAuth();
    const upstream = await callUpstream(BASE + "/api/stats", undefined, auth.sid, auth.token);
    extractToken(upstream.data);
    return res.status(200).json(upstream.data);
  } catch (err: any) {
    return res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
}
