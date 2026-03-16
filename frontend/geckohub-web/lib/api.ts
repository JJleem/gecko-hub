const BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

export function apiClient(token: string) {
  const authHeader = { Authorization: `Bearer ${token}` };
  const jsonHeaders = { ...authHeader, 'Content-Type': 'application/json' };

  return {
    get: (path: string) =>
      fetch(`${BASE}${path}`, { headers: authHeader }),

    post: (path: string, body: unknown) =>
      fetch(`${BASE}${path}`, {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify(body),
      }),

    patch: (path: string, body: unknown) =>
      fetch(`${BASE}${path}`, {
        method: 'PATCH',
        headers: jsonHeaders,
        body: JSON.stringify(body),
      }),

    delete: (path: string) =>
      fetch(`${BASE}${path}`, { method: 'DELETE', headers: authHeader }),

    // FormData 전송용 (Content-Type은 브라우저가 boundary와 함께 자동 설정)
    postForm: (path: string, body: FormData) =>
      fetch(`${BASE}${path}`, {
        method: 'POST',
        headers: authHeader,
        body,
      }),

    patchForm: (path: string, body: FormData) =>
      fetch(`${BASE}${path}`, {
        method: 'PATCH',
        headers: authHeader,
        body,
      }),
  };
}
