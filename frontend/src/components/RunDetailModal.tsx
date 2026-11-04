'use client';

import React, { useEffect } from 'react';
import { X, CheckCircle2, XCircle, AlertTriangle, HelpCircle, Clock, Calendar } from 'lucide-react';
import { NormalizedTestRun, TestCaseStatus } from '../lib/types';

interface RunDetailModalProps {
  run: NormalizedTestRun | null;
  onClose: () => void;
}

export const RunDetailModal: React.FC<RunDetailModalProps> = ({ run, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!run) return null;

  const renderStatusBadge = (status: TestCaseStatus) => {
    switch (status) {
      case 'passed':
        return (
          <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" aria-hidden="true" />
            PASS
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="h-3 w-3 mr-1 text-rose-600" aria-hidden="true" />
            FAIL
          </span>
        );
      case 'errored':
        return (
          <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
            <AlertTriangle className="h-3 w-3 mr-1 text-amber-700" aria-hidden="true" />
            ERROR
          </span>
        );
      case 'skipped':
        return (
          <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
            <HelpCircle className="h-3 w-3 mr-1 text-slate-500" aria-hidden="true" />
            SKIP
          </span>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="run-modal-title"
    >
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-3xl w-full overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between bg-slate-50/80">
          <div>
            <h3 id="run-modal-title" className="text-base font-bold text-slate-900">
              Run Details: {run.run_name}
            </h3>
            <div className="text-xs text-slate-500 mt-0.5 flex items-center space-x-3">
              <span className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {new Date(run.timestamp).toLocaleString()}
              </span>
              <span className="flex items-center font-mono">
                <Clock className="h-3 w-3 mr-1" />
                {run.summary.duration_seconds.toFixed(2)}s
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors"
            aria-label="Close run details"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Summary Pills */}
          <div className="grid grid-cols-4 gap-2 text-center text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div>
              <span className="text-slate-500 block">Total Tests</span>
              <span className="text-sm font-bold text-slate-800">{run.summary.total}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Passed</span>
              <span className="text-sm font-bold text-emerald-700">{run.summary.passed}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Failed / Errored</span>
              <span className="text-sm font-bold text-rose-700">
                {run.summary.failed + run.summary.errored}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Skipped</span>
              <span className="text-sm font-bold text-slate-700">{run.summary.skipped}</span>
            </div>
          </div>

          {/* Test cases list */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Test Cases in this Run ({run.test_cases.length})
            </h4>
            <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {run.test_cases.map((tc, idx) => (
                <div key={`${tc.id}-${idx}`} className="p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">{tc.name}</div>
                      <div className="text-[11px] font-mono text-slate-500">
                        {tc.classname || tc.suite_name}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-slate-600 text-[11px]">
                        {tc.duration_seconds.toFixed(3)}s
                      </span>
                      {renderStatusBadge(tc.status)}
                    </div>
                  </div>
                  {tc.message && (
                    <div className="mt-1 p-2 rounded bg-rose-50/70 border border-rose-100 text-rose-900 font-mono text-[11px] break-all">
                      {tc.failure_type && (
                        <div className="font-bold text-rose-800">{tc.failure_type}:</div>
                      )}
                      <div>{tc.message}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
