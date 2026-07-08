import { useState, useEffect } from "react";
import Head from "next/head";
import { pageUrl } from "../lib/seo";
import { API_BASE } from "../lib/config";

interface Domain { domain: string; status: string; mx: string; }

export default function Domains() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/api/domains`);
        const d = await r.json();
        if (d.data?.domains && Array.isArray(d.data.domains)) {
          setDomains(d.data.domains.map((x: any) => ({
            domain: x.domain_name,
            status: x.is_active ? "active" : "inactive",
            mx: x.mx_valid ? "valid" : "invalid",
          })));
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  const filtered = domains.filter((d) => {
    const matchFilter = filter === "all" || d.status === filter;
    const matchSearch = d.domain.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });
  const active = domains.filter((d) => d.status === "active").length;
  const inactive = domains.length - active;

  return (
    <>
      <Head>
        <title>Available Domains – TempMail | 1,200+ Email Domains</title>
        <meta name="description" content={`Browse all ${domains.length || "1,200"}+ available domains for creating temporary email addresses. Filter by active status and search by name.`} />
        <link rel="canonical" href={pageUrl("/domains")} />
        <meta property="og:url" content={pageUrl("/domains")} />
        <meta property="og:title" content="Available Domains – TempMail" />
        <meta property="og:description" content={`Browse ${domains.length || "1,200"}+ domains for temporary email addresses. Filter active domains and create custom addresses instantly.`} />
        <meta name="twitter:title" content="Available Domains – TempMail" />
        <meta name="twitter:description" content={`${domains.length || "1,200"}+ domains available for free temporary email.`} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: pageUrl("/") },
                { "@type": "ListItem", position: 2, name: "Domains", item: pageUrl("/domains") },
              ],
            }),
          }}
        />
      </Head>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Available Domains</h1>
              <p className="text-[#8b949e] text-sm">All domains for creating temporary email addresses</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
          {[
            { label: "Total", value: loading ? "—" : domains.length.toLocaleString(), color: "text-white", bg: "bg-[#161b22]" },
            { label: "Active", value: loading ? "—" : active.toLocaleString(), color: "text-emerald-400", bg: "bg-emerald-900/10 border-emerald-800/30" },
            { label: "Offline", value: loading ? "—" : inactive.toLocaleString(), color: "text-[#8b949e]", bg: "bg-[#161b22]" },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} border border-[#30363d] rounded-2xl p-4 sm:p-5`}>
              <p className="text-xs text-[#8b949e] mb-1.5 uppercase tracking-wider font-medium">{s.label}</p>
              <p className={`text-2xl sm:text-3xl font-black ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <svg className="w-4 h-4 text-[#484f58] absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search domains…"
              className="w-full bg-[#161b22] border border-[#30363d] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#484f58] focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all" />
          </div>
          <div className="flex gap-2">
            {["all", "active", "inactive"].map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium capitalize transition-all border ${
                  filter === f ? "bg-violet-600 border-violet-500 text-white" : "bg-[#161b22] border-[#30363d] text-[#8b949e] hover:text-white hover:border-[#8b949e]"
                }`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden shadow-2xl shadow-black/20">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[#8b949e] text-sm">Loading domains…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#21262d] flex items-center justify-center">
                <svg className="w-8 h-8 text-[#484f58]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-[#8b949e] text-sm">No domains match your filter</p>
            </div>
          ) : (
            <>
              <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-3 border-b border-[#21262d] text-[11px] font-semibold text-[#8b949e] uppercase tracking-wider">
                <div className="col-span-6">Domain</div>
                <div className="col-span-3">Status</div>
                <div className="col-span-3">MX</div>
              </div>
              <div className="divide-y divide-[#21262d]">
                {filtered.map((d) => (
                  <div key={d.domain} className="grid grid-cols-12 gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 items-center hover:bg-[#21262d]/40 transition-colors group">
                    <div className="col-span-9 sm:col-span-6 flex items-center gap-3 min-w-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        d.status === "active" ? "bg-emerald-900/30 border border-emerald-700/30" : "bg-[#21262d] border border-[#30363d]"
                      }`}>
                        <svg className={`w-3.5 h-3.5 ${d.status === "active" ? "text-emerald-400" : "text-[#484f58]"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                      </div>
                      <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden min-w-0">
                        <span className="font-mono text-xs sm:text-sm text-white whitespace-nowrap">@{d.domain}</span>
                      </div>
                    </div>
                    <div className="col-span-3 sm:col-span-3 flex sm:block justify-end">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-full border font-medium ${
                        d.status === "active" ? "bg-emerald-900/20 border-emerald-800/40 text-emerald-400" : "bg-[#21262d] border-[#30363d] text-[#8b949e]"
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${d.status === "active" ? "bg-emerald-400" : "bg-[#484f58]"}`}></div>
                        {d.status}
                      </span>
                    </div>
                    <div className="hidden sm:block col-span-3">
                      <span className={`text-xs font-medium ${d.mx === "valid" ? "text-emerald-400" : "text-red-400"}`}>
                        {d.mx === "valid" ? "✓ valid" : "✗ invalid"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 border-t border-[#21262d] text-xs text-[#484f58]">
                Showing {filtered.length} of {domains.length} domains
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
