import type { NextApiRequest, NextApiResponse } from "next";
import { ensureAuth, BASE } from "../../lib/tempmail";
import axios from "axios";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "DELETE") return res.status(405).json({ error: "Method not allowed" });
  const { inbox } = req.query;
  if (!inbox) return res.status(400).json({ error: "Missing inbox param" });

  try {
    const auth = await ensureAuth(inbox as string);
    const upstream = await axios.delete(`${BASE}/api/emails/clear`, {
      params: { email: inbox },
      headers: {
        "User-Agent": UA,
        "Referer": BASE + "/",
        "Origin": BASE,
        "X-Inbox-Token": auth.token,
        "Cookie": `gm_sid=${auth.sid}`,
      },
      timeout: 15000,
    });
    return res.status(200).json(upstream.data);
  } catch (err: any) {
    return res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
}
