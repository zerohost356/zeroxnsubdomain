import { useState, useEffect, useCallback, useRef } from "react";
import Layout from "../components/Layout";
import { API_BASE } from "../lib/config";

interface Fruit {
  name: string;
  price_beli: number;
  price_robux: number;
  type: string;
  image_url: string;
}

interface StockData {
  normal_stock: Fruit[];
  mirage_stock: Fruit[];
}

interface StockResponse {
  success: boolean;
  data: StockData;
  meta: { fetched_at: string | null };
  error?: string;
}

const NORMAL_INTERVAL_MS = 4 * 60 * 60 * 1000;
const MIRAGE_INTERVAL_MS = 2 * 60 * 60 * 1000;

function calcTimer(intervalMs: number): string {
  const remainingMs = intervalMs - (Date.now() % intervalMs);
  const s = Math.floor(remainingMs / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function useClientTimers() {
  const [normal, setNormal] = useState(() => calcTimer(NORMAL_INTERVAL_MS));
  const [mirage, setMirage] = useState(() => calcTimer(MIRAGE_INTERVAL_MS));

  useEffect(() => {
    const tick = () => {
      setNormal(calcTimer(NORMAL_INTERVAL_MS));
      setMirage(calcTimer(MIRAGE_INTERVAL_MS));
    };
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return { normal, mirage };
}

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; glow: string }> = {
  Mythical:  { label: "Mythical",  color: "#fbbf24", bg: "rgba(251,191,36,0.1)",   border: "rgba(251,191,36,0.3)",   glow: "rgba(251,191,36,0.22)" },
  Legendary: { label: "Legendary", color: "#c084fc", bg: "rgba(192,132,252,0.1)",  border: "rgba(192,132,252,0.3)",  glow: "rgba(192,132,252,0.22)" },
  Rare:      { label: "Rare",      color: "#38bdf8", bg: "rgba(56,189,248,0.1)",   border: "rgba(56,189,248,0.3)",   glow: "rgba(56,189,248,0.22)" },
  Uncommon:  { label: "Uncommon",  color: "#4ade80", bg: "rgba(74,222,128,0.1)",   border: "rgba(74,222,128,0.25)",  glow: "rgba(74,222,128,0.18)" },
  Natural:   { label: "Natural",   color: "#86efac", bg: "rgba(134,239,172,0.08)", border: "rgba(134,239,172,0.22)", glow: "rgba(134,239,172,0.15)" },
  Elemental: { label: "Elemental", color: "#7dd3fc", bg: "rgba(125,211,252,0.08)", border: "rgba(125,211,252,0.22)", glow: "rgba(125,211,252,0.15)" },
  Beast:     { label: "Beast",     color: "#fb923c", bg: "rgba(251,146,60,0.1)",   border: "rgba(251,146,60,0.28)",  glow: "rgba(251,146,60,0.2)" },
  Common:    { label: "Common",    color: "#94a3b8", bg: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.2)",  glow: "rgba(148,163,184,0.1)" },
};

const getTypeConfig = (t: string) =>
  TYPE_CONFIG[t] ?? { label: t, color: "#94a3b8", bg: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.2)", glow: "rgba(148,163,184,0.1)" };

function formatBeli(n: number) {
  if (!n) return "N/A";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

function AnimatedCounter({ target }: { target: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    let start = 0;
    const step = Math.ceil(target / 20);
    const t = setInterval(() => {
      start = Math.min(start + step, target);
      setVal(start);
      if (start >= target) clearInterval(t);
    }, 30);
    return () => clearInterval(t);
  }, [target]);
  return <>{val}</>;
}

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add("visible"); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function CountdownTimer({ value, label, accent }: { value: string; label: string; accent: string }) {
  const parts = value.split(":");
  const h = (parts[0] || "0").padStart(2, "0");
  const m = parts[1] || "00";
  const s = parts[2] || "00";
  const prevRef = useRef({ h, m, s });
  const [ticks, setTicks] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    const prev = prevRef.current;
    setTicks(t => ({
      h: prev.h !== h ? t.h + 1 : t.h,
      m: prev.m !== m ? t.m + 1 : t.m,
      s: prev.s !== s ? t.s + 1 : t.s,
    }));
    prevRef.current = { h, m, s };
  }, [h, m, s]);

  const Digit = ({ val, tick }: { val: string; tick: number }) => (
    <span key={tick} className="px-1.5 py-0.5 rounded-lg text-xs font-black digit-tick"
      style={{ background: `${accent}18`, border: `1px solid ${accent}30`, color: accent, display: "inline-block" }}>
      {val}
    </span>
  );

  return (
    <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <svg className="w-3.5 h-3.5 flex-shrink-0 animate-spin-slow" style={{ color: accent }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="text-[11px] text-[#4a6080] font-medium">{label}</span>
      <div className="flex items-center gap-1">
        <Digit val={h} tick={ticks.h} />
        <span className="text-[#3a5068] text-xs font-bold">:</span>
        <Digit val={m} tick={ticks.m} />
        <span className="text-[#3a5068] text-xs font-bold">:</span>
        <Digit val={s} tick={ticks.s} />
      </div>
    </div>
  );
}

function FruitCard({ fruit, index }: { fruit: Fruit; index: number }) {
  const [imgErr, setImgErr] = useState(false);
  const [hovered, setHovered] = useState(false);
  const cfg = getTypeConfig(fruit.type);
  const delay = Math.min(index * 60, 600);

  return (
    <div
      className="animate-fade-up fruit-card"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="relative rounded-2xl overflow-hidden h-full"
        style={{
          background: "rgba(14,20,32,0.8)",
          border: `1px solid ${hovered ? cfg.border : "rgba(255,255,255,0.07)"}`,
          boxShadow: hovered ? `0 12px 40px ${cfg.glow}, 0 0 0 1px ${cfg.border}` : "0 2px 8px rgba(0,0,0,0.3)",
          transition: "border-color 0.3s ease, box-shadow 0.3s ease",
        }}
      >
        <div className="relative flex items-center justify-center overflow-hidden"
          style={{
            height: 140,
            background: hovered
              ? `radial-gradient(ellipse at center, ${cfg.glow} 0%, rgba(8,12,20,0.95) 70%)`
              : "rgba(8,12,20,0.6)",
            transition: "background 0.4s ease",
          }}>
          {!imgErr && fruit.image_url ? (
            <img
              src={fruit.image_url}
              alt={fruit.name}
              style={{
                width: 110, height: 110,
                objectFit: "contain",
                filter: hovered ? `drop-shadow(0 6px 20px ${cfg.glow})` : "drop-shadow(0 2px 4px rgba(0,0,0,0.4))",
                transform: hovered ? "scale(1.1) translateY(-2px)" : "scale(1)",
                transition: "transform 0.4s cubic-bezier(0.34,1.56,0.64,1), filter 0.4s ease",
              }}
              onError={() => setImgErr(true)}
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{ background: "rgba(255,255,255,0.05)" }}>🍎</div>
          )}
          <span className="absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{
              color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
              boxShadow: hovered ? `0 0 12px ${cfg.glow}` : "none",
              transition: "box-shadow 0.3s ease",
            }}>
            {cfg.label}
          </span>
        </div>

        <div className="px-3.5 py-3"
          style={{ borderTop: `1px solid ${hovered ? cfg.border : "rgba(255,255,255,0.06)"}`, transition: "border-color 0.3s ease" }}>
          <p className="font-bold text-white text-sm mb-2.5 truncate">{fruit.name}</p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold tracking-widest uppercase text-[#3a5068]">Beli</span>
              <span className="text-xs font-bold font-mono" style={{ color: "#fbbf24" }}>{formatBeli(fruit.price_beli)}</span>
            </div>
            {fruit.price_robux > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold tracking-widest uppercase text-[#3a5068]">Robux</span>
                <span className="text-xs font-bold font-mono text-emerald-400">{fruit.price_robux.toLocaleString()} R$</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard({ index }: { index: number }) {
  return (
    <div className="animate-fade-in-scale rounded-2xl overflow-hidden"
      style={{ animationDelay: `${index * 50}ms`, background: "rgba(14,20,32,0.8)", border: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="h-[140px] animate-shimmer" style={{ background: "rgba(20,30,48,0.9)" }} />
      <div className="p-3.5 space-y-2.5" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="h-3 w-3/4 rounded-lg" style={{ background: "rgba(30,42,58,0.8)" }} />
        <div className="h-2.5 w-1/2 rounded-lg" style={{ background: "rgba(30,42,58,0.5)" }} />
        <div className="h-2.5 w-2/5 rounded-lg" style={{ background: "rgba(30,42,58,0.4)" }} />
      </div>
    </div>
  );
}

function StockSection({
  title, subtitle, fruits, timer, timerAccent, gradientFrom, gradientTo, emoji, sectionDelay,
}: {
  title: string; subtitle: string; fruits: Fruit[];
  timer: string; timerAccent: string;
  gradientFrom: string; gradientTo: string; emoji: string;
  sectionDelay: number;
}) {
  const revealRef = useReveal();

  return (
    <div ref={revealRef} className="reveal">
      <div className="rounded-3xl overflow-hidden transition-all duration-300"
        style={{
          background: "rgba(10,15,24,0.75)",
          border: "1px solid rgba(255,255,255,0.07)",
          backdropFilter: "blur(12px)",
          boxShadow: `0 0 60px ${gradientFrom}06`,
        }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-3 animate-slide-in-left" style={{ animationDelay: `${sectionDelay}ms` }}>
            <div className="relative w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 animate-float"
              style={{
                background: `linear-gradient(135deg, ${gradientFrom}20, ${gradientTo}15)`,
                border: `1px solid ${gradientFrom}30`,
                boxShadow: `0 0 20px ${gradientFrom}15`,
              }}>
              {emoji}
            </div>
            <div>
              <h2 className="font-black text-base leading-tight"
                style={{
                  background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>
                {title}
              </h2>
              <p className="text-[11px] text-[#4a6080] font-medium">{subtitle}</p>
            </div>
            <span className="ml-1 text-xs font-bold px-2.5 py-1 rounded-full animate-pop-in"
              style={{
                animationDelay: `${sectionDelay + 100}ms`,
                background: `${gradientFrom}12`, color: gradientFrom, border: `1px solid ${gradientFrom}25`
              }}>
              {fruits.length}
            </span>
          </div>
          <div className="animate-slide-in-right" style={{ animationDelay: `${sectionDelay + 80}ms` }}>
            <CountdownTimer value={timer} label="Resets in" accent={timerAccent} />
          </div>
        </div>

        {fruits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl animate-float"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              🍃
            </div>
            <p className="text-[#3a5068] text-sm">No stock data available</p>
          </div>
        ) : (
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {fruits.map((fruit, i) => (
              <FruitCard key={fruit.name} fruit={fruit} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatBadge({ label, value, color, delay }: { label: string; value: number; color: string; delay: number }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-xl animate-pop-in"
      style={{
        animationDelay: `${delay}ms`,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}>
      <span className="text-xl font-black count-pop" style={{ color }}>
        <AnimatedCounter target={value} />
      </span>
      <span className="text-xs text-[#4a6080] font-medium">{label}</span>
    </div>
  );
}

function LiveClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="font-mono tabular-nums">{time}</span>;
}

function Particles() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {[
        { left: "12%",  top: "20%", size: 3, dur: "8s",  del: "0s",   color: "rgba(249,115,22,0.5)" },
        { left: "85%",  top: "15%", size: 2, dur: "11s", del: "2s",   color: "rgba(251,191,36,0.4)" },
        { left: "40%",  top: "60%", size: 2, dur: "9s",  del: "4s",   color: "rgba(167,139,250,0.4)" },
        { left: "70%",  top: "75%", size: 3, dur: "13s", del: "1s",   color: "rgba(56,189,248,0.35)" },
        { left: "25%",  top: "80%", size: 2, dur: "10s", del: "3s",   color: "rgba(249,115,22,0.3)" },
        { left: "60%",  top: "35%", size: 2, dur: "12s", del: "5s",   color: "rgba(251,191,36,0.3)" },
        { left: "90%",  top: "55%", size: 2, dur: "7s",  del: "0.5s", color: "rgba(167,139,250,0.35)" },
        { left: "5%",   top: "45%", size: 3, dur: "14s", del: "2.5s", color: "rgba(56,189,248,0.3)" },
      ].map((p, i) => (
        <div key={i} style={{
          position: "absolute",
          left: p.left, top: p.top,
          width: p.size, height: p.size,
          borderRadius: "50%",
          background: p.color,
          animation: `particle ${p.dur} ease-in-out ${p.del} infinite`,
          boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
        }} />
      ))}
    </div>
  );
}

export default function StockPage() {
  const [stock, setStock] = useState<StockData | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { normal: normalTimer, mirage: mirageTimer } = useClientTimers();

  const fetchData = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/api/stock`);
      const data: StockResponse = await r.json();
      if (data.success) {
        setStock(data.data);
        setFetchedAt(data.meta.fetched_at);
        setError(null);
      } else {
        setError(data.error || "Failed to load stock");
      }
    } catch {
      setError("Network error — check your connection");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, 60_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchData]);

  const totalFruits = (stock?.normal_stock.length ?? 0) + (stock?.mirage_stock.length ?? 0);

  return (
    <Layout
      title="Blox Fruits Stock – Live Fruit Tracker"
      description="Check the current Blox Fruits stock in real time. Normal & Mirage island fruits with live reset timers."
    >
      <Particles />

      <div className="fixed inset-0 pointer-events-none z-0" style={{
        background: "radial-gradient(ellipse 80% 50% at 80% -10%, rgba(249,115,22,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 10% 90%, rgba(167,139,250,0.07) 0%, transparent 60%)",
      }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-10">

        {/* Hero */}
        <div className="text-center mb-10 relative">
          <div className="absolute inset-0 -top-16 pointer-events-none" style={{
            background: "radial-gradient(ellipse 60% 60% at 50% 0%, rgba(249,115,22,0.13) 0%, transparent 70%)",
          }} />
          <div className="relative">
            {/* Live badge with real clock */}
            <div className="inline-flex items-center gap-2.5 mb-5 px-4 py-2 rounded-full text-xs font-semibold animate-fade-up delay-0"
              style={{
                background: "rgba(249,115,22,0.08)",
                border: "1px solid rgba(249,115,22,0.2)",
                color: "#fb923c",
              }}>
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse flex-shrink-0" />
              Live Tracker
              <span className="text-[#4a6080] font-normal">·</span>
              <LiveClock />
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter mb-4 leading-none animate-fade-up delay-100">
              <span className="block text-white">Blox Fruits</span>
              <span className="block text-gradient-orange">Stock Tracker</span>
            </h1>

            <p className="text-[#4a6080] text-base sm:text-lg max-w-lg mx-auto font-medium leading-relaxed animate-fade-up delay-200">
              Real-time fruit stock for Normal & Mirage islands.<br />
              Prices in Beli and Robux with live reset timers.
            </p>

            {!loading && totalFruits > 0 && (
              <div className="flex items-center justify-center gap-4 mt-6 flex-wrap">
                <StatBadge label="Normal Stock" value={stock?.normal_stock.length ?? 0} color="#38bdf8" delay={350} />
                <StatBadge label="Mirage Stock" value={stock?.mirage_stock.length ?? 0} color="#a78bfa" delay={430} />
                <StatBadge label="Total Fruits"  value={totalFruits}                     color="#fb923c" delay={510} />
              </div>
            )}
          </div>
        </div>

        {/* Source info bar */}
        {fetchedAt && !loading && (
          <div className="flex items-center justify-center mb-6 animate-fade-up delay-300">
            <span className="text-xs text-[#2d3f52] font-mono">
              Data fetched at {new Date(fetchedAt).toLocaleTimeString()} · auto-updates every 60s
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-medium animate-fade-up"
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.25)",
              color: "#f87171",
            }}>
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* Skeleton */}
        {loading && (
          <div className="space-y-6 animate-fade-up delay-200">
            {[6, 4].map((count, i) => (
              <div key={i} className="rounded-3xl overflow-hidden"
                style={{ background: "rgba(10,15,24,0.7)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center justify-between px-5 py-4"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl animate-shimmer" style={{ background: "rgba(20,30,48,0.9)" }} />
                    <div className="space-y-1.5">
                      <div className="h-4 w-32 rounded-lg animate-shimmer" style={{ background: "rgba(20,30,48,0.9)" }} />
                      <div className="h-2.5 w-24 rounded-lg" style={{ background: "rgba(30,42,58,0.5)" }} />
                    </div>
                  </div>
                  <div className="h-9 w-40 rounded-2xl animate-shimmer" style={{ background: "rgba(20,30,48,0.7)" }} />
                </div>
                <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {Array.from({ length: count }).map((_, j) => <SkeletonCard key={j} index={j} />)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stock sections */}
        {!loading && stock && (
          <div className="space-y-6">
            <StockSection
              title="Normal Stock"
              subtitle="Available on the main island"
              fruits={stock.normal_stock}
              timer={normalTimer}
              timerAccent="#38bdf8"
              gradientFrom="#38bdf8"
              gradientTo="#818cf8"
              emoji="🌊"
              sectionDelay={0}
            />
            <StockSection
              title="Mirage Stock"
              subtitle="Exclusive Mirage island fruits"
              fruits={stock.mirage_stock}
              timer={mirageTimer}
              timerAccent="#a78bfa"
              gradientFrom="#a78bfa"
              gradientTo="#c084fc"
              emoji="✨"
              sectionDelay={100}
            />
          </div>
        )}
      </div>

      <div className="relative z-10 text-center py-6 mt-4"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <p className="text-xs text-[#2d3f52]">Data via FruityBlox · Not affiliated with Roblox or Blox Fruits</p>
      </div>
    </Layout>
  );
}
