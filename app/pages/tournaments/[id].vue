<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin-auth'] })
const route = useRoute()
const { adminFetch } = useAdminApi()
const toast = useToast()
const isNew = computed(() => route.params.id === 'new')
const loading = ref(!isNew.value)
const saving = ref(false)
const seasons = ref<Array<Record<string, unknown>>>([])
const form = reactive({
  owner_id: '' as string | number,
  name: '',
  slug: '',
  description: '',
  reference_id: '',
  logo: '',
  date: '',
  tournament_type: '',
  is_public: false,
})

onMounted(async () => {
  if (isNew.value) return
  try {
    const res = await adminFetch<{ tournament: Record<string, unknown> & { seasons?: Array<Record<string, unknown>> } }>(`admin/tournaments/${route.params.id}`)
    const t = res.data.tournament
    form.owner_id = t.owner_id as number
    form.name = String(t.name || '')
    form.slug = String(t.slug || '')
    form.description = String(t.description || '')
    form.reference_id = String(t.reference_id || '')
    form.logo = String(t.logo || '')
    form.date = t.date ? String(t.date).slice(0, 16) : ''
    form.tournament_type = String(t.tournament_type || '')
    form.is_public = Boolean(t.is_public)
    seasons.value = t.seasons || []
  } finally {
    loading.value = false
  }
})

async function save() {
  saving.value = true
  try {
    const body: Record<string, unknown> = {
      ...form,
      owner_id: Number(form.owner_id),
      date: form.date || null,
    }
    if (isNew.value) {
      const res = await adminFetch<{ tournament: { id: number } }>('admin/tournaments', { method: 'POST', body })
      toast.add({ title: 'Tournament created', color: 'success' })
      await navigateTo(`/tournaments/${res.data.tournament.id}`)
    } else {
      await adminFetch(`admin/tournaments/${route.params.id}`, { method: 'PUT', body })
      toast.add({ title: 'Tournament updated', color: 'success' })
    }
  } catch (e: unknown) {
    toast.add({ title: (e as { data?: { message?: string } })?.data?.message || 'Save failed', color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <AdminPageHeader :title="isNew ? 'New tournament' : `Tournament #${route.params.id}`">
      <template #actions><UButton to="/tournaments" variant="ghost" color="neutral" label="Back" /></template>
    </AdminPageHeader>

    <AdminFormSkeleton v-if="loading" :fields="7" />
    <div v-else class="grid gap-6 lg:grid-cols-[1fr_280px]">

      <form class="space-y-4 rounded-xl border border-white/10 bg-graphite-900/70 p-6" @submit.prevent="save">
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="Owner user ID"><UInput v-model="form.owner_id" type="number" required class="w-full font-mono" /></UFormField>
          <UFormField label="Reference ID"><UInput v-model="form.reference_id" required class="w-full font-mono" /></UFormField>
        </div>
        <UFormField label="Name"><UInput v-model="form.name" required class="w-full" /></UFormField>
        <UFormField label="Slug"><UInput v-model="form.slug" class="w-full font-mono" /></UFormField>
        <UFormField label="Description"><UInput v-model="form.description" class="w-full" /></UFormField>
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="Type"><UInput v-model="form.tournament_type" class="w-full" /></UFormField>
          <UFormField label="Date"><UInput v-model="form.date" type="datetime-local" class="w-full font-mono" /></UFormField>
        </div>
        <UFormField label="Logo URL"><UInput v-model="form.logo" class="w-full" /></UFormField>
        <UCheckbox v-model="form.is_public" label="Public" />
        <UButton type="submit" color="primary" :loading="saving" :label="isNew ? 'Create' : 'Save changes'" />
      </form>

      <aside v-if="!isNew" class="rounded-xl border border-white/10 bg-graphite-900/70 p-4">
        <p class="font-mono text-[10px] uppercase tracking-widest text-graphite-500">
          Seasons
        </p>
        <ul v-if="seasons.length" class="mt-3 space-y-2">
          <li
            v-for="s in seasons"
            :key="String(s.id)"
            class="rounded-md border border-white/8 px-3 py-2 text-sm"
          >
            <span class="font-mono text-xs text-ops-300">#{{ s.id }}</span>
            <span class="ml-2 text-graphite-200">{{ s.name || s.title || 'Season' }}</span>
          </li>
        </ul>
        <p v-else class="mt-3 text-sm text-graphite-500">
          No seasons attached.
        </p>
        <p class="mt-4 text-xs text-graphite-500">
          Rounds, standings, and prizes remain in Filament for this ship.
        </p>
      </aside>
    </div>
  </div>
</template>
