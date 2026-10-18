type ApiEnvelope<T> = {
  status: string
  message: string
  data: T
}

function normalizeBase(base: string) {
  return base.endsWith('/') ? base : `${base}/`
}

export function useAdminApi() {
  const config = useRuntimeConfig()
  const auth = useAuthStore()
  const toast = useToast()
  const baseURL = normalizeBase(config.public.apiBase as string)

  async function adminFetch<T>(path: string, options: Parameters<typeof $fetch<ApiEnvelope<T>>>[1] = {}) {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(options?.headers as Record<string, string> | undefined),
    }

    if (auth.token) {
      headers.Authorization = `Bearer ${auth.token}`
    }

    try {
      return await $fetch<ApiEnvelope<T>>(path.replace(/^\//, ''), {
        ...options,
        baseURL,
        headers,
      })
    } catch (error: unknown) {
      const err = error as {
        statusCode?: number
        response?: { status?: number }
        data?: { message?: string }
        statusMessage?: string
      }
      const status = err.statusCode ?? err.response?.status
      const message = err.data?.message || err.statusMessage || 'Request failed'

      if (status === 401 || status === 403) {
        auth.clearSession()
        if (import.meta.client && !window.location.pathname.startsWith('/login')) {
          toast.add({
            title: status === 403 ? 'Operator access required' : 'Session expired',
            color: 'error',
          })
          await navigateTo({
            path: '/login',
            query: { reason: status === 403 ? 'forbidden' : 'expired' },
          })
        }
      } else if (status && status >= 500 && import.meta.client) {
        // Surface SQL/server failures without dumping stack traces in the UI.
        const short = message.includes('SQLSTATE')
          ? 'Database error — table or query failed. Check API logs.'
          : message.slice(0, 160)
        toast.add({ title: short, color: 'error' })
      }

      throw error
    }
  }

  return { adminFetch, baseURL }
}
