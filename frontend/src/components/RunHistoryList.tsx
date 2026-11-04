'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Trash2,
  Eye,
  AlertTriangle,
  Layers,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { NormalizedTestRun } from '../lib/types';

interface RunHistoryListProps {
  runs: NormalizedTestRun[];
  onSelectRun: (run: NormalizedTestRun) => void;
  onDeleteRun: (runId: string) => void;
  onClearAll: () => void;
}

export const RunHistoryList: React.FC<RunHistoryListProps> = ({
  runs,
  onSelectRun,
  onDeleteRun,
  onClearAll,
}) => {
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  // Sorted runs newest first for run history view
  const sortedRuns = [...runs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Layers className="h-4 w-4 text-blue-600" aria-hidden="true" />
          <h3 className="text-sm font-bold text-slate-900">
            Saved Run History ({runs.length})
          </h3>
        </div>
        {runs.length > 0 && (
          <button
            onClick={() => setShowConfirmClear(true)}
            className="inline-flex items-center space-x-1 text-xs text-rose-600 hover:text-rose-800 font-medium px-2.5 py-1 rounded-md hover:bg-rose-50 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Clear All History</span>
          </button>
        )}
      </div>

      {/* Runs List */}
      <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
        {sortedRuns.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No test runs stored yet. Upload a report or load demo runs above.
          </div>
        ) : (
          sortedRuns.map((run) => (
            <div
              key={run.run_id}
              className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-xs text-slate-900">{run.run_name}</span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    ({run.summary.total} tests)
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-[11px] text-slate-500">
                  <span className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1 text-slate-400" />
                    {new Date(run.timestamp).toLocaleString()}
                  </span>
                  <span className="flex items-center font-mono">
                    <Clock className="h-3 w-3 mr-1 text-slate-400" />
                    {run.summary.duration_seconds.toFixed(2)}s
                  </span>
                </div>
              </div>

              {/* Status Breakdown & Actions */}
              <div className="flex items-center space-x-3 self-end sm:self-center">
                <div className="flex items-center space-x-1.5 text-xs">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-medium">
                    {run.summary.passed}P
                  </span>
                  {(run.summary.failed > 0 || run.summary.errored > 0) && (
                    <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-mono font-medium">
                      {run.summary.failed + run.summary.errored}F
                    </span>
                  )}
                  {run.summary.skipped > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-mono font-medium">
                      {run.summary.skipped}S
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => onSelectRun(run)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="Inspect run test cases"
                    aria-label={`Inspect ${run.run_name}`}
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDeleteRun(run.run_id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    title="Delete this run from local history"
                    aria-label={`Delete ${run.run_name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Confirmation Modal for Clear All */}
      {showConfirmClear && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-modal-title"
        >
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="h-9 w-9 rounded-full bg-rose-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h4 id="clear-modal-title" className="text-sm font-bold text-slate-900">
                Clear All Test Runs?
              </h4>
            </div>
            <p className="text-xs text-slate-600">
              Are you sure you want to delete all {runs.length} test runs from this browser&apos;s
              local storage? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowConfirmClear(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirmClear(false);
                  onClearAll();
                }}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md transition-colors shadow-xs"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
