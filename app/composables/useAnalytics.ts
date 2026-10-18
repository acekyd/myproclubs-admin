export type EventProperties = Record<string, string | number | boolean | null>
export type ProductEvent = Record<string, unknown> & {
  id: string
  event: string
  source: 'frontend' | 'backend'
  environment: string
  user_id: number | null
  session_id: string | null
  anonymous_id: string | null
  flow_id: string | null
  tournament_id: number | null
  sequence: number | null
  occurred_at: string
  received_at: string
  properties: EventProperties
}
export type AnalyticsStatus = {
  ready: boolean
  enabled: boolean
  environment: string
  retention_days: number
}
export type AnalyticsPage<T> = {
  data: T[]
  current_page: number
  last_page: number
  total: number
  per_page: number
}
export type SessionRow = Record<string, unknown> & {
  session_id: string
  anonymous_id: string | null
  user_id: number | null
  user_count: number
  event_count: number
  page_views: number
  clicks: number
  first_at: string
  last_at: string
}
export type FunnelStep = {
  step: string
  reached: number
  dropped: number
  conversion: string
}
export type JourneyResponse = {
  events: AnalyticsPage<ProductEvent>
  summary: {
    events: number
    sessions: number
    first_at: string | null
    last_at: string | null
  }
  anonymous_context: string
}

export function analyticsTimestamp(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('en-GB', {
        timeZone: 'UTC',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3
      }).format(date)
}

export function analyticsError(error: unknown) {
  const failure = error as { data?: { message?: string } }
  return failure.data?.message || 'Could not load analytics. Try again.'
}

export function journeyTarget(event: ProductEvent) {
  if (event.session_id) return { session_id: event.session_id }
  if (event.user_id) return { user_id: String(event.user_id) }
  if (event.anonymous_id) return { anonymous_id: event.anonymous_id }
  if (event.flow_id) return { flow_id: event.flow_id }
  return null
}

export function eventDescription(event: ProductEvent) {
  const p = event.properties
  if (event.event === 'page_viewed')
    return `Visited ${p.path || p.route || 'a page'}`
  if (event.event === 'page_exited')
    return `Left ${p.path || p.route || 'a page'}`
  if (event.event === 'ui_clicked')
    return `Clicked ${p.element_label || p.element_id || p.element_tag || 'a control'}`
  if (event.event.startsWith('api_request_'))
    return `${p.method || 'GET'} ${p.endpoint || p.route || 'API'}${p.status_code ? ` · ${p.status_code}` : ''}`
  return event.event.replaceAll('_', ' ')
}

export function useAnalyticsStatus() {
  const { adminFetch } = useAdminApi()
  const status = ref<AnalyticsStatus | null>(null)
  async function loadStatus() {
    status.value = (
      await adminFetch<AnalyticsStatus>('admin/analytics/status')
    ).data
    return status.value
  }
  return { status, loadStatus }
}
