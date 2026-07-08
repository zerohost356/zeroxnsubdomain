import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Head from "next/head";

const navItems = [
  {
    href: "/",
    label: "Inbox",
    desc: "Generate & receive temp emails",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    ),
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
  },
  {
    href: "/domains",
    label: "Domains",
    desc: "Browse 1,250+ available domains",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    ),
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    href: "/statistics",
    label: "Statistics",
    desc: "Live usage metrics & counters",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    ),
    color: "text-sky-400",
    bg: "bg-sky-500/10 border-sky-500/20",
  },
  {
    href: "/docs",
    label: "API Docs",
    desc: "Interactive API documentation",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    ),
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  {
    href: "/password",
    label: "Password",
    desc: "Generate secure random passwords",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    ),
    color: "text-pink-400",
    bg: "bg-pink-500/10 border-pink-500/20",
  },
  {
    href: "/stock",
    label: "BF Stock",
    desc: "Blox Fruits live stock tracker",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    ),
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/20",
  },
];

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export default function Layout({ children, title, description }: LayoutProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [router.pathname]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const current = router.pathname;

  return (
    <>
      {(title || description) && (
        <Head>
          {title && <title>{title}</title>}
          {description && <meta name="description" content={description} />}
          {title && <meta property="og:title" content={title} />}
          {description && <meta property="og:description" content={description} />}
        </Head>
      )}

      {/* Fixed header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0d1117]/90 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25 group-hover:shadow-violet-500/40 transition-shadow">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-base tracking-tight text-white">TempMail</span>
              <span className="text-[10px] text-[#8b949e] hidden sm:block">Free disposable email</span>
            </div>
          </Link>

          {/* Page indicator (center, hidden on small) */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  current === item.href
                    ? "bg-white/8 text-white"
                    : "text-[#8b949e] hover:text-white hover:bg-white/5"
                }`}>
                {item.label}
              </Link>
            ))}
          </div>

          {/* Hamburger button */}
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
              aria-expanded={open}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 hover:border-white/15 flex flex-col items-center justify-center gap-[5px] transition-all duration-200 group"
            >
              {/* Bar 1 */}
              <span className="block w-[18px] h-[1.5px] bg-white rounded-full transition-all duration-300 origin-center"
                style={{ transform: open ? "translateY(6.5px) rotate(45deg)" : "none" }} />
              {/* Bar 2 */}
              <span className="block h-[1.5px] bg-white rounded-full transition-all duration-300"
                style={{ width: open ? "0px" : "14px", opacity: open ? 0 : 1 }} />
              {/* Bar 3 */}
              <span className="block w-[18px] h-[1.5px] bg-white rounded-full transition-all duration-300 origin-center"
                style={{ transform: open ? "translateY(-6.5px) rotate(-45deg)" : "none" }} />
            </button>

            {/* Dropdown */}
            <div className={`absolute right-0 top-[calc(100%+8px)] w-72 transition-all duration-200 origin-top-right ${
              open ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
            }`}>
              <div className="bg-[#161b22]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
                <div className="p-2">
                  {navItems.map((item) => {
                    const isActive = current === item.href;
                    return (
                      <Link key={item.href} href={item.href}
                        className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all group ${
                          isActive ? "bg-white/8" : "hover:bg-white/5"
                        }`}>
                        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 ${item.bg}`}>
                          <svg className={`w-4 h-4 ${item.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {item.icon}
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-medium ${isActive ? "text-white" : "text-[#c9d1d9] group-hover:text-white transition-colors"}`}>
                              {item.label}
                            </span>
                            {isActive && (
                              <span className="w-1.5 h-1.5 rounded-full bg-violet-400"></span>
                            )}
                          </div>
                          <span className="text-xs text-[#8b949e] truncate block">{item.desc}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
                <div className="border-t border-white/6 px-4 py-3 flex items-center justify-between">
                  <span className="text-xs text-[#484f58]">© 2026 TempMail</span>
                  <span className="text-xs text-[#484f58]">v2.0</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile backdrop */}
        {open && (
          <div className="fixed inset-0 top-14 bg-black/60 backdrop-blur-sm md:hidden -z-10" onClick={() => setOpen(false)} />
        )}
      </header>

      {/* Content with fixed header offset */}
      <div className="pt-14 min-h-screen bg-[#0d1117] text-white">
        {children}
      </div>
    </>
  );
}
