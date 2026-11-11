"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Link2,
  MousePointerClick,
  CheckCircle2,
  TrendingUp,
  PlusCircle,
  Copy,
  Check,
  ExternalLink,
  ArrowRight,
  BarChart2,
  AlertCircle,
  Clock,
  Layers,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { api } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { formatDateTime, getDisplayShortUrl } from "@/lib/utils";

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Quick shorten widget
  const [quickUrl, setQuickUrl] = useState("");
  const [isShortening, setIsShortening] = useState(false);
  const [createdUrl, setCreatedUrl] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchOverview = async () => {
    setIsLoading(true);
    try {
      const data = await api.getOverviewAnalytics();
      setAnalytics(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load dashboard metrics.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleQuickShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickUrl.trim()) return;

    setIsShortening(true);
    try {
      let target = quickUrl.trim();
      if (!target.startsWith("http://") && !target.startsWith("https://")) {
        target = "https://" + target;
      }
      const res = await api.createUrl({ original_url: target });
      setCreatedUrl({
        ...res,
        short_url: getDisplayShortUrl(res.short_code, res.short_url),
      });
      setQuickUrl("");
      fetchOverview();
    } catch (err: any) {
      alert(err.message || "Failed to create short link.");
    } finally {
      setIsShortening(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Welcome & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Welcome back, <span className="text-white font-medium">{user?.full_name}</span>. Here is how your links are performing.
          </p>
        </div>

        <Link
          href="/dashboard/create"
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-md transition-all shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Short Link</span>
        </Link>
      </div>

      {/* Error notification */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 4 Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Links */}
        <div className="p-6 rounded-2xl glass-card border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Links</span>
            <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center">
              <Link2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white">
            {isLoading ? "..." : analytics?.total_links ?? 0}
          </p>
          <p className="text-xs text-slate-400 mt-1">Active in your account</p>
        </div>

        {/* Total Clicks */}
        <div className="p-6 rounded-2xl glass-card border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Clicks</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <MousePointerClick className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white">
            {isLoading ? "..." : analytics?.total_clicks ?? 0}
          </p>
          <p className="text-xs text-slate-400 mt-1">Recorded across all links</p>
        </div>

        {/* Active Links */}
        <div className="p-6 rounded-2xl glass-card border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Links</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-emerald-400">
            {isLoading ? "..." : analytics?.active_links ?? 0}
          </p>
          <p className="text-xs text-slate-400 mt-1">Currently redirecting</p>
        </div>

        {/* Avg Clicks / Link */}
        <div className="p-6 rounded-2xl glass-card border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Avg Clicks / Link</span>
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-sky-400">
            {isLoading ? "..." : analytics?.avg_clicks_per_link ?? "0.0"}
          </p>
          <p className="text-xs text-slate-400 mt-1">Conversion velocity</p>
        </div>
      </div>

      {/* Quick Shorten Widget */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 shadow-md">
        <h3 className="text-sm font-bold uppercase tracking-wider text-brand-300 mb-3 flex items-center gap-2">
          <PlusCircle className="w-4 h-4" /> Quick Shorten Link
        </h3>
        <form onSubmit={handleQuickShorten} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={quickUrl}
            onChange={(e) => setQuickUrl(e.target.value)}
            placeholder="Paste a long destination URL here..."
            className="flex-grow px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500"
            required
          />
          <button
            type="submit"
            disabled={isShortening}
            className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-sm transition-colors shrink-0 disabled:opacity-60 flex items-center justify-center space-x-2"
          >
            {isShortening ? <span>Shortening...</span> : <span>Shorten Now</span>}
          </button>
        </form>

        {createdUrl && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="overflow-hidden space-y-1">
              <p className="text-xs text-emerald-400 font-semibold">Short Link Created Successfully:</p>
              <p className="text-sm font-mono font-bold text-white truncate">{createdUrl.short_url}</p>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => copyToClipboard(createdUrl.short_url, "created")}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium"
              >
                {copiedId === "created" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === "created" ? "Copied" : "Copy"}</span>
              </button>
              <a
                href={createdUrl.short_url}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Analytics Chart & Top Links Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Click Trends Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl glass-card border border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white">Click Telemetry (Past 14 Days)</h3>
              <p className="text-xs text-slate-400">Total volume of redirected clicks per calendar day</p>
            </div>
            <Link
              href="/dashboard/analytics"
              className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 font-medium"
            >
              <span>Full Analytics</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="h-72 w-full">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                Loading time-series telemetry...
              </div>
            ) : analytics?.click_trends && analytics.click_trends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.click_trends}>
                  <defs>
                    <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    fontSize={11}
                    tickFormatter={(val) => {
                      const parts = val.split("-");
                      return parts.length === 3 ? `${parts[1]}/${parts[2]}` : val;
                    }}
                  />
                  <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="clicks"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorClicks)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm">
                <BarChart2 className="w-8 h-8 mb-2 opacity-40" />
                <span>No click telemetry recorded yet. Shorten a link to begin!</span>
              </div>
            )}
          </div>
        </div>

        {/* Top Performing Links */}
        <div className="p-6 rounded-2xl glass-card border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Top Performing Links</h3>
              <Link href="/dashboard/links" className="text-xs text-brand-400 hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-3 mt-4">
              {isLoading ? (
                <div className="text-center py-8 text-slate-500 text-xs">Loading top links...</div>
              ) : analytics?.top_links && analytics.top_links.length > 0 ? (
                analytics.top_links.map((link: any) => (
                  <div
                    key={link.id}
                    className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition-colors flex items-center justify-between gap-2"
                  >
                    <div className="overflow-hidden space-y-0.5">
                      <p className="text-xs font-mono font-bold text-brand-300 truncate">
                        /{link.short_code}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate max-w-[160px]">
                        {link.original_url}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="px-2 py-0.5 rounded-md bg-brand-950 text-brand-300 text-xs font-bold border border-brand-800/40">
                        {link.click_count} {link.click_count === 1 ? "click" : "clicks"}
                      </span>
                      <button
                        onClick={() => copyToClipboard(getDisplayShortUrl(link.short_code, link.short_url), `top-${link.id}`)}
                        className="p-1 rounded text-slate-400 hover:text-white"
                        title="Copy short link"
                      >
                        {copiedId === `top-${link.id}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No links created yet.
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80">
            <Link
              href="/dashboard/links"
              className="w-full flex items-center justify-center space-x-1 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
            >
              <span>Manage All Short Links</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
