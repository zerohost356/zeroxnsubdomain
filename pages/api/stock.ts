import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

const FRUITYBLOX_URL = "https://fruityblox.com/stock";
const IMAGE_BASE = "https://fruityblox.com";
const NORMAL_RESET_HOURS = 4;
const MIRAGE_RESET_HOURS = 2;
const CACHE_TTL_MS = 10 * 1000;

interface Fruit {
  name: string;
  price_beli: number;
  price_robux: number;
  type: string;
  image_url: string;
}

interface StockCache {
  data: { normal_stock: Fruit[]; mirage_stock: Fruit[] } | null;
  fetchedAt: number | null;
  error: string | null;
}

const cache: StockCache = { data: null, fetchedAt: null, error: null };
let refreshing = false;

function formatTimer(hours: number): string {
  const intervalMs = hours * 60 * 60 * 1000;
  const nowMs = Date.now();
  const remainingMs = intervalMs - (nowMs % intervalMs);
  const remainingS = Math.floor(remainingMs / 1000);
  const h = Math.floor(remainingS / 3600);
  const m = Math.floor((remainingS % 3600) / 60);
  const s = remainingS % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatFruits(fruits: any[]): Fruit[] {
  return fruits.map((f) => ({
    name: f.name,
    price_beli: f.price,
    price_robux: f.robuxPrice,
    type: f.type,
    image_url: IMAGE_BASE + (f.image || ""),
  }));
}

function parseStockFromHtml(html: string): { normal: any[]; mirage: any[] } | null {
  const re = /self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)/g;
  let m: RegExpExecArray | null;
  let combined = "";
  while ((m = re.exec(html)) !== null) combined += m[1];
  if (!combined) return null;

  const unescaped = combined
    .replace(/\\\\"/g, "\x00DQUOTE\x00")
    .replace(/\\"/g, '"')
    .replace(/\x00DQUOTE\x00/g, '\\"');

  const stockMatch = unescaped.match(/\{"normal":\[[\s\S]*?"mirage":\[[\s\S]*?\]\}/);
  if (!stockMatch) return null;

  try {
    return JSON.parse(stockMatch[0]);
  } catch {
    return null;
  }
}

async function fetchStock() {
  const response = await axios.get(FRUITYBLOX_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
    timeout: 15000,
  });

  const rawData = parseStockFromHtml(response.data);
  if (!rawData) throw new Error("Could not parse stock data from HTML");

  return {
    normal_stock: formatFruits(rawData.normal || []),
    mirage_stock: formatFruits(rawData.mirage || []),
  };
}

async function refreshCache() {
  if (refreshing) return;
  refreshing = true;
  try {
    const data = await fetchStock();
    cache.data = data;
    cache.fetchedAt = Date.now();
    cache.error = null;
  } catch (err: any) {
    cache.error = err.message;
  } finally {
    refreshing = false;
  }
}

function buildResponse(): [object, number] {
  if (!cache.data) {
    if (cache.error) return [{ success: false, error: cache.error }, 500];
    return [{ success: false, error: "Stock data not yet available" }, 503];
  }

  return [
    {
      success: true,
      provider: "FruityBlox",
      data: {
        normal_stock: cache.data.normal_stock,
        mirage_stock: cache.data.mirage_stock,
      },
      timers: {
        normal_reset_in: formatTimer(NORMAL_RESET_HOURS),
        mirage_reset_in: formatTimer(MIRAGE_RESET_HOURS),
      },
      meta: {
        fetched_at: cache.fetchedAt ? new Date(cache.fetchedAt).toISOString() : null,
      },
    },
    200,
  ];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    await refreshCache();
    const [body, status] = buildResponse();
    return res.status(status).json({ ...(body as object), message: "Stock cache refreshed" });
  }

  const stale = !cache.fetchedAt || Date.now() - cache.fetchedAt > CACHE_TTL_MS;
  if (stale) await refreshCache();

  const [body, status] = buildResponse();
  res.setHeader("Cache-Control", "no-store");
  return res.status(status).json(body);
}
