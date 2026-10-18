<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin-auth'] })
const route = useRoute()
const { adminFetch } = useAdminApi()
const toast = useToast()
const loading = ref(true)
const saving = ref(false)
const form = reactive({
  fixture_id: '' as string | number,
  player_id: '' as string | number,
  goals: '' as string | number,
  assists: '' as string | number,
  man_of_the_match: false,
  rating: '' as string | number,
})

onMounted(async () => {
  try {
    const res = await adminFetch<{ player_stat: Record<string, unknown> }>(`admin/player-stats/${route.params.id}`)
    const s = res.data.player_stat
    form.fixture_id = s.fixture_id as number
    form.player_id = s.player_id as number
    form.goals = (s.goals as number) ?? ''
    form.assists = (s.assists as number) ?? ''
    form.man_of_the_match = Boolean(s.man_of_the_match)
    form.rating = (s.rating as number) ?? ''
  } finally {
    loading.value = false
  }
})

async function save() {
  saving.value = true
  try {
    await adminFetch(`admin/player-stats/${route.params.id}`, {
      method: 'PUT',
      body: {
        fixture_id: Number(form.fixture_id),
        player_id: Number(form.player_id),
        goals: form.goals === '' ? null : Number(form.goals),
        assists: form.assists === '' ? null : Number(form.assists),
        man_of_the_match: form.man_of_the_match,
        rating: form.rating === '' ? null : Number(form.rating),
      },
    })
    toast.add({ title: 'Player stat updated', color: 'success' })
  } catch (e: unknown) {
    toast.add({ title: (e as { data?: { message?: string } })?.data?.message || 'Save failed', color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <AdminPageHeader :title="`Player stat #${route.params.id}`">
      <template #actions><UButton to="/player-stats" variant="ghost" color="neutral" label="Back" /></template>
    </AdminPageHeader>
    <AdminFormSkeleton v-if="loading" :fields="5" />
    <form v-else class="max-w-xl space-y-4 rounded-xl border border-white/10 bg-graphite-900/70 p-6" @submit.prevent="save">

      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="Fixture ID"><UInput v-model="form.fixture_id" type="number" class="w-full font-mono" /></UFormField>
        <UFormField label="Player ID"><UInput v-model="form.player_id" type="number" class="w-full font-mono" /></UFormField>
      </div>
      <div class="grid gap-4 sm:grid-cols-3">
        <UFormField label="Goals"><UInput v-model="form.goals" type="number" class="w-full font-mono" /></UFormField>
        <UFormField label="Assists"><UInput v-model="form.assists" type="number" class="w-full font-mono" /></UFormField>
        <UFormField label="Rating"><UInput v-model="form.rating" type="number" step="0.1" class="w-full font-mono" /></UFormField>
      </div>
      <UCheckbox v-model="form.man_of_the_match" label="Man of the match" />
      <UButton type="submit" color="primary" :loading="saving" label="Save" />
    </form>
  </div>
</template>
