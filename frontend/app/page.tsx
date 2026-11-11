"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Link2,
  ArrowRight,
  Copy,
  Check,
  Zap,
  ShieldCheck,
  BarChart3,
  Server,
  Database,
  Layers,
  ExternalLink,
  Sparkles,
  Cpu,
  Clock,
  Lock,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { getDisplayShortUrl } from "@/lib/utils";

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const [inputUrl, setInputUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [shortenedResult, setShortenedResult] = useState<{
    originalUrl: string;
    shortUrl: string;
    shortCode: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;

    setErrorMsg(null);
    setIsLoading(true);

    try {
      let target = inputUrl.trim();
      if (!target.startsWith("http://") && !target.startsWith("https://")) {
        target = "https://" + target;
      }

      const res = await api.createPublicUrl(target);
      setShortenedResult({
        originalUrl: res.original_url,
        shortUrl: getDisplayShortUrl(res.short_code, res.short_url),
        shortCode: res.short_code,
      });
      setInputUrl("");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to shorten URL. Please check connection to backend.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!shortenedResult) return;
    navigator.clipboard.writeText(shortenedResult.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative overflow-hidden pt-20">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-brand-600/20 via-indigo-500/10 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* --- HERO SECTION --- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 text-center">
        {/* Release Tag */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-brand-500/30 text-xs font-medium text-brand-300 mb-8 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span>Next-Generation Bitly Alternative • Python 3.12 + FastAPI + Redis</span>
        </div>

        {/* Heading */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight">
          Shorten Links. Track Clicks. <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-brand-400 via-indigo-300 to-sky-400 bg-clip-text text-transparent">
            Grow Faster.
          </span>
        </h1>

        {/* Description */}
        <p className="max-w-2xl mx-auto text-lg sm:text-xl text-slate-300 mb-10 leading-relaxed font-normal">
          LinkFlow delivers high-throughput URL shortening powered by Redis caching, Base62 cryptographic generation, and deep click telemetry for modern developers and businesses.
        </p>

        {/* Shortener Box */}
        <div className="max-w-3xl mx-auto mb-10">
          <form
            onSubmit={handleShorten}
            className="p-2 sm:p-3 rounded-2xl glass-panel shadow-2xl shadow-brand-950/50 flex flex-col sm:flex-row gap-3 border border-slate-700/60"
          >
            <div className="relative flex-grow flex items-center">
              <Link2 className="absolute left-4 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="Paste your long destination URL here (e.g., https://very-long-link.com/article?id=992)..."
                className="w-full pl-12 pr-4 py-3.5 bg-slate-900/80 rounded-xl text-white placeholder-slate-400 text-sm sm:text-base border border-slate-700 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-sm sm:text-base shadow-lg shadow-brand-600/30 transition-all duration-200 flex items-center justify-center space-x-2 shrink-0 disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <span>Shorten URL</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Error Banner */}
          {errorMsg && (
            <div className="mt-4 p-3.5 rounded-xl bg-rose-950/80 border border-rose-800/60 text-rose-300 text-sm text-left">
              {errorMsg}
            </div>
          )}

          {/* Generated Result Card */}
          {shortenedResult && (
            <div className="mt-6 p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-brand-500/40 shadow-xl text-left animate-in fade-in duration-300">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-4 h-4" /> Short Link Ready
                </span>
                {!isAuthenticated && (
                  <Link href="/signup" className="text-xs text-brand-400 hover:underline">
                    Create free account to view detailed analytics &rarr;
                  </Link>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                <div className="overflow-hidden space-y-1">
                  <p className="text-xs text-slate-400 truncate max-w-lg">
                    Destination: <span className="text-slate-300">{shortenedResult.originalUrl}</span>
                  </p>
                  <p className="text-lg sm:text-xl font-mono font-bold text-white tracking-tight">
                    {shortenedResult.shortUrl}
                  </p>
                </div>

                <div className="flex items-center space-x-2.5 shrink-0 w-full sm:w-auto">
                  <button
                    onClick={copyToClipboard}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-colors shadow-md"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                  <a
                    href={shortenedResult.shortUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="Test Redirection"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Hero Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm text-slate-400">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-brand-400" />
            <span>&lt; 5ms Redis Redirects</span>
          </div>
          <div className="flex items-center space-x-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>Argon2 & JWT Security</span>
          </div>
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-sky-400" />
            <span>PostgreSQL ACID Durability</span>
          </div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>GDPR-Compliant Telemetry</span>
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS SECTION --- */}
      <section id="how-it-works" className="py-20 border-t border-slate-800/60 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-400 mb-2">Workflow Process</h2>
            <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4">How LinkFlow Works</h3>
            <p className="text-slate-400 text-base">
              A frictionless three-step pipeline engineered for sub-millisecond redirection and tamper-proof telemetry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative p-8 rounded-2xl glass-card border border-slate-800 group hover:border-brand-500/40 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-brand-900/50 border border-brand-700/40 flex items-center justify-center text-brand-300 font-bold text-lg mb-6 group-hover:scale-110 transition-transform">
                1
              </div>
              <h4 className="text-xl font-bold text-white mb-3">1. Submit & Base62 Encode</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Paste any valid HTTP/HTTPS URL or specify a custom alias. LinkFlow executes a cryptographically secure Base62 candidate generation with bounded collision resolution.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative p-8 rounded-2xl glass-card border border-slate-800 group hover:border-brand-500/40 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-indigo-900/50 border border-indigo-700/40 flex items-center justify-center text-indigo-300 font-bold text-lg mb-6 group-hover:scale-110 transition-transform">
                2
              </div>
              <h4 className="text-xl font-bold text-white mb-3">2. Cache-Aside Memory Store</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                The mapping is written to PostgreSQL and simultaneously populated into an in-memory Redis key-value cache with configurable TTL, guaranteeing instantaneous lookup on subsequent hits.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative p-8 rounded-2xl glass-card border border-slate-800 group hover:border-brand-500/40 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-sky-900/50 border border-sky-700/40 flex items-center justify-center text-sky-300 font-bold text-lg mb-6 group-hover:scale-110 transition-transform">
                3
              </div>
              <h4 className="text-xl font-bold text-white mb-3">3. Telemetry & Instant Redirect</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                When accessed, the visitor is served an HTTP 302/301 redirect in sub-5ms while click telemetry (referrer, user-agent, daily aggregates) is atomically recorded.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- FEATURES SECTION --- */}
      <section id="features" className="py-20 border-t border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-400 mb-2">Enterprise Capabilities</h2>
            <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4">Engineered For High-Concurrency Demands</h3>
            <p className="text-slate-400 text-base">
              LinkFlow isn&apos;t just a demo script; it implements production architectural patterns required by Tier-1 web systems.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-7 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center mb-5">
                <Zap className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Ultra-Fast Redirection</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Sub-millisecond resolution times via Redis cache-aside design. Inactive and expired links are automatically evaluated and retired.
              </p>
            </div>

            <div className="p-7 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-5">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Real-Time Click Telemetry</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Daily time-series aggregation, device classification, referrer extraction, and aggregate link performance charts rendered with Recharts.
              </p>
            </div>

            <div className="p-7 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center mb-5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Secure Link Management</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Strict multi-tenant tenant isolation ensures users can only access and manipulate their own URLs, credentials, and telemetry streams.
              </p>
            </div>

            <div className="p-7 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Collision Bounded Retries</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Database-level UNIQUE constraint enforcement combined with an algorithmic savepoint retry loop prevents race conditions and data corruption.
              </p>
            </div>

            <div className="p-7 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center mb-5">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Email Verification & Recovery</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Cryptographically secure token workflows with time-limited expiration, email dispatch via SMTP, and enumeration-resistant password recovery.
              </p>
            </div>

            <div className="p-7 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center mb-5">
                <Server className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Graceful Cache Degradation</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                If Redis undergoes a network partition or reboot, LinkFlow automatically falls back to PostgreSQL queries without dropping incoming redirect requests.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- ARCHITECTURE SECTION --- */}
      <section id="architecture" className="py-20 border-t border-slate-800/60 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-400 mb-2">System Design</h2>
            <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4">Enterprise Tech Stack & Topology</h3>
            <p className="text-slate-400 text-base">
              Separation of concerns between client presentation, stateless REST microservices, and persistent distributed storage layers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div className="p-6 rounded-2xl glass-card border border-slate-800">
              <div className="w-12 h-12 mx-auto rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
                <Zap className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">Frontend Layer</h4>
              <p className="text-xs text-brand-400 mb-3">Next.js 14 & React 18</p>
              <p className="text-xs text-slate-400">
                Server-rendered dashboard, Tailwind styling, shadcn-inspired components, and Recharts interactive telemetry.
              </p>
            </div>

            <div className="p-6 rounded-2xl glass-card border border-slate-800">
              <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
                <Cpu className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">Application API</h4>
              <p className="text-xs text-emerald-400 mb-3">FastAPI & Python 3.12</p>
              <p className="text-xs text-slate-400">
                Asynchronous ASGI server, Pydantic v2 validation, JWT authentication, and automated OpenAPI 3.0 specs.
              </p>
            </div>

            <div className="p-6 rounded-2xl glass-card border border-slate-800">
              <div className="w-12 h-12 mx-auto rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
                <Layers className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">In-Memory Cache</h4>
              <p className="text-xs text-rose-400 mb-3">Redis 7 Key-Value</p>
              <p className="text-xs text-slate-400">
                Cache-aside pattern for sub-5ms URL mapping lookups with TTL expiration and automatic cache invalidation on edits.
              </p>
            </div>

            <div className="p-6 rounded-2xl glass-card border border-slate-800">
              <div className="w-12 h-12 mx-auto rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 mb-4">
                <Database className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">Persistent Relational</h4>
              <p className="text-xs text-sky-400 mb-3">PostgreSQL & Alembic</p>
              <p className="text-xs text-slate-400">
                Normalized relational schema, B-Tree indexes on short_code and user_id, foreign keys with cascading deletions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- STATISTICS SECTION --- */}
      <section className="py-16 border-t border-slate-800/60 bg-gradient-to-b from-slate-950 to-slate-900/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800">
              <p className="text-3xl sm:text-4xl font-extrabold text-white mb-1">3.52T</p>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Base62 Keyspace (62⁷)</p>
            </div>
            <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800">
              <p className="text-3xl sm:text-4xl font-extrabold text-brand-400 mb-1">&lt; 5ms</p>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Redis Read Latency</p>
            </div>
            <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800">
              <p className="text-3xl sm:text-4xl font-extrabold text-emerald-400 mb-1">100%</p>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Multi-Tenant Isolation</p>
            </div>
            <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800">
              <p className="text-3xl sm:text-4xl font-extrabold text-sky-400 mb-1">301 / 302</p>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Configurable Redirects</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="py-20 border-t border-slate-800/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-tr from-brand-950 via-slate-900 to-indigo-950 border border-brand-500/30 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

            <h3 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Ready to Upgrade Your Link Infrastructure?
            </h3>
            <p className="text-slate-300 text-base max-w-xl mx-auto mb-8">
              Create your free LinkFlow account today to manage links, analyze click telemetry, configure custom aliases, and test live redirects.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-base shadow-lg shadow-brand-600/30 transition-all duration-200"
              >
                Create Free Account
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-base border border-slate-700 transition-colors"
              >
                Sign In to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
