import type { NextApiRequest, NextApiResponse } from "next";
import { ensureAuth, BASE } from "../../lib/tempmail";
import axios from "axios";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export const config = {
  api: { responseLimit: false, externalResolver: true },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();
  const { inbox } = req.query;
  if (!inbox) return res.status(400).end();

  try {
    const auth = await ensureAuth(inbox as string);

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    });

    res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`);

    let upstreamRes: any;
    try {
      upstreamRes = await axios.get(
        `${BASE}/api/emails/stream?email=${encodeURIComponent(inbox as string)}`,
        {
          headers: {
            "User-Agent": UA,
            "Referer": BASE + "/",
            "X-Inbox-Token": auth.token,
            "Cookie": `gm_sid=${auth.sid}`,
            "Accept": "text/event-stream",
          },
          responseType: "stream",
          timeout: 0,
        }
      );
    } catch {
      res.end();
      return;
    }

    upstreamRes.data.pipe(res);

    req.on("close", () => {
      try { upstreamRes.data.destroy(); } catch {}
      res.end();
    });

    req.on("error", () => {
      try { upstreamRes.data.destroy(); } catch {}
      res.end();
    });

    upstreamRes.data.on("error", () => {
      res.end();
    });
  } catch {
    if (!res.headersSent) {
      res.status(500).end();
    } else {
      res.end();
    }
  }
}
