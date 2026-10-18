<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth'],
})

const { adminFetch } = useAdminApi()

const counts = ref<Record<string, number> | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    const res = await adminFetch<{ counts: Record<string, number> }>('admin/dashboard')
    counts.value = res.data.counts
  } catch (e: unknown) {
    error.value = (e as { data?: { message?: string } })?.data?.message || 'Failed to load dashboard'
  } finally {
    loading.value = false
  }
})

const cards = computed(() => [
  { key: 'users', label: 'Users', icon: 'i-lucide-users', to: '/users' },
  { key: 'clubs', label: 'Clubs', icon: 'i-lucide-shield', to: '/clubs' },
  { key: 'tournaments', label: 'Tournaments', icon: 'i-lucide-trophy', to: '/tournaments' },
  { key: 'failed_jobs', label: 'Failed jobs', icon: 'i-lucide-triangle-alert', to: '/operations' },
])
</script>

<template>
  <div>
    <AdminPageHeader
      title="Dashboard"
      description="Live operational snapshot of the MyProClubs platform."
    >
      <template #actions>
        <UButton to="/operations" color="primary" icon="i-lucide-wrench" label="Support actions" />
      </template>
    </AdminPageHeader>

    <p v-if="error" class="text-ops-400">
      {{ error }}
    </p>
    <div v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <NuxtLink
        v-for="(card, i) in cards"
        :key="card.key"
        :to="card.to"
        class="ops-enter group rounded-xl border border-white/10 bg-graphite-900/70 p-5 transition hover:border-ops-500/40 hover:bg-ops-500/5"
        :class="`ops-enter-delay-${Math.min(i + 1, 3)}`"
      >
        <div class="flex items-center justify-between">
          <UIcon :name="card.icon" class="size-5 text-ops-400" />
          <span class="font-mono text-[10px] uppercase tracking-widest text-graphite-500">{{ card.key }}</span>
        </div>
        <p class="mt-6 font-mono text-3xl font-semibold text-white">
          <span
            v-if="loading"
            class="inline-block h-8 w-16 animate-pulse rounded bg-white/10"
          />
          <span v-else>{{ counts?.[card.key] ?? 0 }}</span>
        </p>

        <p class="mt-1 text-sm text-graphite-400 group-hover:text-graphite-200">
          {{ card.label }}
        </p>
      </NuxtLink>
    </div>
  </div>
</template>
