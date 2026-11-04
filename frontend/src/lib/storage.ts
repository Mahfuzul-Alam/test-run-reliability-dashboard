import { NormalizedTestRun } from './types';

const STORAGE_KEY = 'runlens_test_runs_v1';

export interface StorageStatus {
  isAvailable: boolean;
  itemCount: number;
  estimatedBytes: number;
  errorMessage?: string;
}

/**
 * Checks if localStorage is available and accessible.
 */
export function checkStorageAvailability(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    const testKey = '__runlens_storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Loads all saved test runs from browser localStorage.
 */
export function loadSavedRuns(): NormalizedTestRun[] {
  if (!checkStorageAvailability()) {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    console.error('Failed to parse saved runs from localStorage:', err);
    return [];
  }
}

/**
 * Saves all runs to localStorage, catching quota or serialization errors.
 */
export function persistRuns(runs: NormalizedTestRun[]): { success: boolean; error?: string } {
  if (!checkStorageAvailability()) {
    return {
      success: false,
      error: 'Browser local storage is not accessible in this session.',
    };
  }
  try {
    const serialized = JSON.stringify(runs);
    window.localStorage.setItem(STORAGE_KEY, serialized);
    return { success: true };
  } catch (err: any) {
    if (err && (err.name === 'QuotaExceededError' || err.code === 22 || err.code === 1014)) {
      return {
        success: false,
        error:
          'Browser storage limit reached. Please remove older test runs to free up storage.',
      };
    }
    return {
      success: false,
      error: 'An unexpected error occurred while saving runs to browser storage.',
    };
  }
}

/**
 * Adds a new run to localStorage.
 */
export function appendRun(newRun: NormalizedTestRun): { success: boolean; error?: string } {
  const currentRuns = loadSavedRuns();
  // Filter out any duplicate with the same run_id
  const updated = [...currentRuns.filter((r) => r.run_id !== newRun.run_id), newRun];
  return persistRuns(updated);
}

/**
 * Deletes a single run by run_id.
 */
export function removeRun(runId: string): { success: boolean; error?: string } {
  const currentRuns = loadSavedRuns();
  const filtered = currentRuns.filter((r) => r.run_id !== runId);
  return persistRuns(filtered);
}

/**
 * Clears all runs from localStorage.
 */
export function clearStorage(): { success: boolean; error?: string } {
  if (!checkStorageAvailability()) {
    return { success: false, error: 'Browser storage unavailable.' };
  }
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    return { success: true };
  } catch (err) {
    return { success: false, error: 'Failed to clear browser storage.' };
  }
}
