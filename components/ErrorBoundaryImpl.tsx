import React from "react";
import Link from "next/link";
import { IS_PRODUCTION } from "../lib/config";

interface Props {
  children: React.ReactNode;
  onReset: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export default class ErrorBoundaryImpl extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    if (!IS_PRODUCTION) {
      console.error("[ErrorBoundary] Caught:", error, errorInfo);
    }
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { error, errorInfo } = this.state;
    const isDev = !IS_PRODUCTION;
    const short = error?.message?.slice(0, 120) || "An unexpected error occurred";
    const stack = errorInfo?.componentStack?.trim().split("\n").slice(0, 6).join("\n");

    return (
      <div className="flex items-center justify-center min-h-[80vh] px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="relative mb-10 flex items-center justify-center select-none">
            <div className="absolute w-72 h-72 rounded-full bg-rose-600/10 blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-36 h-36 rounded-full border border-rose-500/20 animate-ping" style={{ animationDuration: "2s" }} />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-28 h-28 rounded-full border border-rose-500/30 animate-ping" style={{ animationDuration: "2.5s", animationDelay: "0.3s" }} />
              </div>
              <div className="relative w-24 h-24 rounded-3xl bg-[#161b22] border border-rose-500/30 shadow-2xl shadow-rose-900/30 flex items-center justify-center">
                <svg className="w-12 h-12 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex justify-center mb-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono font-semibold tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
              Runtime Error
            </span>
          </div>

          <h1 className="text-2xl font-bold text-white text-center mb-2">Something went wrong</h1>
          <p className="text-[#8b949e] text-sm text-center mb-6 leading-relaxed max-w-sm mx-auto">
            A component crashed unexpectedly. Your data is safe — try recovering below or return to the inbox.
          </p>

          <div className="bg-[#161b22] border border-rose-500/20 rounded-2xl overflow-hidden mb-6">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-rose-500/5">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/40" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/20" />
              </div>
              <span className="text-xs text-[#484f58] font-mono ml-1">error.log</span>
            </div>
            <div className="p-4">
              <p className="text-rose-400 text-xs font-mono leading-relaxed break-all">{short}</p>
              {isDev && stack && (
                <details className="mt-3">
                  <summary className="text-[#484f58] text-xs font-mono cursor-pointer hover:text-[#8b949e] transition-colors select-none">
                    ▶ component stack
                  </summary>
                  <pre className="mt-2 text-[10px] font-mono text-[#8b949e] whitespace-pre-wrap leading-relaxed overflow-auto max-h-40">
                    {stack}
                  </pre>
                </details>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <button
              onClick={this.props.onReset}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-sm font-semibold transition-all shadow-lg shadow-rose-900/30 hover:shadow-rose-900/50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Again
            </button>
            <Link href="/"
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-white text-sm font-medium transition-all border border-[#30363d] hover:border-[#484f58]"
            >
              <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Go to Inbox
            </Link>
          </div>

          <div className="text-center">
            <button
              onClick={() => window.location.reload()}
              className="text-xs text-[#484f58] hover:text-[#8b949e] transition-colors underline underline-offset-4"
            >
              Hard reload the page
            </button>
          </div>
        </div>
      </div>
    );
  }
}
