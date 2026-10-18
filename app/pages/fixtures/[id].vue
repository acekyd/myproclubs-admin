<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin-auth'] })
const route = useRoute()
const { adminFetch } = useAdminApi()
const toast = useToast()
const loading = ref(true)
const saving = ref(false)
const form = reactive({
  tournament_id: '' as string | number,
  home_team_id: '' as string | number,
  away_team_id: '' as string | number,
  round: '',
  scheduled_date: '',
  home_score: '' as string | number,
  away_score: '' as string | number,
  status: '',
})

onMounted(async () => {
  try {
    const res = await adminFetch<{ fixture: Record<string, unknown> }>(`admin/fixtures/${route.params.id}`)
    const f = res.data.fixture
    form.tournament_id = f.tournament_id as number
    form.home_team_id = (f.home_team_id as number) ?? ''
    form.away_team_id = (f.away_team_id as number) ?? ''
    form.round = String(f.round || '')
    form.scheduled_date = String(f.scheduled_date || '').slice(0, 16)
    form.home_score = (f.home_score as number) ?? ''
    form.away_score = (f.away_score as number) ?? ''
    form.status = String(f.status || '')
  } finally {
    loading.value = false
  }
})

async function save() {
  saving.value = true
  try {
    await adminFetch(`admin/fixtures/${route.params.id}`, {
      method: 'PUT',
      body: {
        tournament_id: Number(form.tournament_id),
        home_team_id: form.home_team_id === '' ? null : Number(form.home_team_id),
        away_team_id: form.away_team_id === '' ? null : Number(form.away_team_id),
        round: form.round || null,
        scheduled_date: form.scheduled_date || null,
        home_score: form.home_score === '' ? null : Number(form.home_score),
        away_score: form.away_score === '' ? null : Number(form.away_score),
        status: form.status || null,
      },
    })
    toast.add({ title: 'Fixture updated', color: 'success' })
  } catch (e: unknown) {
    toast.add({ title: (e as { data?: { message?: string } })?.data?.message || 'Save failed', color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <AdminPageHeader :title="`Fixture #${route.params.id}`">
      <template #actions><UButton to="/fixtures" variant="ghost" color="neutral" label="Back" /></template>
    </AdminPageHeader>
    <AdminFormSkeleton v-if="loading" :fields="6" />
    <form v-else class="max-w-xl space-y-4 rounded-xl border border-white/10 bg-graphite-900/70 p-6" @submit.prevent="save">

      <UFormField label="Tournament ID"><UInput v-model="form.tournament_id" type="number" class="w-full font-mono" /></UFormField>
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="Home club ID"><UInput v-model="form.home_team_id" type="number" class="w-full font-mono" /></UFormField>
        <UFormField label="Away club ID"><UInput v-model="form.away_team_id" type="number" class="w-full font-mono" /></UFormField>
      </div>
      <UFormField label="Round"><UInput v-model="form.round" class="w-full" /></UFormField>
      <UFormField label="Scheduled"><UInput v-model="form.scheduled_date" type="datetime-local" class="w-full font-mono" /></UFormField>
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="Home score"><UInput v-model="form.home_score" type="number" class="w-full font-mono" /></UFormField>
        <UFormField label="Away score"><UInput v-model="form.away_score" type="number" class="w-full font-mono" /></UFormField>
      </div>
      <UFormField label="Status"><UInput v-model="form.status" class="w-full" /></UFormField>
      <UButton type="submit" color="primary" :loading="saving" label="Save" />
    </form>
  </div>
</template>
