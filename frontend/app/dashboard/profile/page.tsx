"use client";

import React, { useEffect, useState } from "react";
import {
  User,
  Mail,
  CheckCircle2,
  AlertCircle,
  Link2,
  MousePointerClick,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function ProfilePage() {
  const { user } = useAuth();

  const [overview, setOverview] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.getOverviewAnalytics();
      setOverview(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load profile stats.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Profile</h1>
          <p className="text-sm text-slate-400 mt-1">Your account information and usage statistics.</p>
        </div>
        <button
          onClick={fetchData}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white text-sm font-medium transition-colors shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Avatar + Name Card */}
      <div className="p-6 rounded-2xl glass-card border border-slate-800">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center text-white text-2xl font-extrabold shadow-lg shadow-brand-600/20 shrink-0">
            {initials}
          </div>

          {/* Identity */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h2 className="text-xl font-bold text-white">{user?.full_name || "—"}</h2>
              {user?.is_verified ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                  <ShieldCheck className="w-3 h-3" />
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
                  <ShieldAlert className="w-3 h-3" />
                  Unverified
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 text-sm text-slate-400">
              <span className="flex items-center justify-center sm:justify-start gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                {user?.email || "—"}
              </span>
              {user?.created_at && (
                <span className="flex items-center justify-center sm:justify-start gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Member since {formatDate(user.created_at)}
                </span>
              )}
            </div>

            {!user?.is_verified && (
              <p className="text-xs text-amber-500/80 bg-amber-950/30 border border-amber-800/40 rounded-lg px-3 py-2 mt-1">
                Your email address hasn&apos;t been verified yet. Check your inbox for a verification link.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Account Details */}
      <div className="p-5 rounded-2xl glass-card border border-slate-800 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Account Details</h3>
        <div className="space-y-3">
          <DetailRow icon={User} label="Full Name" value={user?.full_name || "—"} />
          <DetailRow icon={Mail} label="Email Address" value={user?.email || "—"} />
          <DetailRow
            icon={CheckCircle2}
            label="Verification Status"
            value={
              user?.is_verified ? (
                <span className="text-emerald-400 font-semibold">Email Verified ✓</span>
              ) : (
                <span className="text-amber-400 font-semibold">Not Verified</span>
              )
            }
          />
          <DetailRow
            icon={Calendar}
            label="Member Since"
            value={user?.created_at ? formatDate(user.created_at) : "—"}
          />
          <DetailRow
            icon={Calendar}
            label="Account ID"
            value={user?.id ? `#${user.id}` : "—"}
          />
        </div>
      </div>

      {/* Usage Statistics */}
      <div className="p-5 rounded-2xl glass-card border border-slate-800 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Usage Statistics</h3>
        <div className="grid grid-cols-2 gap-4">
          <StatBox
            icon={Link2}
            label="Total Links"
            value={isLoading ? "..." : overview?.total_links ?? 0}
            colorClass="text-brand-400"
            bgClass="bg-brand-500/10"
            borderClass="border-brand-500/20"
          />
          <StatBox
            icon={MousePointerClick}
            label="Total Clicks"
            value={isLoading ? "..." : overview?.total_clicks ?? 0}
            colorClass="text-indigo-400"
            bgClass="bg-indigo-500/10"
            borderClass="border-indigo-500/20"
          />
          <StatBox
            icon={CheckCircle2}
            label="Active Links"
            value={isLoading ? "..." : overview?.active_links ?? 0}
            colorClass="text-emerald-400"
            bgClass="bg-emerald-500/10"
            borderClass="border-emerald-500/20"
          />
          <StatBox
            icon={MousePointerClick}
            label="Avg Clicks / Link"
            value={isLoading ? "..." : overview?.avg_clicks_per_link ?? "0.0"}
            colorClass="text-sky-400"
            bgClass="bg-sky-500/10"
            borderClass="border-sky-500/20"
          />
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-800/60 last:border-0">
      <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mb-0.5">{label}</p>
        <div className="text-sm text-slate-200">{value}</div>
      </div>
    </div>
  );
}

function StatBox({
  icon: Icon,
  label,
  value,
  colorClass,
  bgClass,
  borderClass,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}) {
  return (
    <div className={`p-4 rounded-xl border ${bgClass} ${borderClass} space-y-2`}>
      <div className={`w-8 h-8 rounded-lg ${bgClass} border ${borderClass} flex items-center justify-center`}>
        <Icon className={`w-4 h-4 ${colorClass}`} />
      </div>
      <p className={`text-2xl font-extrabold ${colorClass}`}>{value}</p>
      <p className="text-[11px] text-slate-500 font-medium">{label}</p>
    </div>
  );
}

