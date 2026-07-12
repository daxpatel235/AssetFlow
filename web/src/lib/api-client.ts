// Browser fetch wrapper. Cookies ride along automatically (same-origin), so
// there's no token to attach or leak — the httpOnly session cookie does the work.
export class ApiError extends Error {
  constructor(
    message: string,
    public status = 0,
    public errors?: Record<string, string>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type Params = Record<string, string | number | undefined | null>;

function qs(params?: Params): string {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  return entries.length ? '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString() : '';
}

async function request<T>(path: string, opts: { method?: string; body?: unknown; params?: Params } = {}): Promise<T> {
  const { method = 'GET', body, params } = opts;
  const res = await fetch(`/api${path}${qs(params)}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: 'same-origin',
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }

  if (!res.ok) {
    const d = data as { message?: string; errors?: Record<string, string> } | null;
    throw new ApiError(d?.message || 'Request failed', res.status, d?.errors);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string, params?: Params) => request<T>(path, { params }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
