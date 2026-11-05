'use client';

import React from 'react';
import { Activity, Github, RefreshCw, Server, AlertCircle } from 'lucide-react';

interface HeaderProps {
  apiStatus: 'checking' | 'online' | 'offline';
  onRetryHealth: () => void;
}

export const Header: React.FC<HeaderProps> = ({ apiStatus, onRetryHealth }) => {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">
            <Activity className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight text-slate-900">RunLens</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                v1.0
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Test Run Reliability Dashboard &amp; Flakiness Heuristics
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* API Health Indicator */}
          <div
            className="flex items-center space-x-2 text-xs px-2.5 py-1.5 rounded-md border bg-slate-50 border-slate-200"
            role="status"
            aria-live="polite"
          >
            <Server className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
            <span className="text-slate-600 font-medium hidden md:inline">API:</span>
            {apiStatus === 'checking' && (
              <span className="flex items-center text-amber-700 font-medium">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping mr-1.5" />
                Checking...
              </span>
            )}
            {apiStatus === 'online' && (
              <span className="flex items-center text-emerald-700 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-500 mr-1.5" />
                Online
              </span>
            )}
            {apiStatus === 'offline' && (
              <button
                onClick={onRetryHealth}
                title="API is waking or unreachable. Click to retry connection."
                className="flex items-center text-rose-700 font-medium hover:underline focus:outline-hidden"
              >
                <AlertCircle className="h-3 w-3 mr-1" />
                Asleep / Retry
                <RefreshCw className="h-2.5 w-2.5 ml-1" />
              </button>
            )}
          </div>

          {/* GitHub Link */}
          <a
            href="https://github.com/Mahfuzul-Alam/test-run-reliability-dashboard"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View source repository on GitHub"
            className="inline-flex items-center space-x-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-md transition-colors"
          >
            <Github className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </div>
    </header>
  );
};
