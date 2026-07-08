import { useState, useEffect } from "react";
import Layout from "../components/Layout";

const PRESETS = [
  {
    label: "Simple (Letters + Numbers)",
    config: { length: 12, upper: true, lower: true, numbers: true, symbols: false },
  },
  {
    label: "Strong (All Characters)",
    config: { length: 16, upper: true, lower: true, numbers: true, symbols: true },
  },
  {
    label: "Ultra Secure",
    config: { length: 24, upper: true, lower: true, numbers: true, symbols: true },
  },
  {
    label: "6-Digit PIN",
    config: { length: 6, upper: false, lower: false, numbers: true, symbols: false },
  },
];

const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const NUMS = "0123456789";
const SYMS = "!@#$%^&*()_+-=[]{}|;:,.<>?";

function generatePassword(opts: {
  length: number;
  upper: boolean;
  lower: boolean;
  numbers: boolean;
  symbols: boolean;
}): string {
  let chars = "";
  const required: string[] = [];

  if (opts.upper) { chars += UPPER; required.push(UPPER[Math.floor(Math.random() * UPPER.length)]); }
  if (opts.lower) { chars += LOWER; required.push(LOWER[Math.floor(Math.random() * LOWER.length)]); }
  if (opts.numbers) { chars += NUMS; required.push(NUMS[Math.floor(Math.random() * NUMS.length)]); }
  if (opts.symbols) { chars += SYMS; required.push(SYMS[Math.floor(Math.random() * SYMS.length)]); }

  if (!chars) return "";

  const rest = Array.from({ length: Math.max(0, opts.length - required.length) }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  );

  const all = [...required, ...rest];
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all.join("").slice(0, opts.length);
}

function calcStrength(password: string, opts: { upper: boolean; lower: boolean; numbers: boolean; symbols: boolean }): { label: string; pct: number; color: string } {
  if (!password) return { label: "None", pct: 0, color: "#30363d" };
  let score = 0;
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 15;
  if (password.length >= 16) score += 10;
  if (password.length >= 24) score += 10;
  if (opts.upper) score += 10;
  if (opts.lower) score += 10;
  if (opts.numbers) score += 10;
  if (opts.symbols) score += 15;
  score = Math.min(100, score);

  if (score < 30) return { label: "Weak", pct: score, color: "#f85149" };
  if (score < 55) return { label: "Fair", pct: score, color: "#e3b341" };
  if (score < 80) return { label: "Good", pct: score, color: "#3fb950" };
  return { label: "Strong", pct: score, color: "#3fb950" };
}

