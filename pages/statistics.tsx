import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { pageUrl } from "../lib/seo";
import { API_BASE } from "../lib/config";

interface Stats {
  total_emails: number; today_emails: number; emails_24h: number;
  all_time_emails: number; unique_subjects: number; active_domains: number; domain_count: number;
}

function AnimatedNumber({ target, duration = 1400 }: { target: number; duration?: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = 0; const step = target / (duration / 16);
    const t = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(t); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(t);
  }, [target, duration]);
  return <>{val.toLocaleString()}</>;
}

export default function Statistics() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = async () => {
    try {
      const r = await fetch(`${API_BASE}/api/stats`);
      const d = await r.json();
      if (d.success) { setStats(d.data); setLastUpdated(new Date()); }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
    const t = setInterval(fetchStats, 30000);
    return () => clearInterval(t);
  }, []);

  const cards = stats ? [
    { label: "Emails Today", value: stats.today_emails, sub: "received this calendar day", color: "violet", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /> },
    { label: "Emails (24h)", value: stats.emails_24h, sub: "rolling 24-hour window", color: "blue", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> },
    { label: "Active Inboxes", value: stats.total_emails, sub: "mailboxes in use", color: "emerald", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /> },
    { label: "All-Time Emails", value: stats.all_time_emails, sub: "since service launch", color: "amber", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /> },
    { label: "Unique Subjects", value: stats.unique_subjects, sub: "distinct email subjects", color: "pink", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /> },
    { label: "Active Domains", value: stats.active_domains, sub: `of ${stats.domain_count?.toLocaleString()} total domains`, color: "cyan", icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /> },
  ] : [];

  const colorCls: Record<string, { card: string; icon: string; num: string }> = {
    violet: { card: "border-violet-500/20 hover:border-violet-500/40", icon: "text-violet-400 bg-violet-500/10 border-violet-500/20", num: "text-violet-300" },
    blue:   { card: "border-blue-500/20 hover:border-blue-500/40",     icon: "text-blue-400 bg-blue-500/10 border-blue-500/20",     num: "text-blue-300" },
    emerald:{ card: "border-emerald-500/20 hover:border-emerald-500/40",icon:"text-emerald-400 bg-emerald-500/10 border-emerald-500/20",num:"text-emerald-300" },
    amber:  { card: "border-amber-500/20 hover:border-amber-500/40",   icon: "text-amber-400 bg-amber-500/10 border-amber-500/20",   num: "text-amber-300" },
    pink:   { card: "border-pink-500/20 hover:border-pink-500/40",     icon: "text-pink-400 bg-pink-500/10 border-pink-500/20",     num: "text-pink-300" },
    cyan:   { card: "border-cyan-500/20 hover:border-cyan-500/40",     icon: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",     num: "text-cyan-300" },
  };

  return (
    <>
      <Head>
        <title>Live Statistics – TempMail | Email Usage Metrics</title>
        <meta name="description" content="Real-time statistics for TempMail: emails processed today, rolling 24h volume, active inboxes, domain count, and more. Auto-refreshes every 30 seconds." />
        <link rel="canonical" href={pageUrl("/statistics")} />
        <meta property="og:url" content={pageUrl("/statistics")} />
        <meta property="og:title" content="Live Statistics – TempMail" />
        <meta property="og:description" content="Real-time statistics for TempMail: emails processed today, rolling 24h volume, active inboxes, and more." />
        <meta name="twitter:title" content="Live Statistics – TempMail" />
        <meta name="twitter:description" content="Real-time email statistics. Auto-refreshes every 30 seconds." />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: pageUrl("/") },
                { "@type": "ListItem", position: 2, name: "Statistics", item: pageUrl("/statistics") },
              ],
            }),
          }}
        />
      </Head>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header row */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-2xl font-bold">Live Statistics</h1>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold bg-emerald-900/20 text-emerald-400 border border-emerald-700/30 px-2 py-0.5 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                  LIVE
                </span>
              </div>
              <p className="text-[#8b949e] text-sm">Real-time metrics · auto-refreshes every 30s</p>
            </div>
          </div>
          {lastUpdated && (
            <div className="flex-shrink-0 text-right">
              <p className="text-[10px] text-[#484f58] uppercase tracking-wider">Last updated</p>
              <p className="text-xs text-[#8b949e] font-mono">{lastUpdated.toLocaleTimeString()}</p>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[#8b949e] text-sm">Fetching live data…</p>
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {cards.map((card) => {
                const cls = colorCls[card.color];
                return (
                  <div key={card.label} className={`bg-[#161b22] border rounded-2xl p-5 sm:p-6 transition-all duration-300 ${cls.card}`}>
                    <div className="flex items-start justify-between mb-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8b949e]">{card.label}</p>
                      <div className={`w-8 h-8 rounded-xl border flex items-center justify-center flex-shrink-0 ${cls.icon.split(" ").slice(1).join(" ")}`}>
                        <svg className={`w-4 h-4 ${cls.icon.split(" ")[0]}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {card.icon}
                        </svg>
                      </div>
                    </div>
                    <p className={`text-3xl sm:text-4xl font-black mb-1.5 tracking-tight ${cls.num}`}>
                      <AnimatedNumber target={card.value} />
                    </p>
                    <p className="text-xs text-[#484f58]">{card.sub}</p>
                  </div>
                );
              })}
            </div>

            {/* Activity breakdown */}
            {stats && (
              <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-5">
                  <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="font-semibold text-sm">Activity Breakdown</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Emails/hour", value: Math.round(stats.emails_24h / 24).toLocaleString() },
                    { label: "Emails/minute", value: Math.round(stats.emails_24h / 1440).toLocaleString() },
                    { label: "Domain usage", value: `${stats.domain_count > 0 ? ((stats.active_domains / stats.domain_count) * 100).toFixed(1) : 0}%` },
                    { label: "Avg daily vol.", value: stats.today_emails > 0 ? stats.today_emails.toLocaleString() : "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-[#0d1117] rounded-xl border border-[#30363d] p-4">
                      <p className="text-xs text-[#8b949e] mb-1.5">{label}</p>
                      <p className="text-xl font-bold text-white">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Simple visual bar */}
                <div className="mt-5">
                  <div className="flex items-center justify-between text-xs text-[#8b949e] mb-2">
                    <span>Domain active ratio</span>
                    <span className="text-emerald-400 font-semibold">{stats.domain_count > 0 ? ((stats.active_domains / stats.domain_count) * 100).toFixed(1) : 0}%</span>
                  </div>
                  <div className="h-2 bg-[#21262d] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-1000"
                      style={{ width: `${stats.domain_count > 0 ? (stats.active_domains / stats.domain_count) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="mt-5 p-5 bg-gradient-to-r from-violet-900/20 to-indigo-900/20 border border-violet-500/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-white mb-1">Ready to use?</p>
                <p className="text-sm text-[#8b949e]">Generate your own free email address in one click.</p>
              </div>
              <Link href="/" className="flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-semibold transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                Get Free Email
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}
