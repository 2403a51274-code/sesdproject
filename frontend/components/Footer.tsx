import React from "react";
import Link from "next/link";
import { Link2, Github, Shield, Cpu, Database, Zap } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/90 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
        {/* Brand */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center">
              <Link2 className="w-4 h-4 text-white transform -rotate-45" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              Link<span className="text-brand-400">Flow</span>
            </span>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed">
            Enterprise-grade URL shortening, click telemetry, and Redis-accelerated redirection platform built for scale.
          </p>
          <div className="flex items-center space-x-2 text-xs text-brand-300 bg-brand-950/60 border border-brand-800/40 px-3 py-1.5 rounded-full w-fit">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>SESD Capstone Engineering Project</span>
          </div>
        </div>

        {/* Product */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">Product</h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li><Link href="/#features" className="hover:text-white transition-colors">Core Features</Link></li>
            <li><Link href="/#how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
            <li><Link href="/#architecture" className="hover:text-white transition-colors">Architecture</Link></li>
            <li><Link href="/dashboard" className="hover:text-white transition-colors">User Dashboard</Link></li>
          </ul>
        </div>

        {/* Architecture */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">Technology Stack</h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-amber-400" /> Next.js & TypeScript</li>
            <li className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-emerald-400" /> Python FastAPI Engine</li>
            <li className="flex items-center gap-1.5"><Database className="w-3.5 h-3.5 text-sky-400" /> PostgreSQL & Alembic</li>
            <li className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-rose-400" /> Redis Cache-Aside Layer</li>
          </ul>
        </div>

        {/* Security & Access */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">Security & Reliability</h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-indigo-400" /> Argon2/Bcrypt Hashing</li>
            <li>JWT Multi-Factor Sessions</li>
            <li>Base62 Collision Resolution</li>
            <li>Anonymized Telemetry</li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <p>&copy; {new Date().getFullYear()} LinkFlow Platform. All rights reserved. Built for university portfolio demonstration.</p>
        <div className="flex items-center space-x-6">
          <Link href="/#architecture" className="hover:text-slate-300 transition-colors">System Architecture</Link>
          <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" className="hover:text-slate-300 transition-colors">FastAPI Swagger UI</a>
          <a href="http://localhost:8000/redoc" target="_blank" rel="noreferrer" className="hover:text-slate-300 transition-colors">ReDoc API Specs</a>
        </div>
      </div>
    </footer>
  );
}
