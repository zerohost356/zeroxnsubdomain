import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Custom404() {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const t = setInterval(() => setDots((d) => (d.length >= 3 ? "" : d + ".")), 500);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <Head>
        <title>404 – Page Not Found | TempMail</title>
        <meta name="description" content="Page not found" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="flex items-center justify-center min-h-[80vh] px-4">
        <div className="text-center max-w-md w-full">
          {/* Glowing 404 */}
          <div className="relative mb-10 select-none">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-64 rounded-full bg-violet-600/8 blur-3xl"></div>
            </div>
            <div className="relative text-[7rem] sm:text-[9rem] font-black leading-none tracking-tighter">
              <span className="text-[#21262d]">4</span>
              <span className="relative inline-block">
                <span className="text-violet-500">0</span>
                <svg className="absolute inset-0 w-full h-full text-violet-400/15 animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </span>
              <span className="text-[#21262d]">4</span>
            </div>
          </div>

          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-[#161b22] border border-[#30363d] flex items-center justify-center mx-auto mb-6 animate-float">
            <svg className="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">Page not found</h1>
          <p className="text-[#8b949e] text-sm mb-1.5 leading-relaxed">
            The page you{"'"}re looking for doesn{"'"}t exist or has been moved.
          </p>
          <p className="text-[#484f58] text-xs font-mono mb-8">Searching{dots}</p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <Link href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-semibold transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Go to Inbox
            </Link>
            <Link href="/domains"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-sm font-medium transition-all border border-[#30363d]">
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              Browse Domains
            </Link>
          </div>

          {/* Quick links grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: "/statistics", label: "Statistics", desc: "Live service metrics", icon: "text-sky-400", svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /> },
              { href: "/docs", label: "API Docs", desc: "Interactive API reference", icon: "text-amber-400", svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /> },
            ].map((item) => (
              <Link key={item.href} href={item.href}
                className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 hover:border-[#8b949e] transition-all text-left group">
                <div className="flex items-center gap-2 mb-2">
                  <svg className={`w-4 h-4 ${item.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">{item.svg}</svg>
                  <span className="text-sm font-medium text-white group-hover:text-violet-300 transition-colors">{item.label}</span>
                </div>
                <p className="text-xs text-[#8b949e]">{item.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
