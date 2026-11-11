"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Link2,
  Search,
  Copy,
  Check,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  BarChart2,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Clock,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatDate, getDisplayShortUrl } from "@/lib/utils";

type SortBy = "created_at" | "clicks";
type SortOrder = "desc" | "asc";
type StatusFilter = "all" | "active" | "inactive" | "expired";

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Expired", value: "expired" },
];

export default function LinksPage() {
  const router = useRouter();
  const [links, setLinks] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("created_at");  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchLinks = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const params: any = { page, page_size: 10, sort_by: sortBy, sort_order: sortOrder };
      if (debouncedSearch) params.search = debouncedSearch;
      if (status !== "all") params.status = status;
      const data = await api.listUrls(params);
      const items = (data.items ?? []).map((u: any) => ({
        ...u,
        short_url: getDisplayShortUrl(u.short_code, u.short_url),
      }));
      setLinks(items);
      setTotal(data.total ?? 0);
      setTotalPages(data.total_pages ?? 1);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load links.");
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, status, sortBy, sortOrder]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleActive = async (link: any) => {
    setTogglingId(link.id);
    try {
      await api.updateUrl(link.id, { is_active: !link.is_active });
      fetchLinks();
    } catch (err: any) {
      alert(err.message || "Failed to update link status.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this short link? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await api.deleteUrl(id);
      fetchLinks();
    } catch (err: any) {
      alert(err.message || "Failed to delete link.");
    } finally {
      setDeletingId(null);
    }
  };

  const toggleSort = (field: SortBy) => {
    if (sortBy === field) {
      setSortOrder((o) => (o === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const getStatusBadge = (link: any) => {
    if (link.is_expired)
      return <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-950/60 text-amber-400 border border-amber-700/40">Expired</span>;
    if (!link.is_active)
      return <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">Inactive</span>;
    return <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-700/40">Active</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">My Links</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage and track all your shortened URLs ({total} total)
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

      {/* Error */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by URL or alias..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Sort */}
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => toggleSort("created_at")}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
              sortBy === "created_at"
                ? "bg-brand-600/20 border-brand-500/40 text-brand-300"
                : "border-slate-700 text-slate-400 hover:text-white bg-slate-900"
            }`}
          >
            Date {sortBy === "created_at" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
          </button>
          <button
            onClick={() => toggleSort("clicks")}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
              sortBy === "clicks"
                ? "bg-brand-600/20 border-brand-500/40 text-brand-300"
                : "border-slate-700 text-slate-400 hover:text-white bg-slate-900"
            }`}
          >
            Clicks {sortBy === "clicks" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 p-1 bg-slate-900/60 border border-slate-800 rounded-xl w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatus(tab.value); setPage(1); }}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              status === tab.value
                ? "bg-brand-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Links List */}
      <div className="rounded-2xl glass-card border border-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-3">
            <Loader2 className="w-7 h-7 animate-spin" />
            <span className="text-sm">Loading your links...</span>
          </div>
        ) : links.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-4">
            <Link2 className="w-10 h-10 opacity-30" />
            <div className="text-center">
              <p className="text-sm font-medium">No links found</p>
              <p className="text-xs mt-1">
                {search || status !== "all"
                  ? "Try adjusting your search or filters."
                  : "Create your first short link to get started."}
              </p>
            </div>
            {!search && status === "all" && (
              <Link
                href="/dashboard/create"
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition-colors"
              >
                Create Short Link
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {links.map((link) => (
              <div key={link.id} className="p-4 sm:p-5 hover:bg-slate-900/40 transition-colors group">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* Link Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-mono font-bold text-brand-300">
                        /{link.short_code}
                      </span>
                      {getStatusBadge(link)}
                      {link.expires_at && (
                        <span className="flex items-center gap-1 text-[11px] text-slate-500">
                          <Clock className="w-3 h-3" />
                          Expires {formatDate(link.expires_at)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate max-w-sm sm:max-w-lg">
                      {link.original_url}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <span>{link.click_count} {link.click_count === 1 ? "click" : "clicks"}</span>
                      <span>Created {formatDate(link.created_at)}</span>
                      <span>Redirect {link.redirect_type}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Copy */}
                    <button
                      onClick={() => handleCopy(link.short_url, `link-${link.id}`)}
                      className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Copy short URL"
                    >
                      {copiedId === `link-${link.id}` ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    {/* Open */}
                    <a
                      href={link.short_url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Open short URL"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>

                    {/* Analytics */}
                    <button
                      onClick={() => router.push(`/dashboard/analytics?id=${link.id}`)}
                      className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="View analytics"
                    >
                      <BarChart2 className="w-4 h-4" />
                    </button>

                    {/* Toggle Active */}
                    <button
                      onClick={() => handleToggleActive(link)}
                      disabled={togglingId === link.id || link.is_expired}
                      className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-40"
                      title={link.is_active ? "Deactivate link" : "Activate link"}
                    >
                      {togglingId === link.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : link.is_active ? (
                        <ToggleRight className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="w-4 h-4" />
                      )}
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(link.id)}
                      disabled={deletingId === link.id}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors disabled:opacity-40"
                      title="Delete link"
                    >
                      {deletingId === link.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-500">
            Page {page} of {totalPages} &nbsp;·&nbsp; {total} total links
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
              className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2 + i, totalPages - 4 + i));
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                    p === page
                      ? "bg-brand-600 text-white"
                      : "border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || isLoading}
              className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