export default function PasswordPage() {
  const [length, setLength] = useState(12);
  const [upper, setUpper] = useState(true);
  const [lower, setLower] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(false);
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [activePreset, setActivePreset] = useState(0);

  const opts = { length, upper, lower, numbers, symbols };
  const strength = calcStrength(password, opts);
  const hasAny = upper || lower || numbers || symbols;

  const generate = (o: typeof opts) => {
    const pw = generatePassword(o);
    setPassword(pw);
  };

  useEffect(() => {
    generate({ length: 12, upper: true, lower: true, numbers: true, symbols: false });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyPreset = (i: number) => {
    const p = PRESETS[i];
    setActivePreset(i);
    setLength(p.config.length);
    setUpper(p.config.upper);
    setLower(p.config.lower);
    setNumbers(p.config.numbers);
    setSymbols(p.config.symbols);
    generate(p.config);
  };

  const handleCheckbox = (
    setter: React.Dispatch<React.SetStateAction<boolean>>,
    current: boolean,
    field: keyof typeof opts
  ) => {
    const next = !current;
    setter(next);
    setActivePreset(-1);
    generate({ ...opts, [field]: next });
  };

  const handleLengthChange = (val: number) => {
    setLength(val);
    setActivePreset(-1);
    generate({ ...opts, length: val });
  };

  const handleCopy = () => {
    if (!password) return;
    navigator.clipboard.writeText(password).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Layout
      title="Password Generator — TempMail"
      description="Generate secure random passwords instantly. Free, private, no account needed."
    >
      <div className="max-w-xl mx-auto px-4 py-8">

        {/* Page header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">Generate Password</h1>
            <p className="text-xs text-[#8b949e]">Secure & private</p>
          </div>
        </div>

        {/* Generated password display */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 mb-4">
          <p className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wider mb-2">Generated Password</p>
          <div className="flex items-center gap-3">
            <span className="flex-1 font-mono text-base text-white break-all leading-snug">
              {password || <span className="text-[#484f58]">—</span>}
            </span>
            <button
              onClick={handleCopy}
              disabled={!password}
              className={`flex-shrink-0 w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
                copied
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                  : "bg-[#21262d] border-[#30363d] text-[#8b949e] hover:text-white hover:border-[#484f58]"
              } disabled:opacity-30`}
              title="Copy"
            >
              {copied ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>

          {/* Strength bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-[#8b949e]">
                Strength: <span className="font-semibold" style={{ color: strength.color }}>{strength.label}</span>
              </span>
              <span className="text-xs font-mono" style={{ color: strength.color }}>{strength.pct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-[#21262d] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${strength.pct}%`, backgroundColor: strength.color }}
              />
            </div>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 mb-4">
          <p className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wider mb-3">Quick Presets</p>
          <div className="space-y-2">
            {PRESETS.map((preset, i) => (
              <button
                key={i}
                onClick={() => applyPreset(i)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left ${
                  activePreset === i
                    ? "bg-violet-600/15 border-violet-500/50 text-violet-300"
                    : "bg-[#0d1117] border-[#30363d] text-[#c9d1d9] hover:border-[#484f58] hover:text-white"
                }`}
              >
                <span>{preset.label}</span>
                {activePreset === i && (
                  <svg className="w-4 h-4 text-violet-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Options */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 mb-4">
          <p className="text-[10px] font-semibold text-[#8b949e] uppercase tracking-wider mb-4">Custom Options</p>

          {/* Length slider */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#c9d1d9]">Length</span>
              <span className="text-sm font-mono font-semibold text-white bg-[#0d1117] border border-[#30363d] px-2.5 py-0.5 rounded-lg">{length}</span>
            </div>
            <input
              type="range"
              min={4}
              max={64}
              value={length}
              onChange={(e) => handleLengthChange(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #7c3aed ${((length - 4) / 60) * 100}%, #21262d ${((length - 4) / 60) * 100}%)`,
              }}
            />
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-[#484f58]">4</span>
              <span className="text-[10px] text-[#484f58]">64</span>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            {[
              { label: "Uppercase (A-Z)", value: upper, setter: setUpper, field: "upper" as const },
              { label: "Lowercase (a-z)", value: lower, setter: setLower, field: "lower" as const },
              { label: "Numbers (0-9)", value: numbers, setter: setNumbers, field: "numbers" as const },
              { label: "Symbols (!@#$...)", value: symbols, setter: setSymbols, field: "symbols" as const },
            ].map(({ label, value, setter, field }) => (
              <label key={label} className="flex items-center gap-3 cursor-pointer group">
                <div
                  onClick={() => handleCheckbox(setter, value, field)}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    value
                      ? "bg-violet-600 border-violet-600"
                      : "bg-[#0d1117] border-[#30363d] group-hover:border-[#484f58]"
                  }`}
                >
                  {value && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span
                  onClick={() => handleCheckbox(setter, value, field)}
                  className="text-sm text-[#c9d1d9] group-hover:text-white transition-colors select-none"
                >
                  {label}
                </span>
              </label>
            ))}
          </div>

          {!hasAny && (
            <p className="mt-3 text-xs text-[#f85149] flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Select at least one character type
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => generate(opts)}
            disabled={!hasAny}
            className="w-full py-3.5 rounded-2xl bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] hover:border-[#484f58] text-sm font-semibold text-white transition-all disabled:opacity-30 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Generate New
          </button>

          <button
            onClick={handleCopy}
            disabled={!password}
            className="w-full py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-500 text-sm font-bold text-white transition-all disabled:opacity-30 active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Password
              </>
            )}
          </button>
        </div>

      </div>

      <style jsx>{`
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #7c3aed;
          cursor: pointer;
          border: 2px solid #161b22;
          box-shadow: 0 0 0 2px #7c3aed40;
          transition: box-shadow 0.2s;
        }
        input[type=range]::-webkit-slider-thumb:hover {
          box-shadow: 0 0 0 4px #7c3aed40;
        }
        input[type=range]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #7c3aed;
          cursor: pointer;
          border: 2px solid #161b22;
        }
      `}</style>
    </Layout>
  );
}
