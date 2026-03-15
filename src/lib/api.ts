const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api-staging.gordon.fi';

export async function apiFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(path, API_BASE);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const json = await res.json();
  return json.data ?? json;
}
