export type TestCaseStatus = 'passed' | 'failed' | 'errored' | 'skipped';

export interface TestCaseResult {
  id: string;
  name: string;
  classname: string;
  suite_name: string;
  status: TestCaseStatus;
  duration_seconds: number;
  message?: string | null;
  failure_type?: string | null;
}

export interface TestRunSummary {
  total: number;
  passed: number;
  failed: number;
  errored: number;
  skipped: number;
  duration_seconds: number;
}

export interface NormalizedTestRun {
  run_id: string;
  run_name: string;
  timestamp: string;
  summary: TestRunSummary;
  test_cases: TestCaseResult[];
}

export interface TestRunHistoryEntry {
  run_id: string;
  run_name: string;
  timestamp: string;
  status: TestCaseStatus;
  duration_seconds: number;
  message?: string | null;
  failure_type?: string | null;
}

export interface AggregateTestCase {
  id: string;
  name: string;
  classname: string;
  suite_name: string;
  latestStatus: TestCaseStatus;
  latestDuration: number;
  totalRuns: number;
  passCount: number;
  failureCount: number; // failed + errored
  skippedCount: number;
  nonSkippedRuns: number;
  failureRate: number; // percentage 0 to 100
  isPossibleFlaky: boolean;
  runHistory: TestRunHistoryEntry[];
}
