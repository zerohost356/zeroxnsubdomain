import type { NextApiRequest, NextApiResponse } from "next";
import { ensureAuth, callUpstream, extractToken, fixEmailContent, BASE } from "../../lib/tempmail";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const { inbox, limited } = req.query;
  if (!inbox) {
    return res.status(400).json({ success: false, error: "Missing required query param: inbox" });
  }
  try {
    const auth = await ensureAuth(inbox as string);
    const upstream = await callUpstream(
      BASE + "/api/emails",
      { email: inbox },
      auth.sid,
      auth.token
    );
    extractToken(upstream.data);
    const body = upstream.data;
    if (body.data && Array.isArray(body.data.emails)) {
      body.data.emails = body.data.emails.map(fixEmailContent).map((email: any) => {
        const { html_content, ...rest } = email;
        if (!rest.to) rest.to = inbox as string;
        return rest;
      });
      if (limited) {
        const lim = parseInt(limited as string, 10);
        if (Number.isFinite(lim) && lim > 0) {
          body.data.emails = body.data.emails.slice(0, lim);
        }
      }
      body.data.count = body.data.emails.length;
    }
    return res.status(200).json(body);
  } catch (err: any) {
    const status = err.response?.status || 500;
    const data = err.response?.data || { error: err.message };
    return res.status(status).json(data);
  }
}
