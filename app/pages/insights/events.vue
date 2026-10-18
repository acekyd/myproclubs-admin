<script setup lang="ts">
import {
  analyticsError,
  analyticsTimestamp,
  journeyTarget,
  useAnalyticsStatus,
  type AnalyticsPage,
  type ProductEvent
} from '~/composables/useAnalytics'

definePageMeta({ layout: 'admin', middleware: ['admin-auth'] })
const route = useRoute()
const { adminFetch } = useAdminApi()
const { status, loadStatus } = useAnalyticsStatus()
const filters = reactive({
  environment: String(route.query.environment || ''),
  days: [1, 7, 30, 90].includes(Number(route.query.days))
    ? Number(route.query.days)
    : 7,
  source: 'all',
  event: String(route.query.event || ''),
  user_id: String(route.query.user_id || ''),
  session_id: String(route.query.session_id || ''),
  failures_only: false
})
const q = ref('')
const page = ref(1)
const loading = ref(true)
const error = ref<string | null>(null)
const result = ref<AnalyticsPage<ProductEvent> | null>(null)
const selected = ref<ProductEvent | null>(null)
let controller: AbortController | undefined
let timer: ReturnType<typeof setTimeout> | undefined
let revision = 0

async function load() {
  const current = ++revision
  controller?.abort()
  controller = new AbortController()
  loading.value = true
  error.value = null
  try {
    if (!status.value || !status.value.ready) {
      const settings = await loadStatus()
      filters.environment ||= settings.environment
    }
    if (!status.value?.ready) return
    const query = Object.fromEntries(
      Object.entries({
        ...filters,
        source: filters.source === 'all' ? undefined : filters.source,
        q: q.value,
        page: page.value,
        per_page: 25,
        failures_only: filters.failures_only ? 1 : undefined
      }).filter(([, value]) => value !== '' && value !== undefined)
    )
    const response = await adminFetch<AnalyticsPage<ProductEvent>>(
      'admin/analytics/events',
      { query, signal: controller.signal }
    )
    if (current === revision) result.value = response.data
  } catch (failure) {
    if (current === revision && !controller.signal.aborted)
      error.value = analyticsError(failure)
  } finally {
    if (current === revision) loading.value = false
  }
}
function refresh() {
  status.value = null
  void load()
}
function apply() {
  page.value = 1
  void load()
}
function goPage(value: number) {
  page.value = value
  void load()
}
function journey(event: ProductEvent) {
  const target = journeyTarget(event)
  if (target)
    return {
      path: '/insights/journeys',
      query: { ...target, environment: filters.environment, days: filters.days }
    }
  return undefined
}
onMounted(load)
watch(q, () => {
  clearTimeout(timer)
  timer = setTimeout(apply, 300)
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
      title="Product events"
      description="Your event data, with browser actions and server outcomes in one place. All timestamps are UTC."
    >
      <template #actions>
        <UButton
          to="/insights/journeys"
          icon="i-lucide-route"
          color="neutral"
          variant="outline"
          label="Explore journeys"
        />
        <UButton
          icon="i-lucide-refresh-cw"
          color="neutral"
          variant="ghost"
          label="Refresh"
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
        Insights UI is ready — staging data store is not
      </p>
      <p class="mt-1 text-amber-100/80">
        This is not a placeholder screen. Run analytics migrations on the API host, start the
        <code class="font-mono text-xs">analytics</code> Redis worker, then refresh. Until
        <code class="font-mono text-xs">analytics_events</code> exists, event lists stay empty.
      </p>
      <ol class="mt-3 list-decimal space-y-1 pl-5 font-mono text-xs text-amber-100/90">
        <li>php artisan migrate (analytics_events + journey indexes)</li>
        <li>ANALYTICS_ENABLED=true + queue:work redis --queue=analytics</li>
        <li>NUXT_PUBLIC_TRACKING_ENABLED=true on customer UI (staging)</li>
      </ol>
    </div>
    <UAlert
      v-else-if="status && !status.enabled"
      color="warning"
      title="Collection is disabled"
      description="Historical events remain available. Enable ANALYTICS_ENABLED on the backend and NUXT_PUBLIC_TRACKING_ENABLED on the customer UI to collect new activity."
      class="mb-4"
    />

    <form
      class="mb-4 grid gap-3 rounded-xl border border-white/10 bg-graphite-900/60 p-4 sm:grid-cols-2 xl:grid-cols-4"
      @submit.prevent="apply"
    >
      <UFormField label="Environment">
        <UInput
          v-model="filters.environment"
          required
          class="w-full"
        />
      </UFormField>
      <UFormField label="Period">
        <USelect
          v-model="filters.days"
          :items="[
            { label: 'Last 24 hours', value: 1 },
            { label: 'Last 7 days', value: 7 },
            { label: 'Last 30 days', value: 30 },
            { label: 'Last 90 days', value: 90 }
          ]"
          class="w-full"
        />
      </UFormField>
      <UFormField label="Source">
        <USelect
          v-model="filters.source"
          :items="[
            { label: 'All sources', value: 'all' },
            { label: 'Browser', value: 'frontend' },
            { label: 'Server', value: 'backend' }
          ]"
          class="w-full"
        />
      </UFormField>
      <UFormField label="Exact event">
        <UInput
          v-model="filters.event"
          placeholder="tournament_join_blocked"
          class="w-full font-mono"
        />
      </UFormField>
      <UFormField label="User ID">
        <UInput
          v-model="filters.user_id"
          type="number"
          min="1"
          placeholder="Any user"
          class="w-full"
        />
      </UFormField>
      <UFormField label="Session ID">
        <UInput
          v-model="filters.session_id"
          placeholder="Session UUID"
          class="w-full font-mono"
        />
      </UFormField>
      <div class="flex items-end pb-2">
        <UCheckbox
          v-model="filters.failures_only"
          label="Failures and blockers only"
        />
      </div>
      <div class="flex items-end">
        <UButton
          type="submit"
          label="Apply filters"
          :loading="loading"
        />
      </div>
    </form>
    <AdminDataTable
      v-model:search="q"
      :columns="[
        { key: 'occurred_at', label: 'Occurred (UTC)', mono: true },
        { key: 'event', label: 'Event', mono: true },
        { key: 'source', label: 'Source' },
        { key: 'user_id', label: 'User', mono: true },
        { key: 'session_id', label: 'Session', mono: true }
      ]"
      :rows="result?.data || []"
      :loading="loading"
      :error="error"
      :page="result?.current_page"
      :last-page="result?.last_page"
      :total="result?.total"
      search-placeholder="Search event names…"
      @page="goPage"
      @row-click="selected = $event"
    >
      <template #cell-occurred_at="{ row }">
        {{ analyticsTimestamp(row.occurred_at) }}
      </template>
      <template #cell-event="{ row }">
        <span :class="/failed|blocked/.test(row.event) ? 'text-ops-300' : ''">{{
          row.event
        }}</span>
      </template>
      <template #cell-user_id="{ row }">
        <NuxtLink
          v-if="row.user_id"
          :to="`/users/${row.user_id}`"
          class="text-ops-300 hover:underline"
          @click.stop
        >#{{ row.user_id }}</NuxtLink><span
          v-else
          class="text-graphite-500"
        >Anonymous</span>
      </template>
      <template #cell-session_id="{ row }">
        <NuxtLink
          v-if="row.session_id"
          :to="journey(row)"
          class="text-ops-300 hover:underline"
          :title="row.session_id"
          @click.stop
        >{{ row.session_id.slice(0, 8) }}… ↗</NuxtLink><span v-else>—</span>
      </template>
    </AdminDataTable>
    <section
      v-if="selected"
      class="mt-6 rounded-xl border border-ops-500/30 bg-graphite-900/80 p-5"
      aria-label="Event details"
    >
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p class="font-mono text-xs uppercase tracking-widest text-ops-300">
            Event details
          </p>
          <h3 class="mt-2 break-all text-lg text-white">
            {{ selected.event }}
          </h3>
        </div>
        <div class="flex gap-2">
          <UButton
            v-if="journey(selected)"
            :to="journey(selected)"
            icon="i-lucide-route"
            label="View journey"
          /><UButton
            color="neutral"
            variant="ghost"
            label="Close details"
            @click="selected = null"
          />
        </div>
      </div>
      <dl class="my-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt class="text-graphite-400">
            Occurred (UTC)
          </dt>
          <dd class="font-mono text-xs">
            {{ analyticsTimestamp(selected.occurred_at) }}
          </dd>
        </div>
        <div>
          <dt class="text-graphite-400">
            Received (UTC)
          </dt>
          <dd class="font-mono text-xs">
            {{ analyticsTimestamp(selected.received_at) }}
          </dd>
        </div>
      </dl>
      <pre
        class="overflow-auto rounded-lg bg-black/20 p-4 font-mono text-xs text-graphite-200"
      >{{ JSON.stringify(selected, null, 2) }}</pre>
    </section>
  </div>
</template>
