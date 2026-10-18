<script setup lang="ts">
import {
  analyticsError,
  analyticsTimestamp,
  eventDescription,
  useAnalyticsStatus,
  type AnalyticsPage,
  type JourneyResponse,
  type ProductEvent,
  type SessionRow
} from '~/composables/useAnalytics'

definePageMeta({ layout: 'admin', middleware: ['admin-auth'] })
type IdentityKind = 'user_id' | 'session_id' | 'anonymous_id' | 'flow_id'
const kinds: IdentityKind[] = [
  'session_id',
  'user_id',
  'anonymous_id',
  'flow_id'
]
const route = useRoute()
const router = useRouter()
const { adminFetch } = useAdminApi()
const { status, loadStatus } = useAnalyticsStatus()
const kind = ref<IdentityKind>('user_id')
const identity = ref('')
const environment = ref('')
const days = ref(7)
const source = ref('all')
const page = ref(1)
const loading = ref(true)
const error = ref<string | null>(null)
const sessions = ref<AnalyticsPage<SessionRow> | null>(null)
const journey = ref<JourneyResponse | null>(null)
const activeIdentity = ref<{ kind: IdentityKind, value: string } | null>(null)
const search = ref('')
let revision = 0
let controller: AbortController | undefined
let timer: ReturnType<typeof setTimeout> | undefined

function refresh() {
  status.value = null
  void load()
}
function readQuery() {
  const selected = kinds.find(
    key => typeof route.query[key] === 'string' && route.query[key]
  )
  kind.value = selected || 'user_id'
  identity.value = selected ? String(route.query[selected]) : ''
  environment.value
    = typeof route.query.environment === 'string'
      ? route.query.environment
      : status.value?.environment || ''
  const period = Number(route.query.days)
  days.value = [1, 7, 30, 90].includes(period) ? period : 7
  source.value = ['frontend', 'backend'].includes(String(route.query.source))
    ? String(route.query.source)
    : 'all'
  activeIdentity.value = selected
    ? { kind: selected, value: identity.value }
    : null
}
async function load() {
  const current = ++revision
  controller?.abort()
  controller = new AbortController()
  loading.value = true
  error.value = null
  try {
    if (!status.value || !status.value.ready) {
      const settings = await loadStatus()
      environment.value ||= settings.environment
    }
    if (!status.value?.ready) return
    const common = {
      environment: environment.value,
      days: days.value,
      page: page.value,
      per_page: activeIdentity.value ? 100 : 25,
      ...(source.value !== 'all' ? { source: source.value } : {})
    }
    if (activeIdentity.value) {
      const response = await adminFetch<JourneyResponse>(
        'admin/analytics/journey',
        {
          query: {
            ...common,
            [activeIdentity.value.kind]: activeIdentity.value.value
          },
          signal: controller.signal
        }
      )
      if (current === revision) journey.value = response.data
    } else {
      const response = await adminFetch<AnalyticsPage<SessionRow>>(
        'admin/analytics/sessions',
        {
          query: { ...common, ...(search.value ? { q: search.value } : {}) },
          signal: controller.signal
        }
      )
      if (current === revision) sessions.value = response.data
    }
  } catch (failure) {
    if (current === revision && !controller.signal.aborted)
      error.value = analyticsError(failure)
  } finally {
    if (current === revision) loading.value = false
  }
}
async function apply() {
  if (
    identity.value
    && (kind.value === 'user_id'
      ? !/^[1-9]\d*$/.test(identity.value.trim())
      : !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          identity.value.trim()
        ))
  ) {
    error.value
      = kind.value === 'user_id'
        ? 'Enter a positive numeric user ID.'
        : 'Enter a valid UUID.'
    return
  }
  const query = {
    environment: environment.value,
    days: String(days.value),
    ...(source.value !== 'all' ? { source: source.value } : {}),
    ...(identity.value.trim() ? { [kind.value]: identity.value.trim() } : {})
  }
  const target = router.resolve({ path: '/insights/journeys', query })
  if (target.fullPath === route.fullPath) {
    page.value = 1
    await load()
  } else await router.replace({ path: '/insights/journeys', query })
}
function goPage(value: number) {
  page.value = value
  void load()
}
function openSession(session: SessionRow) {
  return navigateTo({
    path: '/insights/journeys',
    query: {
      session_id: session.session_id,
      environment: environment.value,
      days: days.value
    }
  })
}
function relatedSession(event: ProductEvent) {
  return {
    path: '/insights/journeys',
    query: {
      session_id: event.session_id,
      environment: environment.value,
      days: days.value
    }
  }
}
function gap(index: number) {
  const events = journey.value?.events.data || []
  if (!index || !events[index - 1] || !events[index]) return null
  const ms
    = new Date(events[index]!.occurred_at).getTime()
      - new Date(events[index - 1]!.occurred_at).getTime()
  if (ms < 1000) return `+${ms} ms`
  if (ms < 60000) return `+${(ms / 1000).toFixed(1)} s`
  return `+${Math.floor(ms / 60000)} min`
}
onMounted(() => {
  readQuery()
  void load()
})
watch(
  () => route.fullPath,
  () => {
    page.value = 1
    journey.value = null
    sessions.value = null
    readQuery()
    void load()
  }
)
watch(search, () => {
  if (activeIdentity.value) return
  clearTimeout(timer)
  timer = setTimeout(() => {
    page.value = 1
    void load()
  }, 300)
})
onBeforeUnmount(() => {
  revision++
  controller?.abort()
  clearTimeout(timer)
})
</script>

