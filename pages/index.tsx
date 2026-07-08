import { useState, useEffect, useCallback, useRef } from "react";
import Head from "next/head";
import { getCookie, setCookie, deleteCookie, getJsonCookie, setJsonCookie } from "../lib/cookies";
import { pageUrl } from "../lib/seo";
import { API_BASE } from "../lib/config";

const CK_ADDR = "tm_addr";
const CK_READ = "tm_read";
const CK_RECENT = "tm_recent";
const CK_NOTIF = "tm_notif";

function uniqueUsername(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const ts = Date.now().toString(36);
  const padLen = Math.max(0, 15 - ts.length);
  const pad = Array.from({ length: padLen }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return (ts + pad).slice(0, 15);
}

interface Email {
  id: string;
  from: string;
  from_name?: string;
  from_address?: string;
  to?: string;
  subject: string;
  content: string;
  html_content?: string;
  received_at: string;
}
interface Stats { total_emails: number; today_emails: number; emails_24h: number; active_domains: number; }

export default function Home() {
  const [email, setEmailState] = useState("");
  const [inbox, setInbox] = useState<Email[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedMail, setSelectedMail] = useState<Email | null>(null);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [domains, setDomains] = useState<{ domain: string }[]>([]);
  const [customUser, setCustomUser] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("");
  const [customLoading, setCustomLoading] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [clearing, setClearing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [showRecent, setShowRecent] = useState(false);
  const [sseStatus, setSseStatus] = useState<"connecting" | "connected" | "off">("off");
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [supportsNotif, setSupportsNotif] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [recentAddresses, setRecentAddresses] = useState<string[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [customDomainSearch, setCustomDomainSearch] = useState("");

  const esRef = useRef<EventSource | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const emailRef = useRef("");

  const saveEmail = (addr: string) => {
    setCookie(CK_ADDR, addr);
    emailRef.current = addr;
    setEmailState(addr);
    const prev = getJsonCookie<string[]>(CK_RECENT, []);
    const next = [addr, ...prev.filter((a) => a !== addr)].slice(0, 8);
    setJsonCookie(CK_RECENT, next);
    setRecentAddresses(next);
  };

  const removeFromHistory = (addr: string) => {
    const next = recentAddresses.filter((a) => a !== addr);
    setJsonCookie(CK_RECENT, next);
    setRecentAddresses(next);
    if (next.length === 0) setShowRecent(false);
  };

  const clearAllHistory = () => {
    setJsonCookie(CK_RECENT, []);
    setRecentAddresses([]);
    setShowRecent(false);
  };

  const markRead = (id: string) => {
    const next = readIds.includes(id) ? readIds : [...readIds, id];
    setReadIds(next);
    setJsonCookie(CK_READ, next);
  };

  const sendDesktopNotif = useCallback((title: string, body: string) => {
    if (notifEnabled && typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification(title, { body, icon: "/favicon.svg" });
    }
  }, [notifEnabled]);

  const fetchInbox = useCallback(async (addr?: string, silent = false) => {
    const target = addr || emailRef.current;
    if (!target) return;
    if (!silent) setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/inbox?inbox=${encodeURIComponent(target)}`);
      const data = await r.json();
      if (data.data?.emails) {
        setInbox((prev) => {
          const fresh = (data.data.emails as Email[]).filter((e) => !prev.find((p) => p.id === e.id));
          if (fresh.length > 0 && prev.length > 0) {
            sendDesktopNotif(`${fresh.length} new email${fresh.length > 1 ? "s" : ""}`, fresh[0].subject || "(no subject)");
          }
          return data.data.emails;
        });
        setLastRefresh(new Date());
      }
    } catch {}
    if (!silent) setLoading(false);
  }, [sendDesktopNotif]);

  const startSSE = useCallback((addr: string) => {
    if (esRef.current) { esRef.current.close(); esRef.current = null; }
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    setSseStatus("connecting");
    const es = new EventSource(`${API_BASE}/api/stream?inbox=${encodeURIComponent(addr)}`);
    esRef.current = es;
    es.onopen = () => setSseStatus("connected");
    es.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data);
        if (d.type === "connected") { setSseStatus("connected"); return; }
        if (d.type === "new_email" || d.id) fetchInbox(addr, true);
      } catch {}
    };
    es.onerror = () => {
      es.close(); esRef.current = null; setSseStatus("off");
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => fetchInbox(undefined, true), 10000);
    };
    pollRef.current = setInterval(() => fetchInbox(undefined, true), 30000);
  }, [fetchInbox]);

  const generateEmail = useCallback(async () => {
    setGenerating(true);
    if (esRef.current) esRef.current.close();
    if (pollRef.current) clearInterval(pollRef.current);
    try {
      let domainList = domains;
      if (domainList.length === 0) {
        const dr = await fetch(`${API_BASE}/api/domains`);
        const dd = await dr.json();
        if (dd.data?.domains && Array.isArray(dd.data.domains)) {
          domainList = dd.data.domains
            .filter((x: any) => x.is_active)
            .map((x: any) => ({ domain: x.domain_name }));
          setDomains(domainList);
          if (domainList.length > 0) setSelectedDomain(domainList[0].domain);
        }
      }
      if (domainList.length === 0) { setGenerating(false); return; }

      const username = uniqueUsername();
      const domain = domainList[Math.floor(Math.random() * domainList.length)].domain;

      deleteCookie(CK_ADDR);
      deleteCookie(CK_RECENT);
      deleteCookie(CK_READ);
      deleteCookie(CK_NOTIF);
      setRecentAddresses([]);
      setReadIds([]);

      const r = await fetch(`${API_BASE}/api/custom-email?username=${encodeURIComponent(username)}&domain=${encodeURIComponent(domain)}`);
      const data = await r.json();
      const addr = data.auth?.email || data.data?.email || "";
      if (addr) {
        saveEmail(addr);
        setInbox([]);
        await fetchInbox(addr);
        startSSE(addr);
      }
    } catch {}
    setGenerating(false);
  }, [fetchInbox, startSSE, domains]);

  const clearInbox = async () => {
    if (!emailRef.current || clearing) return;
    setClearing(true);
    try {
      await fetch(`${API_BASE}/api/clear?inbox=${encodeURIComponent(emailRef.current)}`, { method: "DELETE" });
      setInbox([]);
    } catch {}
    setClearing(false);
  };

  const applyCustomEmail = async () => {
    if (!customUser.trim() || !selectedDomain) return;
    setCustomLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/custom-email?username=${encodeURIComponent(customUser.trim())}&domain=${encodeURIComponent(selectedDomain)}`);
      const data = await r.json();
      const addr = data.auth?.email || data.data?.email || "";
      if (addr) {
        saveEmail(addr);
        setInbox([]);
        setShowCustomModal(false);
        setCustomUser("");
        await fetchInbox(addr);
        startSSE(addr);
      }
    } catch {}
    setCustomLoading(false);
  };

  const requestNotification = async () => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "default") {
      const p = await Notification.requestPermission();
      if (p === "granted") { setNotifEnabled(true); setCookie(CK_NOTIF, "1"); }
    } else if (Notification.permission === "granted") {
      const next = !notifEnabled;
      setNotifEnabled(next);
      setCookie(CK_NOTIF, next ? "1" : "0");
    }
  };

  const copyEmail = () => {
    if (!emailRef.current) return;
    navigator.clipboard.writeText(emailRef.current);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    setSupportsNotif(typeof Notification !== "undefined");
    const notif = getCookie(CK_NOTIF) === "1";
    setNotifEnabled(notif);
    const read = getJsonCookie<string[]>(CK_READ, []);
    setReadIds(read);
    const recent = getJsonCookie<string[]>(CK_RECENT, []);
    setRecentAddresses(recent);
    const saved = getCookie(CK_ADDR);
    if (saved) {
      saveEmail(saved);
      fetchInbox(saved);
      startSSE(saved);
    } else {
      generateEmail();
    }
    fetch(`${API_BASE}/api/domains`).then((r) => r.json()).then((d) => {
      if (d.data?.domains && Array.isArray(d.data.domains)) {
        const list = d.data.domains.filter((x: any) => x.is_active).map((x: any) => ({ domain: x.domain_name }));
        setDomains(list);
        if (list.length > 0) setSelectedDomain(list[0].domain);
      }
    }).catch(() => {});
    fetch(`${API_BASE}/api/stats`).then((r) => r.json()).then((d) => { if (d.success) setStats(d.data); }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      if (esRef.current) esRef.current.close();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const formatTime = (str: string) => {
    try {
      const d = new Date(str); const diff = Date.now() - d.getTime();
      if (diff < 60000) return "just now";
      if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
      return d.toLocaleDateString();
    } catch { return str; }
  };

  const colors = ["#7c3aed", "#6366f1", "#db2777", "#d97706", "#059669", "#2563eb", "#dc2626", "#0891b2"];
  const getColor = (s: string) => colors[(s.charCodeAt(0) || 65) % colors.length];
  const getInitial = (f: string) => (f?.split("@")[0] || "?").charAt(0).toUpperCase();
  const unread = inbox.filter((m) => !readIds.includes(m.id)).length;

  return (
    <>
      <Head>
        <title>TempMail – Free Disposable Email Address</title>
        <meta name="description" content="Generate a free temporary email instantly. No registration required. Real-time inbox with SSE streaming. 1,200+ available domains." />
        <link rel="canonical" href={pageUrl("/")} />
        <meta property="og:url" content={pageUrl("/")} />
        <meta property="og:title" content="TempMail – Free Disposable Email Address" />
        <meta property="og:description" content="Generate a free temporary email instantly. No registration required. Real-time inbox with SSE streaming. 1,200+ available domains." />
        <meta name="twitter:title" content="TempMail – Free Disposable Email Address" />
        <meta name="twitter:description" content="Generate a free temporary email instantly. No registration required. Real-time inbox with SSE streaming." />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "TempMail",
              url: pageUrl("/"),
              applicationCategory: "UtilitiesApplication",
              operatingSystem: "Any",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              description:
                "Free disposable temporary email. Generate random or custom addresses and receive mail instantly, no signup required.",
              featureList: [
                "Generate random email addresses",
                "Custom email addresses",
                "Real-time inbox via SSE",
                "Desktop push notifications",
                "1,200+ available domains",
                "No registration required",
              ],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Home",
                  item: pageUrl("/"),
                },
              ],
            }),
          }}
        />
      </Head>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium px-3 py-1.5 rounded-full mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse"></div>
            {stats ? `${stats.emails_24h.toLocaleString()} emails in last 24h · ${stats.active_domains.toLocaleString()} domains` : "Instant. Private. Free."}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black mb-3 tracking-tight">
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">Free Temporary Email</span>
          </h1>
          <p className="text-[#8b949e] text-base max-w-md mx-auto">
            Protect your real inbox. Generate a disposable address in one click — no signup, no spam.
          </p>
        </div>

        {/* Main Email Card */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden shadow-2xl shadow-black/30 mb-5">
          {/* Status bar */}
          <div className="flex items-center justify-between px-4 sm:px-5 pt-4 pb-3 border-b border-[#21262d]">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                sseStatus === "connected" ? "bg-emerald-400 animate-pulse" :
                sseStatus === "connecting" ? "bg-amber-400 animate-pulse" : "bg-[#484f58]"
              }`}/>
              <span className="text-xs font-semibold text-[#8b949e] uppercase tracking-widest">Your Address</span>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${
                sseStatus === "connected" ? "text-emerald-400 border-emerald-700/40 bg-emerald-900/20" :
                sseStatus === "connecting" ? "text-amber-400 border-amber-700/40 bg-amber-900/20" :
                "text-[#8b949e] border-[#30363d] bg-[#21262d]"
              }`}>{sseStatus === "connected" ? "Live" : sseStatus === "connecting" ? "Connecting…" : "Polling"}</span>
            </div>
            {recentAddresses.length > 0 && (
              <div className="relative">
                <button onClick={() => setShowRecent(!showRecent)} className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  History
                </button>
                {showRecent && (
                  <div className="absolute right-0 top-6 z-30 bg-[#0d1117] border border-[#30363d] rounded-xl shadow-2xl min-w-64 animate-slide-up overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-[#21262d]">
                      <span className="text-[10px] font-semibold text-[#484f58] uppercase tracking-wider">{recentAddresses.length} saved</span>
                      <button onClick={clearAllHistory} className="text-[10px] text-red-400 hover:text-red-300 transition-colors font-medium">
                        Clear all
                      </button>
                    </div>
                    {recentAddresses.map((addr) => (
                      <div key={addr} className="flex items-center group hover:bg-[#21262d] transition-colors">
                        <button onClick={() => {
                          setShowRecent(false);
                          if (addr === emailRef.current) return;
                          saveEmail(addr); setInbox([]); fetchInbox(addr); startSSE(addr);
                        }} className={`flex-1 text-left px-3 py-2.5 text-xs font-mono truncate ${addr === emailRef.current ? "text-violet-400" : "text-[#c9d1d9]"}`}>
                          {addr}
                          {addr === emailRef.current && <span className="ml-2 text-[#484f58] font-sans">current</span>}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); removeFromHistory(addr); }}
                          className="flex-shrink-0 w-6 h-6 mr-2 rounded-md flex items-center justify-center text-[#484f58] hover:text-red-400 hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Email address display */}
          <div className="px-4 sm:px-5 py-4">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mb-4">
              <div className="flex-1 min-w-0 bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3.5 flex items-center gap-3 cursor-text" onClick={copyEmail}>
                <svg className="w-4 h-4 text-violet-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className={`font-mono text-sm truncate select-all flex-1 ${generating ? "text-[#8b949e]" : "text-white"}`}>
                  {generating ? "Generating address…" : email || "Loading…"}
                </span>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={copyEmail} disabled={!email}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all flex-1 sm:flex-none justify-center ${
                    copied ? "bg-emerald-600 text-white" : "bg-violet-600 hover:bg-violet-500 text-white"
                  } disabled:opacity-40`}>
                  {copied
                    ? <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>Copied</>
                    : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copy</>}
                </button>
                <button onClick={() => { if (domains.length === 0) fetch(`${API_BASE}/api/domains`).then(r => r.json()).then(d => { if (d.data?.domains) { const l = d.data.domains.filter((x:any)=>x.is_active).map((x:any)=>({domain:x.domain_name})); setDomains(l); if(l.length>0)setSelectedDomain(l[0].domain); } }); setShowCustomModal(true); }}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-sm font-medium border border-[#30363d] transition-all" title="Custom email">
                  <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  Custom
                </button>
                <button onClick={generateEmail} disabled={generating}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-sm font-medium border border-[#30363d] transition-all disabled:opacity-40" title="New address">
                  <svg className={`w-4 h-4 text-emerald-400 ${generating ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  New
                </button>
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="flex items-center gap-2 text-xs text-[#8b949e] mr-2">
                <span><strong className="text-white">{inbox.length}</strong> messages</span>
                {unread > 0 && <span className="bg-violet-500/20 text-violet-300 border border-violet-500/30 rounded-full px-2 py-0.5 text-[10px] font-semibold">{unread} new</span>}
                {lastRefresh && <span className="hidden sm:inline text-[#484f58]">· {formatTime(lastRefresh.toISOString())}</span>}
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <button onClick={() => fetchInbox()} disabled={loading || !email}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-xs text-[#c9d1d9] border border-[#30363d] transition-all disabled:opacity-40">
                  <svg className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Refresh
                </button>
                {supportsNotif && (
                  <button onClick={requestNotification}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all ${notifEnabled ? "bg-violet-900/30 border-violet-700/40 text-violet-300" : "bg-[#21262d] border-[#30363d] text-[#8b949e] hover:text-white hover:bg-[#30363d]"}`}
                    title={notifEnabled ? "Notifications on" : "Enable notifications"}>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                    {notifEnabled ? "Alerts on" : "Alerts"}
                  </button>
                )}
                {inbox.length > 0 && (
                  <button onClick={clearInbox} disabled={clearing}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-900/20 hover:bg-red-900/40 border border-red-800/40 text-red-400 text-xs transition-all disabled:opacity-40">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    {clearing ? "Clearing…" : "Clear all"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Inbox */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden shadow-2xl shadow-black/20">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#21262d]">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
              <span className="font-semibold text-sm">Inbox</span>
              {inbox.length > 0 && <span className="text-[10px] bg-violet-500/20 text-violet-300 border border-violet-500/30 rounded-full px-2 py-0.5 font-semibold">{inbox.length}</span>}
            </div>
          </div>

          {loading && inbox.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-violet-600/10 border border-violet-600/20 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              </div>
              <p className="text-[#8b949e] text-sm">Fetching your inbox…</p>
            </div>
          ) : inbox.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-[#21262d] flex items-center justify-center animate-float">
                  <svg className="w-9 h-9 text-[#484f58]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#161b22] border-2 border-[#21262d] flex items-center justify-center">
                  <div className={`w-2 h-2 rounded-full ${sseStatus === "connected" ? "bg-emerald-400 animate-pulse" : "bg-amber-400 animate-pulse"}`}></div>
                </div>
              </div>
              <div className="text-center max-w-xs">
                <p className="text-white font-semibold mb-1">No messages yet</p>
                <p className="text-[#8b949e] text-sm">Share <span className="text-violet-400 font-mono text-xs">{email || "your address"}</span> to receive emails here</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#8b949e] bg-[#21262d]/60 border border-[#30363d] rounded-xl px-4 py-2.5">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${sseStatus === "connected" ? "bg-emerald-400 animate-pulse" : "bg-amber-400 animate-pulse"}`}></div>
                {sseStatus === "connected" ? "Streaming live — new emails appear instantly" : "Auto-polling every 30 seconds"}
              </div>
            </div>
          ) : (
            <div className="divide-y divide-[#21262d]">
              {inbox.map((mail) => {
                const isRead = readIds.includes(mail.id);
                return (
                  <button key={mail.id} onClick={async () => {
                    setSelectedMail(mail);
                    setModalLoading(true);
                    markRead(mail.id);
                    try {
                      const r = await fetch(`${API_BASE}/api/email/${mail.id}?inbox=${encodeURIComponent(emailRef.current)}`);
                      const data = await r.json();
                      const full = data.data?.email || data.data || null;
                      if (full && typeof full === "object") {
                        const merged: Email = { ...mail, ...full, to: full.to || mail.to || emailRef.current };
                        setSelectedMail(merged);
                      }
                    } catch {}
                    setModalLoading(false);
                  }}
                    className="w-full text-left px-4 sm:px-5 py-4 hover:bg-[#21262d]/50 transition-colors flex items-start gap-4 group">
                    <div className="relative flex-shrink-0 mt-0.5">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg"
                        style={{ backgroundColor: getColor(mail.from || "A") }}>
                        {getInitial(mail.from || "?")}
                      </div>
                      {!isRead && <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-violet-500 border-2 border-[#161b22]"></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm truncate ${!isRead ? "text-white font-semibold" : "text-[#8b949e]"}`}>
                            {mail.from_name || mail.from?.split("@")[0] || "Unknown"}
                          </p>
                          {mail.from && (
                            <p className="text-[11px] text-[#484f58] truncate font-mono">{mail.from}</p>
                          )}
                        </div>
                        <span className="text-[11px] text-[#484f58] flex-shrink-0 mt-0.5">{formatTime(mail.received_at)}</span>
                      </div>
                      <p className={`text-sm truncate mt-1 mb-1 ${!isRead ? "text-white font-medium" : "text-[#8b949e]"}`}>{mail.subject || "(no subject)"}</p>
                      <p className="text-xs text-[#484f58] truncate">{mail.content?.substring(0, 90)}</p>
                    </div>
                    <svg className="w-4 h-4 text-[#30363d] group-hover:text-[#8b949e] flex-shrink-0 mt-3 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Email Detail Modal */}
      {selectedMail && (
        <div className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 animate-fade-in"
          onClick={() => { setSelectedMail(null); setModalLoading(false); }}>
          <div className="bg-[#161b22] border border-[#30363d] w-full sm:rounded-2xl sm:max-w-3xl max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl animate-slide-up rounded-t-2xl"
            onClick={(e) => e.stopPropagation()}>
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#21262d] flex-shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                  style={{ backgroundColor: getColor(selectedMail.from || "A") }}>
                  {getInitial(selectedMail.from || "?")}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{selectedMail.from_name || selectedMail.from?.split("@")[0]}</p>
                  <p className="text-xs text-[#8b949e] truncate">{selectedMail.from}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {modalLoading && (
                  <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                )}
                <button onClick={() => { setSelectedMail(null); setModalLoading(false); }}
                  className="w-8 h-8 rounded-xl bg-[#21262d] hover:bg-[#30363d] flex items-center justify-center transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            {/* Subject + meta */}
            <div className="px-5 py-4 border-b border-[#21262d] flex-shrink-0">
              <h2 className="text-lg font-bold mb-3 leading-snug">{selectedMail.subject || "(no subject)"}</h2>
              <div className="space-y-1.5 text-xs text-[#8b949e]">
                <div className="flex items-baseline gap-2">
                  <span className="flex-shrink-0 font-semibold uppercase tracking-wider text-[10px] w-8">From</span>
                  <span className="text-white font-mono truncate">
                    {selectedMail.from_name
                      ? <>{selectedMail.from_name} <span className="text-[#8b949e]">&lt;{selectedMail.from}&gt;</span></>
                      : selectedMail.from || selectedMail.from_address || "Unknown"
                    }
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="flex-shrink-0 font-semibold uppercase tracking-wider text-[10px] w-8">To</span>
                  <span className="text-white font-mono truncate">{selectedMail.to || email}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="flex-shrink-0 font-semibold uppercase tracking-wider text-[10px] w-8">Date</span>
                  <span>{formatTime(selectedMail.received_at)}</span>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {modalLoading ? (
                <div className="flex items-center justify-center py-16 gap-3">
                  <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-[#8b949e]">Loading email…</span>
                </div>
              ) : selectedMail.html_content ? (
                <iframe srcDoc={selectedMail.html_content} className="w-full min-h-96 h-full border-0" sandbox="allow-same-origin allow-popups" title="Email HTML" />
              ) : (
                <div className="p-5">
                  <p className="text-sm text-[#c9d1d9] leading-relaxed whitespace-pre-wrap break-words">{selectedMail.content || "No content."}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 border-t border-[#21262d] flex items-center gap-3 flex-shrink-0">
              <button onClick={() => { navigator.clipboard.writeText(selectedMail.content || ""); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-xs border border-[#30363d] transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                Copy text
              </button>
              <button onClick={() => { setSelectedMail(null); setModalLoading(false); }} className="ml-auto px-4 py-2 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-sm font-medium border border-[#30363d] transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Email Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 animate-fade-in"
          onClick={() => { setShowCustomModal(false); setCustomDomainSearch(""); }}>
          <div className="bg-[#161b22] border border-[#30363d] w-full sm:rounded-2xl sm:max-w-sm flex flex-col shadow-2xl animate-slide-up rounded-t-2xl"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#21262d]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
                  <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </div>
                <span className="font-semibold text-sm">Custom Address</span>
              </div>
              <button onClick={() => { setShowCustomModal(false); setCustomDomainSearch(""); }} className="w-8 h-8 rounded-xl bg-[#21262d] hover:bg-[#30363d] flex items-center justify-center transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-semibold text-[#8b949e] uppercase tracking-wider">Username</label>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomUser(uniqueUsername());
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 hover:border-violet-500/40 text-violet-400 text-[10px] font-semibold transition-all active:scale-95"
                    title="Generate random 15-char username"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Random
                  </button>
                </div>
                <input type="text" value={customUser} onChange={(e) => setCustomUser(e.target.value.replace(/[^a-zA-Z0-9._-]/g, ""))}
                  placeholder="e.g. johndoe123" onKeyDown={(e) => e.key === "Enter" && applyCustomEmail()}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 text-sm text-white placeholder-[#484f58] focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#8b949e] uppercase tracking-wider mb-2">Domain <span className="normal-case font-normal">({domains.length} active)</span></label>
                {domains.length === 0 ? (
                  <div className="flex items-center gap-2 py-2 text-sm text-[#8b949e]">
                    <div className="w-4 h-4 border border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                    Loading domains…
                  </div>
                ) : (
                  <>
                    <div className="relative mb-2">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#484f58]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      <input
                        type="text"
                        value={customDomainSearch}
                        onChange={(e) => setCustomDomainSearch(e.target.value)}
                        placeholder="Search domains…"
                        className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-[#484f58] focus:outline-none focus:border-violet-500/60 transition-all"
                      />
                      {customDomainSearch && (
                        <button onClick={() => setCustomDomainSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#484f58] hover:text-white transition-colors">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      )}
                    </div>
                    {(() => {
                      const filtered = customDomainSearch
                        ? domains.filter(d => d.domain.toLowerCase().includes(customDomainSearch.toLowerCase()))
                        : domains;
                      return (
                        <div className="max-h-44 overflow-y-auto space-y-1">
                          {filtered.length === 0 ? (
                            <p className="text-xs text-[#484f58] py-3 text-center">No domains match &ldquo;{customDomainSearch}&rdquo;</p>
                          ) : filtered.map((d) => (
                            <button key={d.domain} onClick={() => setSelectedDomain(d.domain)}
                              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border transition-all text-left ${selectedDomain === d.domain ? "bg-violet-600/20 border-violet-500 text-white" : "bg-[#0d1117] border-[#30363d] text-[#8b949e] hover:border-[#8b949e] hover:text-white"}`}>
                              <span className="font-mono text-xs">@{d.domain}</span>
                              <span className="text-[10px] text-emerald-400">✓ active</span>
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>
              {customUser && selectedDomain && (
                <div className="bg-[#0d1117] rounded-xl border border-violet-500/30 px-4 py-3">
                  <p className="text-[10px] text-[#8b949e] mb-1 uppercase tracking-wider">Preview</p>
                  <p className="text-sm font-mono text-violet-300 break-all">{customUser}@{selectedDomain}</p>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => { setShowCustomModal(false); setCustomDomainSearch(""); }} className="flex-1 py-3 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-sm font-medium border border-[#30363d] transition-colors">
                  Cancel
                </button>
                <button onClick={applyCustomEmail} disabled={!customUser.trim() || !selectedDomain || customLoading}
                  className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-semibold transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                  {customLoading ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div> : "Apply"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
