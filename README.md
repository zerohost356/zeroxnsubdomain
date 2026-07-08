# 🚀 Deploy — 1 Vercel Project, 2 Domains

## Kiến trúc

```
Vercel Project (1 project duy nhất)
├── zeroxn.qzz.io       → Main website
└── api.zeroxn.qzz.io   → API only

✅  api.zeroxn.qzz.io/api/stock   → JSON data
❌  zeroxn.qzz.io/api/stock        → 404 Not Found
```

Middleware Next.js tự động phân biệt theo `Host` header — không cần Cloudflare Worker hay server phụ.

---

## Bước 1 — Import project lên Vercel

1. Vào https://vercel.com → **Add New Project**
2. Import repo GitHub này
3. Framework: **Next.js** (tự detect)
4. Click **Deploy** — không cần sửa gì

---

## Bước 2 — Thêm 2 domain vào cùng 1 project

Vào **Vercel Dashboard → Project → Settings → Domains**:

| Domain | Loại |
|--------|------|
| `zeroxn.qzz.io` | Main website |
| `api.zeroxn.qzz.io` | API subdomain |

Thêm lần lượt từng domain, Vercel sẽ cấp SSL tự động cho cả hai.

---

## Bước 3 — Cấu hình DNS

Trỏ cả 2 domain về Vercel trong DNS provider của bạn:

```
Type    Name    Value                   TTL
A       @       76.76.21.21             Auto
CNAME   www     cname.vercel-dns.com    Auto
CNAME   api     cname.vercel-dns.com    Auto
```

> Nếu domain đang dùng Cloudflare, **tắt proxy (grey cloud ☁️)** cho record `api` để Vercel SSL hoạt động đúng.

---

## Cách hoạt động

```
Request: zeroxn.qzz.io/api/stock
  → Vercel nhận
  → middleware.ts: host = "zeroxn.qzz.io" ≠ "api.zeroxn.qzz.io"
  → Rewrite → /404  ❌

Request: api.zeroxn.qzz.io/api/stock
  → Vercel nhận
  → middleware.ts: host = "api.zeroxn.qzz.io" ✅
  → Tiếp tục bình thường → JSON response
```

---

## Kiểm tra sau khi deploy

```bash
# ✅ Phải trả về JSON
curl https://api.zeroxn.qzz.io/api/stock

# ❌ Phải trả về 404
curl https://zeroxn.qzz.io/api/stock

# ✅ Website bình thường
curl https://zeroxn.qzz.io
```
