export type Paginated<T> = {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export function useAdminList<T>(endpoint: string) {
  const { adminFetch } = useAdminApi()
  const q = ref('')
  const page = ref(1)
  const perPage = ref(25)
  // Start true so list pages paint skeleton chrome before onMounted load().
  const loading = ref(true)
  const error = ref<string | null>(null)
  const result = ref<Paginated<T> | null>(null)

  async function load(extra: Record<string, string | number | boolean | undefined> = {}) {
    loading.value = true
    error.value = null
    try {
      const query: Record<string, string | number | boolean> = {
        page: page.value,
        per_page: perPage.value,
        ...Object.fromEntries(
          Object.entries(extra).filter(([, v]) => v !== undefined && v !== ''),
        ) as Record<string, string | number | boolean>,
      }
      if (q.value.trim()) {
        query.q = q.value.trim()
      }
      const res = await adminFetch<Paginated<T>>(endpoint, { query })
      result.value = res.data
    } catch (e: unknown) {
      error.value = (e as { data?: { message?: string } })?.data?.message || 'Failed to load'
      // Keep prior rows on refresh failure; clear on first load.
      if (!result.value) {
        result.value = null
      }
    } finally {
      loading.value = false
    }
  }


  return { q, page, perPage, loading, error, result, load }
}
