import type { NextApiRequest, NextApiResponse } from "next";
import { ensureAuth, callUpstream, extractToken, fixEmailContent, BASE } from "../../../lib/tempmail";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const { id, inbox } = req.query;
  if (!id) return res.status(400).json({ error: "Missing email id" });
  try {
    const auth = await ensureAuth(inbox as string | undefined);
    const upstream = await callUpstream(`${BASE}/api/email/${id}`, undefined, auth.sid, auth.token);
    extractToken(upstream.data);
    const body = upstream.data;
    if (body.data?.email) {
      body.data.email = fixEmailContent(body.data.email);
      if (!body.data.email.to && inbox) body.data.email.to = inbox as string;
    } else if (body.data && typeof body.data === "object" && body.data.id) {
      body.data = fixEmailContent(body.data);
      if (!body.data.to && inbox) body.data.to = inbox as string;
    }
    return res.status(200).json(body);
  } catch (err: any) {
    return res.status(err.response?.status || 500).json(err.response?.data || { error: err.message });
  }
}
