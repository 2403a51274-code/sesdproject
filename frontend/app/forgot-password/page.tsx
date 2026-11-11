"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Link2, Mail, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ message: string; devToken?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await api.forgotPassword(email.trim());
      setSuccessInfo({
        message: res.message || "If an account matches that email address, a password reset link has been dispatched.",
        devToken: res.dev_token,
      });
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while processing your request.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-20 pb-16 relative">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-brand-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="w-full max-w-md space-y-8 glass-panel p-8 sm:p-10 rounded-3xl border border-slate-800 shadow-2xl shadow-brand-950/40">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center space-x-2.5 mb-6 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-brand-500/25 group-hover:scale-105 transition-transform duration-200">
              <Link2 className="w-6 h-6 text-white transform -rotate-45" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">
              Link<span className="text-brand-400">Flow</span>
            </span>
          </Link>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Forgot Your Password?
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Enter your registered email address and we will dispatch a secure, time-limited reset link.
          </p>
        </div>

        {successInfo ? (
          <div className="p-6 rounded-2xl bg-slate-900 border border-brand-500/40 text-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="w-6 h-6 text-brand-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-white text-base">Check Your Inbox</h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {successInfo.message}
                </p>
              </div>
            </div>

            {successInfo.devToken && (
              <div className="mt-3 p-3 bg-slate-950 rounded-xl border border-brand-800/40 text-xs">
                <p className="font-semibold text-brand-300 mb-1">Local Dev Quick Reset:</p>
                <Link
                  href={`/reset-password?token=${encodeURIComponent(successInfo.devToken)}`}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-500 transition-colors"
                >
                  <span>Reset Password Now &rarr;</span>
                </Link>
              </div>
            )}

            <div className="pt-2">
              <Link
                href="/login"
                className="w-full block text-center py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <>
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800/60 text-rose-300 text-sm flex items-start space-x-2.5">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-900/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-brand-600/30 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Sending reset link...</span>
                  </>
                ) : (
                  <>
                    <span>Send Reset Link</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-xs text-slate-400 pt-2">
              Remember your password?{" "}
              <Link href="/login" className="text-brand-400 font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
