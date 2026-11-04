import { AggregateTestCase, NormalizedTestRun, TestCaseStatus } from './types';

/**
 * Computes aggregated metrics and flakiness heuristic across all recorded test runs.
 *
 * Flakiness Heuristic Rule:
 * A test case is marked as "Possible flaky" ONLY when:
 * 1. It has at least 5 non-skipped recorded run outcomes (pass, fail, or error).
 * 2. It has at least one passed outcome.
 * 3. It has at least one failed or errored outcome.
 *
 * Note: This classification is a heuristic indicator, not a definitive diagnosis.
 * Variations across runs may also stem from environmental changes, test data differences,
 * or concurrent code modifications.
 */
export function computeAggregatedTestCases(runs: NormalizedTestRun[]): AggregateTestCase[] {
  const map = new Map<string, AggregateTestCase>();

  // Ensure runs are processed in chronological order (oldest to newest)
  const sortedRuns = [...runs].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  for (const run of sortedRuns) {
    for (const tc of run.test_cases) {
      let agg = map.get(tc.id);
      if (!agg) {
        agg = {
          id: tc.id,
          name: tc.name,
          classname: tc.classname,
          suite_name: tc.suite_name,
          latestStatus: tc.status,
          latestDuration: tc.duration_seconds,
          totalRuns: 0,
          passCount: 0,
          failureCount: 0,
          skippedCount: 0,
          nonSkippedRuns: 0,
          failureRate: 0,
          isPossibleFlaky: false,
          runHistory: [],
        };
        map.set(tc.id, agg);
      }

      // Update latest status and duration
      agg.latestStatus = tc.status;
      agg.latestDuration = tc.duration_seconds;
      agg.totalRuns += 1;

      if (tc.status === 'passed') {
        agg.passCount += 1;
        agg.nonSkippedRuns += 1;
      } else if (tc.status === 'failed' || tc.status === 'errored') {
        agg.failureCount += 1;
        agg.nonSkippedRuns += 1;
      } else if (tc.status === 'skipped') {
        agg.skippedCount += 1;
      }

      agg.runHistory.push({
        run_id: run.run_id,
        run_name: run.run_name,
        timestamp: run.timestamp,
        status: tc.status,
        duration_seconds: tc.duration_seconds,
        message: tc.message,
        failure_type: tc.failure_type,
      });
    }
  }

  // Finalize failure rates and flakiness heuristics
  const results: AggregateTestCase[] = [];
  for (const agg of Array.from(map.values())) {
    if (agg.nonSkippedRuns > 0) {
      agg.failureRate = Math.round((agg.failureCount / agg.nonSkippedRuns) * 100);
    } else {
      agg.failureRate = 0;
    }

    // Heuristic: >= 5 non-skipped recorded outcomes, with >= 1 pass and >= 1 failure/error
    agg.isPossibleFlaky =
      agg.nonSkippedRuns >= 5 && agg.passCount >= 1 && agg.failureCount >= 1;

    results.push(agg);
  }

  return results;
}
