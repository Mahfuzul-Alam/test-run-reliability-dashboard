'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Header } from '../components/Header';
import { MetricCards } from '../components/MetricCards';
import { UploadSection } from '../components/UploadSection';
import { TestCaseTable } from '../components/TestCaseTable';
import { RunHistoryList } from '../components/RunHistoryList';
import { TestDetailModal } from '../components/TestDetailModal';
import { RunDetailModal } from '../components/RunDetailModal';
import { StorageNotice } from '../components/StorageNotice';
import { checkApiHealth } from '../lib/api';
import { computeAggregatedTestCases } from '../lib/flakiness';
import { SAMPLE_RUNS } from '../lib/samples';
import {
  appendRun,
  clearStorage,
  loadSavedRuns,
  persistRuns,
  removeRun,
} from '../lib/storage';
import { AggregateTestCase, NormalizedTestRun } from '../lib/types';
import { HelpCircle, RefreshCw, Sparkles } from 'lucide-react';

export default function Home() {
  const [runs, setRuns] = useState<NormalizedTestRun[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [selectedTest, setSelectedTest] = useState<AggregateTestCase | null>(null);
  const [selectedRun, setSelectedRun] = useState<NormalizedTestRun | null>(null);

  // Initialize from browser localStorage
  useEffect(() => {
    const saved = loadSavedRuns();
    setRuns(saved);
    setIsLoaded(true);
  }, []);

  // Check backend health
  const verifyApi = async () => {
    setApiStatus('checking');
    const res = await checkApiHealth();
    setApiStatus(res.isHealthy ? 'online' : 'offline');
  };

  useEffect(() => {
    verifyApi();
  }, []);

  // Compute aggregated tests across all stored runs
  const aggregateTests = useMemo(() => {
    return computeAggregatedTestCases(runs);
  }, [runs]);

  // Handlers
  const handleRunUploaded = (newRun: NormalizedTestRun) => {
    appendRun(newRun);
    setRuns((prev) => {
      const filtered = prev.filter((r) => r.run_id !== newRun.run_id);
      return [...filtered, newRun];
    });
  };

  const handleLoadSampleData = () => {
    // Merge or replace sample runs
    persistRuns(SAMPLE_RUNS);
    setRuns(SAMPLE_RUNS);
  };

  const handleDeleteRun = (runId: string) => {
    removeRun(runId);
    setRuns((prev) => prev.filter((r) => r.run_id !== runId));
  };

  const handleClearAll = () => {
    clearStorage();
    setRuns([]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header apiStatus={apiStatus} onRetryHealth={verifyApi} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Storage Notice */}
        <StorageNotice totalRuns={runs.length} />

        {/* Dashboard Top Metrics */}
        <MetricCards runs={runs} aggregateTests={aggregateTests} />

        {/* Upload & Exploration Section */}
        <UploadSection
          onRunUploaded={handleRunUploaded}
          onLoadSampleData={handleLoadSampleData}
          apiStatus={apiStatus}
        />

        {/* Empty State Banner if no runs exist */}
        {isLoaded && runs.length === 0 && (
          <div className="bg-white rounded-lg border-2 border-dashed border-slate-300 p-8 text-center space-y-3">
            <div className="inline-flex p-3 rounded-full bg-blue-50 text-blue-600">
              <Sparkles className="h-6 w-6" aria-hidden="true" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Test Runs Loaded Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Upload a JUnit XML test report from your CI pipeline or explore with our pre-built 6-run
              test dataset to see flakiness heuristic detection in action.
            </p>
            <div>
              <button
                onClick={handleLoadSampleData}
                className="inline-flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                <span>Load Sample Reports</span>
              </button>
            </div>
          </div>
        )}

        {/* Main Content Grid: Test Case Explorer & Run History */}
        {runs.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* 2 Cols on Large Screens: Test Case Table */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Test Case Explorer</h2>
                  <p className="text-xs text-slate-500">
                    Aggregated test outcomes, failure rates, and flakiness signals across saved runs.
                  </p>
                </div>
              </div>

              <TestCaseTable
                testCases={aggregateTests}
                onSelectTest={(test) => setSelectedTest(test)}
              />
            </div>

            {/* 1 Col: Saved Runs List & Info */}
            <div className="space-y-4">
              <RunHistoryList
                runs={runs}
                onSelectRun={(run) => setSelectedRun(run)}
                onDeleteRun={handleDeleteRun}
                onClearAll={handleClearAll}
              />

              {/* Heuristic Transparency Card */}
              <div className="rounded-lg border border-slate-200 bg-white p-4 text-xs space-y-2 shadow-2xs">
                <div className="flex items-center space-x-2 text-slate-800 font-semibold">
                  <HelpCircle className="h-4 w-4 text-blue-600 shrink-0" />
                  <span>Flakiness Heuristic Guide</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  RunLens marks a test as <strong>Possible flaky</strong> only when it has at least{' '}
                  <span className="font-semibold text-slate-800">5 non-skipped recorded runs</span> and
                  records at least <span className="font-semibold text-emerald-700">1 pass</span> and at
                  least <span className="font-semibold text-rose-700">1 failure or error</span>.
                </p>
                <p className="text-slate-500 text-[10px] pt-1 border-t border-slate-100">
                  This classification is an empirical signal, not a guarantee of non-determinism.
                  Environment variables, database resets, or code modifications can also produce
                  differing results.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <TestDetailModal testCase={selectedTest} onClose={() => setSelectedTest(null)} />
      <RunDetailModal run={selectedRun} onClose={() => setSelectedRun(null)} />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            <strong className="text-slate-700">RunLens</strong> — Test Run Reliability Dashboard.
            FastAPI + Next.js + Tailwind CSS.
          </div>
          <div>
            Built with memory-only parsing and client-side browser persistence.
          </div>
        </div>
      </footer>
    </div>
  );
}
