<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin-auth'] })
const route = useRoute()
const { adminFetch } = useAdminApi()
const toast = useToast()
const loading = ref(true)
const saving = ref(false)
const form = reactive({
  home_team: '',
  away_team: '',
  home_score: '' as string | number,
  away_score: '' as string | number,
  match_date: '',
})

onMounted(async () => {
  try {
    const res = await adminFetch<{ record: Record<string, unknown> }>(`admin/records/${route.params.id}`)
    const r = res.data.record
    form.home_team = String(r.home_team || '')
    form.away_team = String(r.away_team || '')
    form.home_score = (r.home_score as number) ?? ''
    form.away_score = (r.away_score as number) ?? ''
    form.match_date = String(r.match_date || '').slice(0, 10)
  } finally {
    loading.value = false
  }
})

async function save() {
  saving.value = true
  try {
    await adminFetch(`admin/records/${route.params.id}`, {
      method: 'PUT',
      body: {
        ...form,
        home_score: form.home_score === '' ? null : Number(form.home_score),
        away_score: form.away_score === '' ? null : Number(form.away_score),
        match_date: form.match_date || null,
      },
    })
    toast.add({ title: 'Record updated', color: 'success' })
  } catch (e: unknown) {
    toast.add({ title: (e as { data?: { message?: string } })?.data?.message || 'Save failed', color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <AdminPageHeader :title="`Record #${route.params.id}`">
      <template #actions><UButton to="/records" variant="ghost" color="neutral" label="Back" /></template>
    </AdminPageHeader>
    <AdminFormSkeleton v-if="loading" :fields="4" />
    <form v-else class="max-w-xl space-y-4 rounded-xl border border-white/10 bg-graphite-900/70 p-6" @submit.prevent="save">

      <UFormField label="Home team"><UInput v-model="form.home_team" required class="w-full" /></UFormField>
      <UFormField label="Away team"><UInput v-model="form.away_team" required class="w-full" /></UFormField>
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="Home score"><UInput v-model="form.home_score" type="number" class="w-full font-mono" /></UFormField>
        <UFormField label="Away score"><UInput v-model="form.away_score" type="number" class="w-full font-mono" /></UFormField>
      </div>
      <UFormField label="Match date"><UInput v-model="form.match_date" type="date" class="w-full font-mono" /></UFormField>
      <UButton type="submit" color="primary" :loading="saving" label="Save" />
    </form>
  </div>
</template>
