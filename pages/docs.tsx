import { useState } from "react";
import Head from "next/head";
import { pageUrl } from "../lib/seo";
import { API_BASE } from "../lib/config";

interface Param { name: string; in: "query" | "body" | "path"; required: boolean; description: string; example?: string; }
interface Endpoint {
  method: "GET" | "POST" | "DELETE";
  path: string;
  summary: string;
  description: string;
  params: Param[];
  testUrl?: string;
  testBody?: Record<string, string>;
  testMethod?: string;
}

const ENDPOINTS: Endpoint[] = [
  {
    method: "GET", path: "/api/generator-email",
    summary: "Generate random email",
    description: "Generates a new random temporary email address and returns a session auth token.",
    params: [],
    testUrl: `${API_BASE}/api/generator-email`,
  },
  {
    method: "GET", path: "/api/custom-email",
    summary: "Create custom email",
    description: "Create a temporary email with a chosen username and domain combination.",
    params: [
      { name: "username", in: "query", required: true, description: "Desired username part", example: "johndoe" },
      { name: "domain", in: "query", required: true, description: "Domain from /api/domains list", example: "dotool8.top" },
    ],
    testUrl: `${API_BASE}/api/custom-email?username=testuser&domain=dotool8.top`,
  },
  {
    method: "GET", path: "/api/inbox",
    summary: "Fetch inbox emails",
    description: "Returns a list of emails received by the given address. Requires generating an email first.",
    params: [
      { name: "inbox", in: "query", required: true, description: "The email address to fetch inbox for", example: "user@example.com" },
    ],
    testUrl: `${API_BASE}/api/inbox?inbox=`,
  },
  {
    method: "GET", path: "/api/domains",
    summary: "List available domains",
    description: "Returns all available domains including their active status and MX record validity.",
    params: [],
    testUrl: `${API_BASE}/api/domains`,
  },
  {
    method: "GET", path: "/api/stats",
    summary: "Service statistics",
    description: "Returns live platform statistics: total emails, today's count, 24h rolling, unique subjects, and domain info.",
    params: [],
    testUrl: `${API_BASE}/api/stats`,
  },
  {
    method: "DELETE", path: "/api/clear",
    summary: "Clear inbox",
    description: "Permanently deletes all emails from the specified inbox. This action is irreversible.",
    params: [
      { name: "inbox", in: "query", required: true, description: "The email address whose inbox to clear", example: "user@example.com" },
    ],
    testUrl: `${API_BASE}/api/clear?inbox=`,
    testMethod: "DELETE",
  },
  {
    method: "GET", path: "/api/email/:id",
    summary: "Get single email",
    description: "Fetches the full content of a single email message by its ID.",
    params: [
      { name: "id", in: "path", required: true, description: "The email message ID from inbox list", example: "abc123" },
    ],
    testUrl: `${API_BASE}/api/email/`,
  },
  {
    method: "GET", path: "/api/stream",
    summary: "SSE email stream",
    description: "Opens a Server-Sent Events stream for real-time email delivery. Events fire when new emails arrive. Keep the connection open.",
    params: [
      { name: "inbox", in: "query", required: true, description: "Email address to stream events for", example: "user@example.com" },
    ],
    testUrl: `${API_BASE}/api/stream?inbox=`,
  },
  {
    method: "GET", path: "/api/stock",
    summary: "Blox Fruits stock",
    description: "Returns the current Blox Fruits stock from FruityBlox including Normal Stock (resets every 4h) and Mirage Stock (resets every 2h). Results are cached for 10 seconds.",
    params: [],
    testUrl: `${API_BASE}/api/stock`,
  },
];

const METHOD_STYLE: Record<string, string> = {
  GET: "bg-emerald-900/30 text-emerald-400 border-emerald-700/40",
  POST: "bg-blue-900/30 text-blue-400 border-blue-700/40",
  DELETE: "bg-red-900/30 text-red-400 border-red-700/40",
};

