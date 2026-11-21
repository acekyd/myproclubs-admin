export function safeTrim(value: unknown): string {
  return String(value ?? '').trim()
}

export function apiErrorMessage(error: unknown, fallback: string): string {
  const e = error as {
    statusCode?: number
    response?: { status?: number }
    data?: { message?: unknown } | string
    statusMessage?: string
    message?: string
  }
  const status = e.statusCode ?? e.response?.status
  if (status === 404) {
    return 'This API endpoint is not on the server yet. Deploy the latest API (main) and run migrations.'
  }
  if (typeof e.data === 'string' && safeTrim(e.data)) {
    return safeTrim(e.data).slice(0, 200)
  }
  if (e.data && typeof e.data === 'object' && 'message' in e.data) {
    const msg = safeTrim((e.data as { message?: unknown }).message)
    if (msg) return msg
  }
  return safeTrim(e.statusMessage) || safeTrim(e.message) || fallback
}