"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Link2, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") || "";

  const [tokenInput, setTokenInput] = useState(tokenFromUrl);
  const [statusState, setStatusState] = useState<"loading" | "success" | "error" | "idle">(
    tokenFromUrl ? "loading" : "idle"
  );
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (tokenFromUrl) {
      verifyToken(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  const verifyToken = async (tok: string) => {
    setStatusState("loading");
    setMessage("");

    try {
      const res = await api.verifyEmail(tok.trim());
      setStatusState("success");
      setMessage(res.message || "Your email address has been successfully verified! You may now sign in.");
    } catch (err: any) {
      setStatusState("error");
      setMessage(err.message || "Invalid or expired verification token. Please request a new one.");
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    verifyToken(tokenInput.trim());
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-20 pb-16 relative">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-brand-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="w-full max-w-md space-y-8 glass-panel p-8 sm:p-10 rounded-3xl border border-slate-800 shadow-2xl shadow-brand-950/40 text-center">
        <Link href="/" className="inline-flex items-center space-x-2.5 mb-2 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-brand-500/25 group-hover:scale-105 transition-transform duration-200">
            <Link2 className="w-6 h-6 text-white transform -rotate-45" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">
            Link<span className="text-brand-400">Flow</span>
          </span>
        </Link>

        {statusState === "loading" && (
          <div className="py-8 space-y-4">
            <div className="w-12 h-12 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <h3 className="text-xl font-bold text-white">Verifying Your Email...</h3>
            <p className="text-sm text-slate-400">Communicating with the cryptographic authentication server.</p>
          </div>
        )}

        {statusState === "success" && (
          <div className="py-4 space-y-5">
            <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-white">Email Address Verified!</h3>
            <p className="text-sm text-slate-300 leading-relaxed">{message}</p>
            <div className="pt-2">
              <Link
                href="/login"
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-brand-600/30 transition-all flex items-center justify-center space-x-2"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {statusState === "error" && (
          <div className="py-4 space-y-5">
            <div className="w-14 h-14 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto border border-rose-500/40">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-white">Verification Failed</h3>
            <p className="text-sm text-rose-300 leading-relaxed">{message}</p>

            <form onSubmit={handleManualSubmit} className="pt-2 text-left space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Or Enter Verification Token Manually
              </label>
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Paste your 32-character token"
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 font-mono"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-sm transition-colors"
              >
                Retry Verification
              </button>
            </form>

            <div className="pt-2">
              <Link href="/login" className="text-xs text-brand-400 hover:underline">
                Return to Login Page
              </Link>
            </div>
          </div>
        )}

        {statusState === "idle" && (
          <div className="space-y-5 text-left">
            <div>
              <h3 className="text-xl font-bold text-white text-center">Verify Email Address</h3>
              <p className="text-xs text-slate-400 text-center mt-1">
                Enter the verification token sent to your email inbox.
              </p>
            </div>
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Verification Token
                </label>
                <input
                  type="text"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Paste token here"
                  required
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm transition-colors"
              >
                Verify Account
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-slate-400">
          Loading verification portal...
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
