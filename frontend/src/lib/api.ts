const BASE_URL = import.meta.env.VITE_API_URL as string

// Token storage key — kept in sync with AuthContext (F2)
export const TOKEN_KEY = 'abstract_token'

// ─── Error ────────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

async function request<T>(
  method: Method,
  path: string,
  body?: unknown,
  isFormData = false,
): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY)

  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (body && !isFormData) headers['Content-Type'] = 'application/json'

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: isFormData
      ? (body as FormData)
      : body !== undefined
        ? JSON.stringify(body)
        : undefined,
  })

  if (!res.ok) {
    let message = res.statusText
    try {
      const data = await res.json()
      message = data?.message ?? message
    } catch {
      // keep statusText
    }
    throw new ApiError(res.status, message)
  }

  // 204 No Content
  if (res.status === 204) return undefined as T

  return res.json() as Promise<T>
}

// ─── Typed helpers ────────────────────────────────────────────────────────────

export const api = {
  get: <T>(path: string) =>
    request<T>('GET', path),

  post: <T>(path: string, body?: unknown) =>
    request<T>('POST', path, body),

  postForm: <T>(path: string, form: FormData) =>
    request<T>('POST', path, form, true),

  patch: <T>(path: string, body?: unknown) =>
    request<T>('PATCH', path, body),

  put: <T>(path: string, body?: unknown) =>
    request<T>('PUT', path, body),

  del: <T = void>(path: string) =>
    request<T>('DELETE', path),
}