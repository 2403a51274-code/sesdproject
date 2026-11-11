"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Link2,
  PlusCircle,
  Copy,
  Check,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Info,
} from "lucide-react";
import { api } from "@/lib/api";

type RedirectType = 302 | 301;

interface FormState {
  original_url: string;
  custom_alias: string;
  expires_at: string;
  redirect_type: RedirectType;
}

const DEFAULT_FORM: FormState = {
  original_url: "",
  custom_alias: "",
  expires_at: "",
  redirect_type: 302,
};

export default function CreatePage() {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdLink, setCreatedLink] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validate & auto-prepend protocol
    let url = form.original_url.trim();
    if (!url) return;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    // Validate custom alias: only alphanumeric + hyphens
    if (form.custom_alias && !/^[a-zA-Z0-9-_]+$/.test(form.custom_alias)) {
      setErrorMsg("Custom alias can only contain letters, numbers, hyphens, and underscores.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        original_url: url,
        redirect_type: Number(form.redirect_type),
      };
      if (form.custom_alias.trim()) payload.custom_alias = form.custom_alias.trim();
      if (form.expires_at) payload.expires_at = new Date(form.expires_at).toISOString();

      const result = await api.createUrl(payload);
      setCreatedLink(result);
      setForm(DEFAULT_FORM);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create short link. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = () => {
    if (!createdLink) return;
    navigator.clipboard.writeText(createdLink.short_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateAnother = () => {
    setCreatedLink(null);
    setErrorMsg(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Create Short Link
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Shorten a URL with a custom alias, expiry, and redirect type.
        </p>
      </div>

      {/* Success Result Card */}
      {createdLink && (
        <div className="p-6 rounded-2xl border border-emerald-500/40 bg-emerald-950/20 space-y-5 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-300">Short Link Created!</p>
              <p className="text-xs text-slate-400">Your link is live and ready to share.</p>
            </div>
          </div>

          {/* Short URL display */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-700">
            <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">Short URL</p>
            <p className="text-base font-mono font-bold text-white break-all">{createdLink.short_url}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-700">
            <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">Original URL</p>
            <p className="text-xs text-slate-300 break-all">{createdLink.original_url}</p>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <p className="text-xs text-slate-500">Alias</p>
              <p className="text-sm font-mono font-bold text-brand-300 mt-1">/{createdLink.short_code}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <p className="text-xs text-slate-500">Redirect</p>
              <p className="text-sm font-bold text-white mt-1">{createdLink.redirect_type}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <p className="text-xs text-slate-500">Status</p>
              <p className="text-sm font-bold text-emerald-400 mt-1">Active</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? "Copied!" : "Copy Short URL"}</span>
            </button>
            <a
              href={createdLink.short_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white text-sm font-medium transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Test Link</span>
            </a>
            <button
              onClick={handleCreateAnother}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white text-sm font-medium transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Another</span>
            </button>
          </div>
        </div>
      )}

      {/* Create Form */}
      {!createdLink && (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Error */}
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-sm flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Original URL */}
          <div className="p-5 rounded-2xl glass-card border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Link2 className="w-4 h-4 text-brand-400" />
              Destination URL
            </h2>
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1.5">
                Original URL <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                name="original_url"
                value={form.original_url}
                onChange={handleChange}
                required
                placeholder="https://example.com/very/long/url/here"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500 transition-colors"
              />
              <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                <Info className="w-3 h-3" />
                If you omit https://, it will be added automatically.
              </p>
            </div>
          </div>

          {/* Options */}
          <div className="p-5 rounded-2xl glass-card border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Link Options</h2>

            {/* Custom Alias */}
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1.5">
                Custom Alias <span className="text-slate-500">(optional)</span>
              </label>
              <div className="flex items-center gap-0">
                <span className="px-3 py-3 bg-slate-800 border border-r-0 border-slate-700 rounded-l-xl text-slate-500 text-sm font-mono select-none">
                  /r/
                </span>
                <input
                  type="text"
                  name="custom_alias"
                  value={form.custom_alias}
                  onChange={handleChange}
                  placeholder="my-custom-link"
                  className="flex-1 px-4 py-3 bg-slate-950 border border-slate-700 rounded-r-xl text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Leave empty to auto-generate a random code. Allowed: letters, numbers, hyphens, underscores.
              </p>
            </div>

            {/* Expiry Date */}
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1.5">
                Expiry Date &amp; Time <span className="text-slate-500">(optional)</span>
              </label>
              <input
                type="datetime-local"
                name="expires_at"
                value={form.expires_at}
                onChange={handleChange}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500 transition-colors [color-scheme:dark]"
              />
              <p className="text-[11px] text-slate-500 mt-1.5">
                Leave empty for a permanent link that never expires.
              </p>
            </div>

            {/* Redirect Type */}
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-2">
                Redirect Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                {([302, 301] as RedirectType[]).map((type) => (
                  <label
                    key={type}
                    className={`flex flex-col p-4 rounded-xl border cursor-pointer transition-colors ${
                      Number(form.redirect_type) === type
                        ? "border-brand-500/60 bg-brand-600/10"
                        : "border-slate-700 bg-slate-900/50 hover:border-slate-600"
                    }`}
                  >
                    <input
                      type="radio"
                      name="redirect_type"
                      value={type}
                      checked={Number(form.redirect_type) === type}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <span className={`text-sm font-bold ${Number(form.redirect_type) === type ? "text-brand-300" : "text-white"}`}>
                      {type} {type === 302 ? "Temporary" : "Permanent"}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1">
                      {type === 302
                        ? "Browsers won't cache this redirect. Best for campaigns."
                        : "Browsers cache this permanently. Best for stable links."}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting || !form.original_url.trim()}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-brand-600/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                <span>Create Short Link</span>
              </>
            )}
          </button>

          <div className="text-center pt-1">
            <Link href="/dashboard/links" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
              View all my links →
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}

