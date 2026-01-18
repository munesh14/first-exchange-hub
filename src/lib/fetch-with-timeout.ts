/**
 * Fetch with timeout utility
 * Prevents indefinite waiting on failed/slow network connections
 */

export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = 5000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms: ${url}`);
    }
    throw error;
  }
}

/**
 * Fetch JSON with timeout
 * Convenience method for JSON responses
 */
export async function fetchJSONWithTimeout<T = any>(
  url: string,
  options: RequestInit = {},
  timeout = 5000
): Promise<T> {
  const response = await fetchWithTimeout(url, options, timeout);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HTTP ${response.status}: ${error}`);
  }

  return response.json();
}
