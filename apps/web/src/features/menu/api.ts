export type MenuItem = { id: number; name: string; price: number };

export async function fetchMenu(): Promise<MenuItem[]> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 10000);

  try {
    const res = await fetch('/api/menu', {
      headers: { Accept: 'application/json' },
      cache: 'no-store', // dev เท่านั้น
      signal: ctl.signal,
    });
    if (!res.ok) {
      // ให้ React Query เข้าสู่ error state
      throw new Error(`HTTP ${res.status}`);
    }
    const json = await res.json();
    // ต้องคืน array เสมอ
    return Array.isArray(json?.items) ? json.items : [];
  } catch (err) {
    console.error('fetchMenu failed:', err);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
