'use client';

import React from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Layers,
  HelpCircle,
  FileCheck2,
} from 'lucide-react';
import { AggregateTestCase, NormalizedTestRun } from '../lib/types';

interface MetricCardsProps {
  runs: NormalizedTestRun[];
  aggregateTests: AggregateTestCase[];
}

export const MetricCards: React.FC<MetricCardsProps> = ({ runs, aggregateTests }) => {
  const totalRuns = runs.length;
  const totalTrackedTests = aggregateTests.length;

  const possibleFlakyCount = aggregateTests.filter((t) => t.isPossibleFlaky).length;

  // Compute latest aggregate status breakdown
  let latestPassed = 0;
  let latestFailed = 0;
  let latestErrored = 0;
  let latestSkipped = 0;
  let totalReportedDuration = 0;

  for (const t of aggregateTests) {
    if (t.latestStatus === 'passed') latestPassed++;
    else if (t.latestStatus === 'failed') latestFailed++;
    else if (t.latestStatus === 'errored') latestErrored++;
    else if (t.latestStatus === 'skipped') latestSkipped++;
  }

  for (const r of runs) {
    totalReportedDuration += r.summary.duration_seconds;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* Total Recorded Runs */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Recorded Runs</span>
          <Layers className="h-4 w-4 text-blue-600" aria-hidden="true" />
        </div>
        <div className="mt-2 flex items-baseline">
          <span className="text-2xl font-bold text-slate-900">{totalRuns}</span>
          <span className="ml-1 text-xs text-slate-500">runs</span>
        </div>
      </div>

      {/* Unique Tracked Tests */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Tracked Tests</span>
          <FileCheck2 className="h-4 w-4 text-indigo-600" aria-hidden="true" />
        </div>
        <div className="mt-2 flex items-baseline">
          <span className="text-2xl font-bold text-slate-900">{totalTrackedTests}</span>
          <span className="ml-1 text-xs text-slate-500">cases</span>
        </div>
      </div>

      {/* Latest Passed */}
      <div className="bg-white p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/20 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-800">Latest Passed</span>
          <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
        </div>
        <div className="mt-2 flex items-baseline">
          <span className="text-2xl font-bold text-emerald-900">{latestPassed}</span>
          <span className="ml-2 text-xs font-medium text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
            PASS
          </span>
        </div>
      </div>

      {/* Latest Failed / Errors */}
      <div className="bg-white p-3.5 rounded-lg border border-rose-200 bg-rose-50/20 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-rose-800">Failed / Errors</span>
          <XCircle className="h-4 w-4 text-rose-600" aria-hidden="true" />
        </div>
        <div className="mt-2 flex items-baseline">
          <span className="text-2xl font-bold text-rose-900">{latestFailed + latestErrored}</span>
          <span className="ml-2 text-xs font-medium text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
            FAIL/ERR
          </span>
        </div>
      </div>

      {/* Latest Skipped */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Latest Skipped</span>
          <HelpCircle className="h-4 w-4 text-slate-400" aria-hidden="true" />
        </div>
        <div className="mt-2 flex items-baseline">
          <span className="text-2xl font-bold text-slate-800">{latestSkipped}</span>
          <span className="ml-2 text-xs font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
            SKIP
          </span>
        </div>
      </div>

      {/* Possible Flaky Signal */}
      <div
        className={`p-3.5 rounded-lg border shadow-2xs ${
          possibleFlakyCount > 0
            ? 'bg-amber-50/60 border-amber-300'
            : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <span
            className={`text-xs font-semibold ${
              possibleFlakyCount > 0 ? 'text-amber-900' : 'text-slate-600'
            }`}
          >
            Possible Flaky
          </span>
          <AlertTriangle
            className={`h-4 w-4 ${
              possibleFlakyCount > 0 ? 'text-amber-600 animate-pulse' : 'text-slate-400'
            }`}
            aria-hidden="true"
          />
        </div>
        <div className="mt-2 flex items-baseline">
          <span
            className={`text-2xl font-bold ${
              possibleFlakyCount > 0 ? 'text-amber-950' : 'text-slate-800'
            }`}
          >
            {possibleFlakyCount}
          </span>
          <span
            className={`ml-2 text-xs font-medium px-1.5 py-0.5 rounded ${
              possibleFlakyCount > 0
                ? 'text-amber-800 bg-amber-100 border border-amber-300'
                : 'text-slate-600 bg-slate-100'
            }`}
          >
            SIGNAL
          </span>
        </div>
      </div>
    </div>
  );
};
