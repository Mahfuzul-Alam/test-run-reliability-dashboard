'use client';

import React, { useEffect } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Clock,
  Info,
  Calendar,
} from 'lucide-react';
import { AggregateTestCase, TestCaseStatus } from '../lib/types';

interface TestDetailModalProps {
  testCase: AggregateTestCase | null;
  onClose: () => void;
}

export const TestDetailModal: React.FC<TestDetailModalProps> = ({ testCase, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!testCase) return null;

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
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full overflow-hidden my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between bg-slate-50/80">
          <div>
            <h3 id="modal-title" className="text-base font-bold text-slate-900">
              {testCase.name}
            </h3>
            <div className="text-xs font-mono text-slate-500 mt-0.5 break-all">
              {testCase.id}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors"
            aria-label="Close test details"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Summary Metric Ribbon */}
          <div className="grid grid-cols-4 gap-2 text-center p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block">Recorded Runs</span>
              <span className="text-sm font-bold text-slate-800">{testCase.totalRuns}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Passes</span>
              <span className="text-sm font-bold text-emerald-700">{testCase.passCount}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Failures/Errors</span>
              <span className="text-sm font-bold text-rose-700">{testCase.failureCount}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Failure Rate</span>
              <span className="text-sm font-bold text-slate-900">{testCase.failureRate}%</span>
            </div>
          </div>

          {/* Flakiness Heuristic Notice */}
          {testCase.isPossibleFlaky ? (
            <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-1">
              <div className="flex items-center font-semibold">
                <AlertTriangle className="h-4 w-4 text-amber-600 mr-1.5" />
                Heuristic Signal: Possible Flaky Test
              </div>
              <p className="text-amber-800">
                This test has recorded {testCase.passCount} pass(es) and {testCase.failureCount}{' '}
                failure(s) across {testCase.nonSkippedRuns} non-skipped runs.
              </p>
              <p className="text-[11px] text-amber-700 pt-1 border-t border-amber-200/60 mt-1">
                <strong>Heuristic Disclaimer:</strong> This indicator is a heuristic based on outcome
                variation across saved runs. It does not definitively prove test code defect. Changes in
                test environments, timing jitter, or code revisions can also produce divergent results.
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-xs flex items-start space-x-2">
              <Info className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-800">Classification: </span>
                {testCase.nonSkippedRuns < 5
                  ? `Insufficient history (${testCase.nonSkippedRuns}/5 non-skipped runs recorded) to evaluate flakiness heuristic.`
                  : testCase.failureCount === 0
                  ? 'Consistently passing across all recorded runs.'
                  : 'Consistently failing across recorded runs (deterministic failure).'}
              </div>
            </div>
          )}

          {/* Run History Timeline */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Outcome History Across Saved Runs ({testCase.runHistory.length})
            </h4>
            <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-60 overflow-y-auto">
              {testCase.runHistory.map((run, idx) => (
                <div key={`${run.run_id}-${idx}`} className="p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-slate-800">{run.run_name}</span>
                      <span className="text-[11px] text-slate-400 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {run.duration_seconds.toFixed(3)}s
                      </span>
                    </div>
                    {renderStatusBadge(run.status)}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(run.timestamp).toLocaleString()}
                  </div>
                  {run.message && (
                    <div className="mt-1 p-2 rounded bg-rose-50/70 border border-rose-100 text-rose-900 font-mono text-[11px] break-all">
                      {run.failure_type && (
                        <div className="font-bold text-rose-800">{run.failure_type}:</div>
                      )}
                      <div>{run.message}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
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