<template>
  <div>
    <AdminPageHeader
      title="User journeys"
      description="Follow visits, clicks, tournament steps and API outcomes in timestamp order. All timestamps are UTC."
    >
      <template #actions>
        <UButton
          v-if="activeIdentity"
          :to="{ path: '/insights/journeys', query: { environment, days } }"
          label="All sessions"
          color="neutral"
          variant="outline"
          icon="i-lucide-arrow-left"
        />
        <UButton
          label="Refresh"
          color="neutral"
          variant="ghost"
          icon="i-lucide-refresh-cw"
          :loading="loading"
          @click="refresh"
        />
      </template>
    </AdminPageHeader>
    <div
      v-if="status && !status.ready"
      class="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-4 text-sm text-amber-100"
    >
      <p class="font-semibold text-amber-50">
        Journeys UI is ready — staging data store is not
      </p>
      <p class="mt-1 text-amber-100/80">
        Not a placeholder. Migrate
        <code class="font-mono text-xs">analytics_events</code>, run the analytics
        worker, then collect from the customer UI.
      </p>
    </div>
    <UAlert
      v-else-if="status && !status.enabled"
      title="Collection is disabled"
      description="Historical journeys remain readable. Enable collection on the backend and customer UI to see new activity."
      color="warning"
      class="mb-4"
    />
    <form
      class="mb-6 grid items-end gap-3 rounded-xl border border-white/10 bg-graphite-900/60 p-4 sm:grid-cols-2 xl:grid-cols-6"
      @submit.prevent="apply"
    >
      <UFormField label="Find by">
        <USelect
          v-model="kind"
          :items="[
            { label: 'User ID', value: 'user_id' },
            { label: 'Session ID', value: 'session_id' },
            { label: 'Anonymous ID', value: 'anonymous_id' },
            { label: 'Creation attempt', value: 'flow_id' }
          ]"
          class="w-full"
        />
      </UFormField>
      <UFormField
        label="Identifier"
        class="xl:col-span-2"
      >
        <UInput
          v-model="identity"
          :placeholder="
            kind === 'user_id'
              ? 'User ID, or leave blank for all sessions'
              : 'UUID'
          "
          class="w-full font-mono"
        />
      </UFormField>
      <UFormField label="Period">
        <USelect
          v-model="days"
          :items="[
            { label: 'Last 24 hours', value: 1 },
            { label: 'Last 7 days', value: 7 },
            { label: 'Last 30 days', value: 30 },
            { label: 'Last 90 days', value: 90 }
          ]"
          class="w-full"
        />
      </UFormField>
      <UFormField label="Environment">
        <UInput
          v-model="environment"
          required
          class="w-full"
        />
      </UFormField>
      <UButton
        type="submit"
        label="Explore journey"
        :loading="loading"
        icon="i-lucide-route"
      />
      <UFormField label="Source">
        <USelect
          v-model="source"
          :items="[
            { label: 'All sources', value: 'all' },
            { label: 'Browser', value: 'frontend' },
            { label: 'Server', value: 'backend' }
          ]"
          class="w-full"
        />
      </UFormField>
    </form>
    <UAlert
      v-if="error"
      :title="error"
      color="error"
      class="mb-4"
    />
    <template v-if="!activeIdentity">
      <div class="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 class="text-lg font-semibold text-white">
            Recent sessions
          </h3>
          <p class="mt-1 text-xs text-graphite-400">
            Open a session for its full trail, or search an account above.
          </p>
        </div>
      </div>
      <AdminDataTable
        v-model:search="search"
        :columns="[
          { key: 'session_id', label: 'Session', mono: true },
          { key: 'user_id', label: 'User', mono: true },
          { key: 'first_at', label: 'First seen (UTC)', mono: true },
          { key: 'last_at', label: 'Last seen (UTC)', mono: true },
          { key: 'page_views', label: 'Pages' },
          { key: 'clicks', label: 'Clicks' },
          { key: 'event_count', label: 'Events' }
        ]"
        :rows="sessions?.data || []"
        :loading="loading"
        :page="sessions?.current_page"
        :last-page="sessions?.last_page"
        :total="sessions?.total"
        search-placeholder="Sessions containing an event name…"
        @page="goPage"
        @row-click="openSession"
      >
        <template #cell-session_id="{ row }">
          <UButton
            variant="link"
            color="primary"
            :label="`${row.session_id.slice(0, 8)}…`"
            class="p-0 font-mono"
            @click.stop="openSession(row)"
          />
        </template>
        <template #cell-user_id="{ row }">
          <span
            v-if="row.user_count > 1"
            class="text-ops-300"
          >Multiple accounts</span><NuxtLink
            v-else-if="row.user_id"
            :to="{
              path: '/insights/journeys',
              query: { user_id: row.user_id, environment, days }
            }"
            class="text-ops-300 hover:underline"
            @click.stop
          >#{{ row.user_id }}</NuxtLink><span
            v-else
            class="text-graphite-500"
          >Anonymous</span>
        </template>
        <template #cell-first_at="{ row }">
          {{ analyticsTimestamp(row.first_at) }}
        </template><template #cell-last_at="{ row }">
          {{ analyticsTimestamp(row.last_at) }}
        </template>
      </AdminDataTable>
    </template>
    <template v-else>
      <div
        class="mb-5 flex flex-wrap justify-between gap-4 border-y border-white/10 py-4"
      >
        <div>
          <p
            class="font-mono text-[10px] uppercase tracking-widest text-ops-300"
          >
            {{ activeIdentity.kind.replaceAll('_', ' ') }}
          </p>
          <h3 class="mt-1 break-all font-mono text-sm text-white">
            {{ activeIdentity.value }}
          </h3>
        </div>
        <div class="flex gap-8">
          <div>
            <p class="text-xs text-graphite-400">
              Events
            </p>
            <p class="mt-1 text-2xl text-white">
              {{ journey?.summary.events ?? '—' }}
            </p>
          </div>
          <div>
            <p class="text-xs text-graphite-400">
              Sessions
            </p>
            <p class="mt-1 text-2xl text-white">
              {{ journey?.summary.sessions ?? '—' }}
            </p>
          </div>
        </div>
      </div>
      <p
        v-if="journey"
        class="mb-6 text-xs leading-relaxed text-graphite-400"
      >
        {{ journey.anonymous_context }} Client clocks can differ from the
        server; expand an event to compare occurrence and receipt time.
      </p>
      <div
        v-if="loading && !journey"
        class="space-y-4"
        aria-label="Loading journey"
      >
        <USkeleton
          v-for="n in 5"
          :key="n"
          class="h-24 w-full"
        />
      </div>
      <div
        v-else-if="!journey?.events.data.length"
        class="rounded-xl border border-dashed border-white/15 px-6 py-16 text-center"
      >
        <UIcon
          name="i-lucide-route"
          class="mx-auto size-8 text-graphite-500"
        />
        <h3 class="mt-3 text-lg text-white">
          No events in this window
        </h3>
        <p class="mt-2 text-sm text-graphite-400">
          Check the identifier, environment and collection settings, or widen
          the period.
        </p>
      </div>
      <ol
        v-else
        class="relative space-y-0 border-l border-white/10 ml-2"
        :aria-busy="loading"
        aria-label="Chronological user events"
      >
        <li
          v-for="(event, index) in journey.events.data"
          :key="event.id"
          class="relative pb-5 pl-6"
        >
          <span
            class="absolute -left-1.5 top-2 size-3 rounded-full border-2 border-graphite-950"
            :class="
              /failed|blocked/.test(event.event)
                ? 'bg-ops-400'
                : event.source === 'backend'
                  ? 'bg-sky-400'
                  : 'bg-graphite-400'
            "
          />
          <div
            class="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-graphite-400"
          >
            <time :datetime="event.occurred_at">{{
              analyticsTimestamp(event.occurred_at)
            }}</time><span
              v-if="gap(index)"
              class="text-graphite-500"
            >{{
              gap(index)
            }}</span><span
              :class="
                event.source === 'backend'
                  ? 'text-sky-300'
                  : 'text-graphite-300'
              "
            >{{ event.source === 'backend' ? 'SERVER' : 'BROWSER' }}</span><span v-if="event.user_id">User #{{ event.user_id }}</span><span v-else>Anonymous context</span>
          </div>
          <details
            class="mt-2 rounded-lg border border-white/8 bg-graphite-900/60 p-4"
          >
            <summary class="cursor-pointer text-sm font-medium text-white">
              <span
                :class="
                  /failed|blocked/.test(event.event) ? 'text-ops-300' : ''
                "
              >{{ eventDescription(event) }}</span><span class="ml-2 font-mono text-[10px] text-graphite-500">details</span>
            </summary>
            <p class="mt-3 break-all font-mono text-xs text-ops-300">
              {{ event.event }}
            </p>
            <dl class="mt-3 grid gap-3 text-xs sm:grid-cols-2">
              <div>
                <dt class="text-graphite-400">
                  Received (UTC)
                </dt>
                <dd class="mt-1 font-mono">
                  {{ analyticsTimestamp(event.received_at) }}
                </dd>
              </div>
              <div>
                <dt class="text-graphite-400">
                  Session
                </dt>
                <dd class="mt-1 break-all font-mono">
                  <NuxtLink
                    v-if="event.session_id"
                    :to="relatedSession(event)"
                    class="text-ops-300 hover:underline"
                  >{{ event.session_id }}</NuxtLink><span v-else>—</span>
                </dd>
              </div>
              <div>
                <dt class="text-graphite-400">
                  Sequence / event ID
                </dt>
                <dd class="mt-1 break-all font-mono">
                  {{ event.sequence ?? 'server' }} / {{ event.id }}
                </dd>
              </div>
              <div v-if="event.user_id">
                <dt class="text-graphite-400">
                  Account
                </dt>
                <dd class="mt-1">
                  <NuxtLink
                    :to="`/users/${event.user_id}`"
                    class="text-ops-300 hover:underline"
                  >Open user #{{ event.user_id }}</NuxtLink>
                </dd>
              </div>
            </dl>
            <pre
              class="mt-4 overflow-auto rounded bg-black/20 p-3 font-mono text-[11px] leading-relaxed text-graphite-300"
            >{{ JSON.stringify(event.properties, null, 2) }}</pre>
          </details>
        </li>
      </ol>
      <div
        v-if="journey && journey.events.last_page > 1"
        class="mt-2 flex items-center justify-between border-t border-white/10 py-4"
      >
        <UButton
          label="Previous"
          color="neutral"
          variant="outline"
          :disabled="loading || page <= 1"
          @click="goPage(page - 1)"
        /><span class="font-mono text-xs text-graphite-400">Page {{ journey.events.current_page }} /
          {{ journey.events.last_page }}</span><UButton
          label="Next"
          color="neutral"
          variant="outline"
          :disabled="loading || page >= journey.events.last_page"
          @click="goPage(page + 1)"
        />
      </div>
    </template>
  </div>
</template>
