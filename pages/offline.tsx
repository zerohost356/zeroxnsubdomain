import Head from "next/head";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { API_BASE } from "../lib/config";

export default function Offline() {
  const [online, setOnline] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [dots, setDots] = useState("");
  const [countdown, setCountdown] = useState(10);

  const tryReconnect = useCallback(async () => {
    if (retrying) return;
    setRetrying(true);
    setAttempts((n) => n + 1);
    try {
      const r = await fetch(`${API_BASE}/api/stats`, { cache: "no-store", signal: AbortSignal.timeout(5000) });
      if (r.ok) {
        setOnline(true);
        setTimeout(() => window.location.replace("/"), 800);
      }
    } catch {}
    setRetrying(false);
    setCountdown(10);
  }, [retrying]);

  useEffect(() => {
    const onOnline = () => tryReconnect();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [tryReconnect]);

  useEffect(() => {
    if (online) return;
    const t = setInterval(() => {
      setCountdown((n) => {
        if (n <= 1) { tryReconnect(); return 10; }
        return n - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [online, tryReconnect]);

  useEffect(() => {
    const t = setInterval(() => setDots((d) => (d.length >= 3 ? "" : d + ".")), 420);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <Head>
        <title>No Connection | TempMail</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="flex items-center justify-center min-h-[90vh] px-4 py-12">
        <div className="w-full max-w-sm text-center">

          {/* Animated icon cluster */}
          <div className="relative flex items-center justify-center mb-10 select-none">
            {/* Outer ripples */}
            <span className="absolute w-48 h-48 rounded-full border border-slate-700/40 animate-ping"
              style={{ animationDuration: "2.4s" }} />
            <span className="absolute w-36 h-36 rounded-full border border-slate-600/50 animate-ping"
              style={{ animationDuration: "1.8s", animationDelay: "0.3s" }} />
            <span className="absolute w-52 h-52 rounded-full bg-slate-800/20 blur-2xl" />

            {/* Core icon */}
            <div className={`relative z-10 w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl transition-all duration-500 ${
              online
                ? "bg-emerald-500/15 border border-emerald-500/40 shadow-emerald-900/30"
                : "bg-[#161b22] border border-slate-600/40 shadow-black/40"
            }`}>
              {online ? (
                <svg className="w-11 h-11 text-emerald-400 animate-bounce" style={{ animationDuration: "0.6s" }}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-11 h-11 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M18.364 5.636a9 9 0 010 12.728M5.636 5.636a9 9 0 000 12.728M12 12h.01" />
                  <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
                </svg>
              )}
            </div>
          </div>

          {/* Status badge */}
          <div className="flex justify-center mb-5">
            {online ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Connected — redirecting…
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-xs font-mono font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse" />
                No Internet Connection
              </span>
            )}
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-bold text-white mb-2">
            {online ? "Back online!" : "You're offline"}
          </h1>
          <p className="text-[#8b949e] text-sm mb-1.5 leading-relaxed">
            {online
              ? "Connection restored. Taking you back to the app…"
              : "Check your Wi-Fi or mobile data and we'll reconnect automatically."}
          </p>
          {!online && (
            <p className="text-[#484f58] text-xs font-mono mb-8">
              Retrying in <span className="text-slate-400">{countdown}s</span>
              {attempts > 0 && <> · <span className="text-slate-500">{attempts} attempt{attempts > 1 ? "s" : ""}</span></>}
              {dots}
            </p>
          )}

          {/* Signal bars animation */}
          {!online && (
            <div className="flex items-end justify-center gap-1 mb-8 h-8">
              {[4, 7, 10, 13, 16].map((h, i) => (
                <div
                  key={i}
                  className="w-2.5 rounded-sm bg-slate-700 relative overflow-hidden"
                  style={{ height: `${h}px` }}
                >
                  <div
                    className="absolute inset-0 bg-violet-500 origin-bottom"
                    style={{
                      animation: `barPulse 1.6s ease-in-out infinite`,
                      animationDelay: `${i * 0.15}s`,
                      transform: "scaleY(0)",
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Action buttons */}
          {!online && (
            <div className="flex flex-col gap-3 mb-8">
              <button
                onClick={tryReconnect}
                disabled={retrying}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 active:bg-violet-700 disabled:opacity-60 text-white text-sm font-semibold transition-all shadow-lg shadow-violet-900/30"
              >
                <svg
                  className={`w-4 h-4 ${retrying ? "animate-spin" : ""}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {retrying ? "Checking connection…" : "Retry Now"}
              </button>
              <Link href="/"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-white text-sm font-medium transition-all border border-[#30363d] hover:border-[#484f58]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Try going to Inbox
              </Link>
            </div>
          )}

          {/* Tips */}
          {!online && (
            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 text-left space-y-2.5">
              <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-widest mb-3">Troubleshooting</p>
              {[
                ["Check Wi-Fi", "Make sure you're connected to a network"],
                ["Mobile data", "Toggle airplane mode off and back on"],
                ["Router", "Try restarting your router or modem"],
              ].map(([title, desc]) => (
                <div key={title} className="flex items-start gap-3">
                  <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-violet-500/50 flex-shrink-0" />
                  <div>
                    <span className="text-xs font-medium text-[#8b949e]">{title} — </span>
                    <span className="text-xs text-[#484f58]">{desc}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

    </>
  );
}
