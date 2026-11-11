"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Link2,
  MousePointerClick,
  CheckCircle2,
  TrendingUp,
  BarChart2,
  AlertCircle,
  ChevronDown,
  Clock,
  Globe,
  Loader2,
  RefreshCw,
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
import { formatDateTime } from "@/lib/utils";

function AnalyticsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlIdParam = searchParams.get("id");

  // Overview analytics
  const [overview, setOverview] = useState<any>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  // Link list for the selector
  const [links, setLinks] = useState<any[]>([]);
  const [linksLoading, setLinksLoading] = useState(true);

  // Per-link stats
  const [selectedId, setSelectedId] = useState<number | null>(urlIdParam ? Number(urlIdParam) : null);
  const [urlStats, setUrlStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    setOverviewLoading(true);
    setOverviewError(null);
    try {
      const data = await api.getOverviewAnalytics();
      setOverview(data);
    } catch (err: any) {
      setOverviewError(err.message || "Failed to load overview analytics.");
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  const fetchLinks = useCallback(async () => {
    setLinksLoading(true);
    try {
      const data = await api.listUrls({ page_size: 100, sort_by: "click_count", sort_order: "desc" });
      setLinks(data.items ?? []);
    } catch {
      /* non-fatal */
    } finally {
      setLinksLoading(false);
    }
  }, []);

  const fetchUrlStats = useCallback(async (id: number) => {
    setStatsLoading(true);
    setStatsError(null);
    setUrlStats(null);
    try {
      const data = await api.getUrlStats(id);
      setUrlStats(data);
    } catch (err: any) {
      setStatsError(err.message || "Failed to load link analytics.");
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
    fetchLinks();
  }, [fetchOverview, fetchLinks]);

  useEffect(() => {
    if (selectedId) fetchUrlStats(selectedId);
    else setUrlStats(null);
  }, [selectedId, fetchUrlStats]);

  const handleLinkSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value ? Number(e.target.value) : null;
    setSelectedId(id);
    if (id) {
      router.replace(`/dashboard/analytics?id=${id}`, { scroll: false });
    } else {
      router.replace("/dashboard/analytics", { scroll: false });
    }
  };

  const StatCard = ({
    label,
    value,
    icon: Icon,
    colorClass,
    bgClass,
    borderClass,
  }: {
    label: string;
    value: string | number;
    icon: React.ElementType;
    colorClass: string;
    bgClass: string;
    borderClass: string;
  }) => (
    <div className="p-5 rounded-2xl glass-card border border-slate-800 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
        <div className={`w-9 h-9 rounded-xl ${bgClass} ${borderClass} ${colorClass} flex items-center justify-center`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className={`text-3xl font-extrabold ${colorClass}`}>
        {overviewLoading ? "..." : value}
      </p>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Analytics</h1>
          <p className="text-sm text-slate-400 mt-1">
            Explore click performance for all your links.
          </p>
        </div>
        <button
          onClick={() => { fetchOverview(); if (selectedId) fetchUrlStats(selectedId); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white text-sm font-medium transition-colors shrink-0"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Overview Error */}
      {overviewError && (
        <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{overviewError}</span>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Account Overview</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Links"
            value={overview?.total_links ?? 0}
            icon={Link2}
            colorClass="text-brand-400"
            bgClass="bg-brand-500/10"
            borderClass="border border-brand-500/20"
          />
          <StatCard
            label="Total Clicks"
            value={overview?.total_clicks ?? 0}
            icon={MousePointerClick}
            colorClass="text-indigo-400"
            bgClass="bg-indigo-500/10"
            borderClass="border border-indigo-500/20"
          />
          <StatCard
            label="Active Links"
            value={overview?.active_links ?? 0}
            icon={CheckCircle2}
            colorClass="text-emerald-400"
            bgClass="bg-emerald-500/10"
            borderClass="border border-emerald-500/20"
          />
          <StatCard
            label="Avg Clicks / Link"
            value={overview?.avg_clicks_per_link ?? "0.0"}
            icon={TrendingUp}
            colorClass="text-sky-400"
            bgClass="bg-sky-500/10"
            borderClass="border border-sky-500/20"
          />
        </div>
      </div>

      {/* Account-wide Trend Chart */}
      <div className="p-6 rounded-2xl glass-card border border-slate-800">
        <h3 className="text-base font-bold text-white mb-1">Click Telemetry (Past 14 Days)</h3>
        <p className="text-xs text-slate-400 mb-5">Total volume of redirected clicks per calendar day — all links.</p>
        <div className="h-56 w-full">
          {overviewLoading ? (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading chart...
            </div>
          ) : overview?.click_trends && overview.click_trends.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={overview.click_trends}>
                <defs>
                  <linearGradient id="colorOverview" x1="0" y1="0" x2="0" y2="1">
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
                <Area type="monotone" dataKey="clicks" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorOverview)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm">
              <BarChart2 className="w-8 h-8 mb-2 opacity-30" />
              <span>No click data yet. Create and share a short link!</span>
            </div>
          )}
        </div>
      </div>

      {/* Per-Link Analytics Section */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 shrink-0">Link Deep Dive</h2>
          <div className="relative flex-1 max-w-sm">
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <select
              value={selectedId ?? ""}
              onChange={handleLinkSelect}
              disabled={linksLoading}
              className="w-full appearance-none px-4 py-2.5 pr-9 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 transition-colors disabled:opacity-50"
            >
              <option value="">— Select a link to inspect —</option>
              {links.map((link) => (
                <option key={link.id} value={link.id}>
                  /{link.short_code} · {link.click_count} clicks · {link.original_url.slice(0, 40)}{link.original_url.length > 40 ? "…" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats Error */}
        {statsError && (
          <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-sm flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{statsError}</span>
          </div>
        )}

        {statsLoading && (
          <div className="flex items-center justify-center py-16 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span className="text-sm">Loading link analytics...</span>
          </div>
        )}

        {!selectedId && !statsLoading && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-600 space-y-2">
            <BarChart2 className="w-10 h-10 opacity-30" />
            <p className="text-sm">Select a link above to see detailed analytics.</p>
          </div>
        )}

        {urlStats && !statsLoading && (
          <div className="space-y-5 animate-in fade-in">
            {/* Link Meta */}
            <div className="p-5 rounded-2xl glass-card border border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-mono font-bold text-brand-300">/{urlStats.short_code}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                      urlStats.is_active && !urlStats.is_expired
                        ? "bg-emerald-950/60 text-emerald-400 border-emerald-700/40"
                        : "bg-slate-800 text-slate-400 border-slate-700"
                    }`}>
                      {urlStats.is_expired ? "Expired" : urlStats.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 break-all">{urlStats.original_url}</p>
                  {urlStats.expires_at && (
                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Expires {formatDateTime(urlStats.expires_at)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-center">
                    <p className="text-2xl font-extrabold text-white">{urlStats.total_clicks}</p>
                    <p className="text-[11px] text-slate-400">Total Clicks</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Clicks Chart */}
            <div className="p-6 rounded-2xl glass-card border border-slate-800">
              <h3 className="text-sm font-bold text-white mb-1">Daily Click History</h3>
              <p className="text-xs text-slate-400 mb-5">Clicks per day for this link.</p>
              <div className="h-52 w-full">
                {urlStats.daily_stats && urlStats.daily_stats.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={urlStats.daily_stats}>
                      <defs>
                        <linearGradient id="colorPerLink" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0.0} />
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
                      <Area type="monotone" dataKey="clicks" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorPerLink)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 text-sm space-y-2">
                    <BarChart2 className="w-8 h-8 opacity-30" />
                    <span>No click data recorded yet for this link.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Clicks Table */}
            <div className="p-5 rounded-2xl glass-card border border-slate-800">
              <h3 className="text-sm font-bold text-white mb-4">Recent Click Events</h3>
              {urlStats.recent_clicks && urlStats.recent_clicks.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="text-left pb-2.5 text-slate-500 font-semibold uppercase tracking-wider pr-4">
                          <Clock className="w-3 h-3 inline mr-1" />Timestamp
                        </th>
                        <th className="text-left pb-2.5 text-slate-500 font-semibold uppercase tracking-wider pr-4">
                          <Globe className="w-3 h-3 inline mr-1" />Referrer
                        </th>
                        <th className="text-left pb-2.5 text-slate-500 font-semibold uppercase tracking-wider">
                          Browser / Device
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {urlStats.recent_clicks.map((click: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-2.5 pr-4 text-slate-300 whitespace-nowrap">
                            {formatDateTime(click.clicked_at)}
                          </td>
                          <td className="py-2.5 pr-4 text-slate-400 max-w-[180px] truncate">
                            {click.referer || <span className="text-slate-600 italic">Direct / Unknown</span>}
                          </td>
                          <td className="py-2.5 text-slate-400">
                            {click.user_agent_summary || <span className="text-slate-600 italic">Unknown</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-600 text-xs">
                  No click events recorded yet.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span className="text-sm">Loading analytics...</span>
      </div>
    }>
      <AnalyticsContent />
    </Suspense>
  );
}

