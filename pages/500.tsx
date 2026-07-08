import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Custom500() {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <>
      <Head>
        <title>500 – Server Error | TempMail</title>
        <meta name="description" content="Internal server error" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="flex items-center justify-center min-h-[80vh] px-4 py-12">
        <div className="text-center w-full max-w-lg">

          {/* Big 500 with glow */}
          <div className="relative mb-10 select-none">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-72 h-72 rounded-full bg-amber-600/8 blur-3xl" />
            </div>
            <div className="relative text-[7rem] sm:text-[9rem] font-black leading-none tracking-tighter">
              <span className="text-[#21262d]">5</span>
              <span className="relative inline-block">
                <span className="text-amber-500 drop-shadow-[0_0_30px_rgba(245,158,11,0.4)]">0</span>
                {/* Spinning circuit ring */}
                <svg className="absolute inset-0 w-full h-full text-amber-400/20 animate-spin"
                  style={{ animationDuration: "8s" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth="0.4" strokeDasharray="4 2" />
                </svg>
              </span>
              <span className="text-[#21262d]">0</span>
            </div>
          </div>

          {/* Status chips row */}
          <div className="flex items-center justify-center gap-2 flex-wrap mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Internal Server Error
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#21262d] border border-[#30363d] text-[#484f58] text-xs font-mono">
              ⏱ {fmt(elapsed)}
            </span>
          </div>

          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-[#161b22] border border-amber-500/20 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-amber-900/20">
            <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">Server Error</h1>
          <p className="text-[#8b949e] text-sm mb-1.5 leading-relaxed max-w-sm mx-auto">
            Something went wrong on our end. The server encountered an unexpected condition.
          </p>
          <p className="text-[#484f58] text-xs font-mono mb-8">Uptime tracker: {fmt(elapsed)}</p>

          {/* Error info card */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden mb-8 text-left">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/50" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/20" />
              </div>
              <span className="text-xs text-[#484f58] font-mono ml-1">response</span>
            </div>
            <div className="p-4 space-y-2">
              {[
                ["Status", "500 Internal Server Error"],
                ["Type", "Server-side exception"],
                ["Action", "Retry or return home"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-[#484f58] w-14 flex-shrink-0">{k}</span>
                  <span className="text-xs text-[#8b949e] font-mono">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white text-sm font-semibold transition-all shadow-lg shadow-amber-900/30"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reload Page
            </button>
            <Link href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-white text-sm font-medium transition-all border border-[#30363d] hover:border-[#484f58]"
            >
              <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Go to Inbox
            </Link>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { href: "/domains", label: "Domains", color: "text-emerald-400",
                svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /> },
              { href: "/statistics", label: "Statistics", color: "text-sky-400",
                svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /> },
              { href: "/docs", label: "API Docs", color: "text-amber-400",
                svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /> },
            ].map((item) => (
              <Link key={item.href} href={item.href}
                className="bg-[#161b22] border border-[#30363d] rounded-xl p-3 hover:border-[#484f58] transition-all group text-center">
                <svg className={`w-5 h-5 ${item.color} mx-auto mb-1.5`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {item.svg}
                </svg>
                <span className="text-xs font-medium text-[#8b949e] group-hover:text-white transition-colors">{item.label}</span>
              </Link>
            ))}
          </div>

        </div>
      </div>
    </>
  );
}
