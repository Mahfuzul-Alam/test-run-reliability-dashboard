'use client';

import React, { useMemo, useState } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Clock,
  ArrowUpDown,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { AggregateTestCase, TestCaseStatus } from '../lib/types';

interface TestCaseTableProps {
  testCases: AggregateTestCase[];
  onSelectTest: (test: AggregateTestCase) => void;
}

export const TestCaseTable: React.FC<TestCaseTableProps> = ({ testCases, onSelectTest }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSuite, setSelectedSuite] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'name' | 'failureRate' | 'runs' | 'duration'>('failureRate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Extract unique suites
  const suites = useMemo(() => {
    const set = new Set<string>();
    testCases.forEach((tc) => {
      if (tc.suite_name) set.add(tc.suite_name);
    });
    return Array.from(set).sort();
  }, [testCases]);

  // Filter & Search
  const filteredCases = useMemo(() => {
    return testCases.filter((tc) => {
      const matchesSearch =
        searchTerm === '' ||
        tc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tc.classname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tc.suite_name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSuite = selectedSuite === 'ALL' || tc.suite_name === selectedSuite;

      let matchesStatus = true;
      if (selectedStatus === 'flaky') {
        matchesStatus = tc.isPossibleFlaky;
      } else if (selectedStatus !== 'ALL') {
        matchesStatus = tc.latestStatus === selectedStatus;
      }

      return matchesSearch && matchesSuite && matchesStatus;
    });
  }, [testCases, searchTerm, selectedSuite, selectedStatus]);

  // Sort
  const sortedCases = useMemo(() => {
    return [...filteredCases].sort((a, b) => {
      let diff = 0;
      if (sortField === 'name') {
        diff = a.name.localeCompare(b.name);
      } else if (sortField === 'failureRate') {
        diff = a.failureRate - b.failureRate;
      } else if (sortField === 'runs') {
        diff = a.totalRuns - b.totalRuns;
      } else if (sortField === 'duration') {
        diff = a.latestDuration - b.latestDuration;
      }
      return sortOrder === 'asc' ? diff : -diff;
    });
  }, [filteredCases, sortField, sortOrder]);

  const toggleSort = (field: 'name' | 'failureRate' | 'runs' | 'duration') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

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
    <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
      {/* Controls & Filters */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search tests, classnames, suites..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-300 bg-white placeholder-slate-400 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              aria-label="Search test cases"
            />
          </div>

          <div className="flex items-center space-x-2">
            {/* Suite Filter */}
            <div className="flex items-center space-x-1.5 text-xs">
              <label htmlFor="suite-filter" className="text-slate-600 font-medium">
                Suite:
              </label>
              <select
                id="suite-filter"
                value={selectedSuite}
                onChange={(e) => setSelectedSuite(e.target.value)}
                className="text-xs py-1.5 px-2.5 rounded-md border border-slate-300 bg-white text-slate-800"
              >
                <option value="ALL">All Suites ({suites.length})</option>
                {suites.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-1.5 text-xs">
              <label htmlFor="status-filter" className="text-slate-600 font-medium">
                Status:
              </label>
              <select
                id="status-filter"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-xs py-1.5 px-2.5 rounded-md border border-slate-300 bg-white text-slate-800"
              >
                <option value="ALL">All Statuses</option>
                <option value="flaky">⚡ Possible Flaky Only</option>
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
                <option value="errored">Errored</option>
                <option value="skipped">Skipped</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-semibold">
              <th scope="col" className="py-3 px-4">
                <button
                  onClick={() => toggleSort('name')}
                  className="flex items-center space-x-1 hover:text-slate-900 focus:outline-hidden"
                >
                  <span>Test Case / Suite</span>
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th scope="col" className="py-3 px-3">
                Latest Status
              </th>
              <th scope="col" className="py-3 px-3">
                <button
                  onClick={() => toggleSort('duration')}
                  className="flex items-center space-x-1 hover:text-slate-900 focus:outline-hidden"
                >
                  <span>Duration</span>
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th scope="col" className="py-3 px-3">
                <button
                  onClick={() => toggleSort('runs')}
                  className="flex items-center space-x-1 hover:text-slate-900 focus:outline-hidden"
                >
                  <span>Runs Recorded</span>
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th scope="col" className="py-3 px-3">
                <button
                  onClick={() => toggleSort('failureRate')}
                  className="flex items-center space-x-1 hover:text-slate-900 focus:outline-hidden"
                >
                  <span>Failure Rate</span>
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th scope="col" className="py-3 px-3">
                Reliability Signal
              </th>
              <th scope="col" className="py-3 px-4 text-right">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedCases.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  No matching test cases found.
                </td>
              </tr>
            ) : (
              sortedCases.map((tc) => (
                <tr
                  key={tc.id}
                  onClick={() => onSelectTest(tc)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectTest(tc);
                    }
                  }}
                  tabIndex={0}
                  className="hover:bg-blue-50/40 cursor-pointer transition-colors focus:bg-blue-50/60 focus:outline-hidden"
                >
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{tc.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate max-w-xs sm:max-w-md">
                      {tc.classname || tc.suite_name}
                    </div>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    {renderStatusBadge(tc.latestStatus)}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap text-slate-700">
                    <span className="font-mono">{tc.latestDuration.toFixed(3)}s</span>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap text-slate-700">
                    <span className="font-medium">{tc.totalRuns}</span> runs
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            tc.failureRate > 0 ? 'bg-rose-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${tc.failureRate}%` }}
                        />
                      </div>
                      <span className="font-mono font-medium text-slate-700">
                        {tc.failureRate}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    {tc.isPossibleFlaky ? (
                      <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                        <AlertTriangle className="h-3 w-3 mr-1 text-amber-600" aria-hidden="true" />
                        Possible Flaky ({tc.passCount}P / {tc.failureCount}F)
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">
                        {tc.nonSkippedRuns < 5 ? `Insufficient runs (${tc.nonSkippedRuns}/5)` : 'Consistent'}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <span className="inline-flex items-center text-xs text-blue-600 font-medium group">
                      View
                      <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
