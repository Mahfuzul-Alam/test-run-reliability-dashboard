import { NormalizedTestRun } from './types';

const DEFAULT_API_URL = 'http://localhost:8000';

export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/+$/, '');
  }
  return DEFAULT_API_URL;
}

export async function checkApiHealth(): Promise<{ isHealthy: boolean; service?: string }> {
  try {
    const baseUrl = getApiBaseUrl();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return { isHealthy: true, service: data.service };
    }
    return { isHealthy: false };
  } catch {
    return { isHealthy: false };
  }
}

export async function uploadJUnitReport(file: File): Promise<NormalizedTestRun> {
  // Local validation
  const maxBytes = 2 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error('File exceeds the 2 MB limit. Please upload a smaller JUnit XML report.');
  }

  const name = file.name.toLowerCase();
  if (!name.endsWith('.xml') && !name.endsWith('.junit') && !name.endsWith('.txt')) {
    throw new Error('Unsupported file type. Please upload a JUnit report ending in .xml or .junit.');
  }

  const formData = new FormData();
  formData.append('file', file);

  const baseUrl = getApiBaseUrl();
  const controller = new AbortController();
  // Allow up to 35s in case free Render service is cold-starting
  const timeoutId = setTimeout(() => controller.abort(), 35000);

  try {
    const res = await fetch(`${baseUrl}/api/v1/analyze`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      let errorMessage = `Server error (${res.status})`;
      try {
        const errorJson = await res.json();
        if (errorJson && errorJson.detail) {
          errorMessage = typeof errorJson.detail === 'string' ? errorJson.detail : JSON.stringify(errorJson.detail);
        }
      } catch {
        // Fallback to text
        const text = await res.text();
        if (text) errorMessage = text;
      }
      throw new Error(errorMessage);
    }

    const data: NormalizedTestRun = await res.json();
    return data;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(
        'Request timed out. The backend service may be cold-starting or waking from sleep. Please wait a moment and retry.'
      );
    }
    if (err.message && err.message.includes('Failed to fetch')) {
      throw new Error(
        'Unable to connect to the RunLens backend API. If running locally, verify the backend is running on port 8000. If deployed, the free web service might be waking from sleep.'
      );
    }
    throw err;
  }
}