function JsonViewer({ data }: { data: any }) {
  const json = JSON.stringify(data, null, 2);
  const lines = json.split("\n").map((line, i) => {
    const colored = line
      .replace(/"([^"]+)":/g, '<span class="text-sky-300">"$1"</span>:')
      .replace(/: "([^"]*)"(,?)$/g, ': <span class="text-amber-300">"$1"</span>$2')
      .replace(/: (true|false)(,?)$/g, ': <span class="text-violet-400">$1</span>$2')
      .replace(/: (\d+)(,?)$/g, ': <span class="text-emerald-400">$1</span>$2')
      .replace(/: (null)(,?)$/g, ': <span class="text-[#8b949e]">null</span>$2');
    return <div key={i} dangerouslySetInnerHTML={{ __html: colored }} />;
  });
  return <>{lines}</>;
}

function EndpointCard({ ep }: { ep: Endpoint }) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});

  const buildUrl = () => {
    if (!ep.testUrl) return "";
    let url = ep.testUrl;
    for (const [k, v] of Object.entries(paramValues)) {
      if (url.endsWith(`${k}=`) || url.includes(`${k}=`)) {
        url = url.replace(new RegExp(`(${k}=)[^&]*`), `$1${encodeURIComponent(v)}`);
      } else if (url.endsWith("/")) {
        url += encodeURIComponent(v);
      }
    }
    return url;
  };

  const runTest = async () => {
    if (!ep.testUrl) return;
    setLoading(true); setResult(null);
    const url = buildUrl();
    const t0 = Date.now();
    try {
      const method = ep.testMethod || "GET";
      const r = await fetch(url, { method });
      setStatus(r.status);
      setElapsed(Date.now() - t0);
      const text = await r.text();
      try { setResult(JSON.parse(text)); }
      catch { setResult({ _raw: text }); }
    } catch (e: any) {
      setResult({ error: e.message });
    }
    setLoading(false);
  };

  const queryParams = ep.params.filter((p) => p.in === "query" || p.in === "path");

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden transition-all hover:border-[#484f58]">
      {/* Header row */}
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-4 px-5 py-4 text-left group">
        <span className={`text-[11px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-wider flex-shrink-0 ${METHOD_STYLE[ep.method]}`}>
          {ep.method}
        </span>
        <code className="font-mono text-sm text-white flex-1 truncate group-hover:text-violet-300 transition-colors">{ep.path}</code>
        <span className="hidden sm:block text-xs text-[#8b949e] truncate flex-1">{ep.summary}</span>
        <svg className={`w-4 h-4 text-[#484f58] flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-[#21262d] px-5 py-5 space-y-5">
          <p className="text-sm text-[#8b949e] leading-relaxed">{ep.description}</p>

          {/* Parameters */}
          {ep.params.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-3">Parameters</p>
              <div className="space-y-2">
                {ep.params.map((p) => (
                  <div key={p.name} className="bg-[#0d1117] rounded-xl border border-[#30363d] px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex items-center gap-2 sm:w-40 flex-shrink-0">
                      <code className="text-xs font-bold text-violet-400">{p.name}</code>
                      {p.required && <span className="text-[9px] font-bold text-red-400 uppercase">required</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#8b949e]">{p.description}</p>
                      {p.example && <p className="text-[10px] text-[#484f58] mt-0.5">e.g. <code className="text-amber-400">{p.example}</code></p>}
                    </div>
                    <span className="text-[10px] text-[#484f58] border border-[#30363d] px-2 py-0.5 rounded-md flex-shrink-0">{p.in}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Live test */}
          <div className="bg-[#0d1117] rounded-xl border border-[#30363d] p-4">
            <p className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-3">Live Test</p>

            {queryParams.length > 0 && (
              <div className="space-y-2 mb-4">
                {queryParams.map((p) => (
                  <div key={p.name} className="flex items-center gap-3">
                    <label className="text-xs text-[#8b949e] w-24 flex-shrink-0 font-mono">{p.name}</label>
                    <input type="text" placeholder={p.example || p.name}
                      value={paramValues[p.name] || ""}
                      onChange={(e) => setParamValues((prev) => ({ ...prev, [p.name]: e.target.value }))}
                      className="flex-1 bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-white placeholder-[#484f58] focus:outline-none focus:border-violet-500 font-mono" />
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={runTest} disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-semibold transition-colors disabled:opacity-40">
                {loading
                  ? <><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Running…</>
                  : <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>Run Test</>}
              </button>
              <code className="text-[11px] text-[#8b949e] font-mono truncate flex-1">
                <span className={`mr-2 font-bold ${ep.method === "GET" ? "text-emerald-400" : ep.method === "DELETE" ? "text-red-400" : "text-blue-400"}`}>{ep.testMethod || ep.method}</span>
                {buildUrl() || ep.testUrl}
              </code>
              {status !== null && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${status >= 200 && status < 300 ? "bg-emerald-900/30 text-emerald-400" : "bg-red-900/30 text-red-400"}`}>
                    {status}
                  </span>
                  {elapsed !== null && <span className="text-[11px] text-[#484f58]">{elapsed}ms</span>}
                </div>
              )}
            </div>

            {result !== null && (
              <div className="mt-4 bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#21262d]">
                  <span className="text-[11px] font-semibold text-[#8b949e] uppercase tracking-wider">Response</span>
                  <button onClick={() => { navigator.clipboard.writeText(JSON.stringify(result, null, 2)); }}
                    className="text-[10px] text-violet-400 hover:text-violet-300 transition-colors">
                    Copy
                  </button>
                </div>
                <pre className="px-4 py-4 text-xs font-mono overflow-x-auto max-h-96 leading-relaxed">
                  <JsonViewer data={result} />
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Docs() {
  return (
    <>
      <Head>
        <title>API Documentation – TempMail | REST API Reference</title>
        <meta name="description" content="Interactive REST API documentation for TempMail. Test all endpoints live: generate emails, fetch inbox, stream real-time events, and more." />
        <link rel="canonical" href={pageUrl("/docs")} />
        <meta property="og:url" content={pageUrl("/docs")} />
        <meta property="og:title" content="API Documentation – TempMail" />
        <meta property="og:description" content="Interactive REST API documentation for TempMail. Test all endpoints live: generate emails, fetch inbox, stream real-time events, and more." />
        <meta name="twitter:title" content="API Documentation – TempMail" />
        <meta name="twitter:description" content="Interactive REST API docs. Test all endpoints live." />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: pageUrl("/") },
                { "@type": "ListItem", position: 2, name: "API Docs", item: pageUrl("/docs") },
              ],
            }),
          }}
        />
      </Head>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold">API Documentation</h1>
              <p className="text-[#8b949e] text-sm">Interactive docs — click any endpoint to test it live</p>
            </div>
          </div>
        </div>

        {/* Base URL */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-1.5">Base URL</p>
            <code className="text-sm text-violet-300 font-mono">{API_BASE}/api</code>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "JSON", color: "text-emerald-400 bg-emerald-900/20 border-emerald-700/30" },
              { label: "REST", color: "text-blue-400 bg-blue-900/20 border-blue-700/30" },
              { label: "No auth", color: "text-amber-400 bg-amber-900/20 border-amber-700/30" },
            ].map((b) => (
              <span key={b.label} className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${b.color}`}>{b.label}</span>
            ))}
          </div>
        </div>

        {/* Endpoint groups */}
        <div className="space-y-3 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-[11px] font-semibold text-[#484f58] uppercase tracking-widest">Endpoints</div>
            <div className="flex-1 h-px bg-[#21262d]"></div>
            <div className="flex items-center gap-2">
              {["GET", "POST", "DELETE"].map((m) => (
                <span key={m} className={`text-[10px] font-bold px-2 py-0.5 rounded border ${METHOD_STYLE[m]}`}>{m}</span>
              ))}
            </div>
          </div>
          {ENDPOINTS.map((ep) => <EndpointCard key={ep.path} ep={ep} />)}
        </div>

        {/* Notes */}
        <div className="bg-amber-900/10 border border-amber-700/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="text-sm font-semibold text-amber-300">Notes</span>
          </div>
          <ul className="space-y-2 text-sm text-[#8b949e]">
            <li>• All responses are JSON. Successful responses include <code className="text-amber-300 text-xs">&quot;success&quot;: true</code>.</li>
            <li>• The <code className="text-amber-300 text-xs">/api/stream</code> endpoint is SSE — it keeps the connection open and fires events when new emails arrive.</li>
            <li>• Email addresses are temporary. They may expire if the underlying upstream session expires.</li>
            <li>• Rate limits are enforced by the upstream provider. Be respectful with polling intervals.</li>
          </ul>
        </div>
      </div>
    </>
  );
       }
