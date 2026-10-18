<script setup lang="ts">
import {
  analyticsError,
  useAnalyticsStatus,
  type FunnelStep
} from '~/composables/useAnalytics'

definePageMeta({ layout: 'admin', middleware: ['admin-auth'] })
const { adminFetch } = useAdminApi()
const { status, loadStatus } = useAnalyticsStatus()
const funnel = ref('create')
const days = ref(7)
const environment = ref('')
const loading = ref(true)
const error = ref<string | null>(null)
const steps = ref<FunnelStep[]>([])
let revision = 0
async function load() {
  const current = ++revision
  loading.value = true
  error.value = null
  try {
    if (!status.value) {
      const settings = await loadStatus()
      environment.value ||= settings.environment
    }
    if (!status.value?.ready) return
    const response = await adminFetch<{ steps: FunnelStep[] }>(
      'admin/analytics/funnels',
      {
        query: {
          funnel: funnel.value,
          days: days.value,
          environment: environment.value
        }
      }
    )
    if (current === revision) steps.value = response.data.steps
  } catch (failure) {
    if (current === revision) error.value = analyticsError(failure)
  } finally {
    if (current === revision) loading.value = false
  }
}
const conversion = computed(() =>
  steps.value[0]?.reached
    ? Math.round(
        (100 * (steps.value.at(-1)?.reached || 0)) / steps.value[0].reached
      )
    : 0
)
onMounted(load)
onBeforeUnmount(() => {
  revision++
})
</script>

<template>
  <div>
    <AdminPageHeader
      title="Tournament funnels"
      description="Find the step where attempts stop progressing, then inspect the events behind it."
    >
      <template #actions>
        <UButton
          to="/insights/events"
          color="neutral"
          variant="outline"
          label="Inspect events"
          icon="i-lucide-radar"
        />
      </template>
    </AdminPageHeader>
    <div
      v-if="status && !status.ready"
      class="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-4 text-sm text-amber-100"
    >
      <p class="font-semibold text-amber-50">
        Funnel UI is ready — staging data store is not
      </p>
      <p class="mt-1 text-amber-100/80">
        Filters and charts are live code, not a “coming soon” stub. Empty steps mean
        <code class="font-mono text-xs">analytics_events</code> is missing or empty on this API.
        Migrate + enable the analytics worker, then collect traffic from the customer UI.
      </p>
    </div>
    <UAlert
      v-else-if="status && !status.enabled"
      color="warning"
      title="Collection is disabled"
      description="These reports show previously recorded activity. No new events are being collected by this backend."
      class="mb-4"
    />

    <form
      class="mb-6 flex flex-wrap items-end gap-4 rounded-xl border border-white/10 bg-graphite-900/60 p-4"
      @submit.prevent="load"
    >
      <UFormField label="Funnel">
        <USelect
          v-model="funnel"
          :items="[
            { label: 'Create with fixtures', value: 'create' },
            { label: 'Create with EA data', value: 'create-ea' },
            { label: 'Join a tournament', value: 'join' }
          ]"
          class="min-w-56"
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
          class="min-w-40"
        />
      </UFormField>
      <UFormField label="Environment">
        <UInput
          v-model="environment"
          required
        />
      </UFormField>
      <UButton
        type="submit"
        label="Update report"
        :loading="loading"
      />
    </form>
    <UAlert
      v-if="error"
      color="error"
      :title="error"
      class="mb-4"
    />
    <div class="mb-6 flex flex-wrap gap-8 border-y border-white/10 py-5">
      <div>
        <p class="font-mono text-xs text-graphite-400">
          Attempts started
        </p>
        <p class="mt-1 text-3xl font-semibold text-white">
          {{ steps[0]?.reached ?? '—' }}
        </p>
      </div>
      <div>
        <p class="font-mono text-xs text-graphite-400">
          Completed
        </p>
        <p class="mt-1 text-3xl font-semibold text-white">
          {{ steps.at(-1)?.reached ?? '—' }}
        </p>
      </div>
      <div>
        <p class="font-mono text-xs text-graphite-400">
          Overall conversion
        </p>
        <p class="mt-1 text-3xl font-semibold text-ops-300">
          {{ conversion }}%
        </p>
      </div>
    </div>
    <div
      v-if="loading && !steps.length"
      class="space-y-4"
      aria-label="Loading funnel"
    >
      <USkeleton
        v-for="n in 4"
        :key="n"
        class="h-20 w-full"
      />
    </div>
    <ol
      v-else
      class="space-y-3"
      :aria-busy="loading"
    >
      <li
        v-for="(step, index) in steps"
        :key="step.step"
        class="rounded-xl border border-white/10 bg-graphite-900/60 p-4"
      >
        <div class="flex flex-wrap justify-between gap-3">
          <div class="flex min-w-0 items-start gap-3">
            <span class="font-mono text-sm text-ops-300">{{
              String(index + 1).padStart(2, '0')
            }}</span>
            <div>
              <p class="break-all text-sm text-white">
                {{ step.step.replaceAll('_', ' ') }}
              </p>
              <p class="mt-1 font-mono text-xs text-graphite-400">
                {{ step.reached }} reached · {{ step.dropped }} stopped before
                this step · {{ step.conversion }} from previous
              </p>
            </div>
          </div>
          <UButton
            :to="{
              path: '/insights/events',
              query: { environment, days, event: step.step.split(':')[0] }
            }"
            color="neutral"
            variant="ghost"
            size="xs"
            label="View events"
          />
        </div>
        <div class="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5">
          <div
            class="h-full rounded-full bg-ops-400"
            :style="{
              width: `${steps[0]?.reached ? Math.max(0, (100 * step.reached) / steps[0].reached) : 0}%`
            }"
          />
        </div>
      </li>
    </ol>
    <p class="mt-5 max-w-3xl text-xs leading-relaxed text-graphite-400">
      Ordered within a creation attempt or a joining session and tournament,
      with a 24-hour conversion window. Times are UTC. Recent attempts may still
      convert, and browser delivery is best effort. Missing steps indicate
      incomplete recorded journeys, not confirmed abandonment.
    </p>
  </div>
</template>
