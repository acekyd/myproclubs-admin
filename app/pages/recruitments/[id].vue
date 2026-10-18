<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin-auth'] })
const route = useRoute()
const { adminFetch } = useAdminApi()
const toast = useToast()
const isNew = computed(() => route.params.id === 'new')
const loading = ref(!isNew.value)
const saving = ref(false)
const form = reactive({ club_id: '' as string | number, status: 'open', recruitment_needs: '' })

onMounted(async () => {
  if (isNew.value) return
  try {
    const res = await adminFetch<{ recruitment: Record<string, unknown> }>(`admin/recruitments/${route.params.id}`)
    const r = res.data.recruitment
    form.club_id = r.club_id as number
    form.status = String(r.status || '')
    form.recruitment_needs = String(r.recruitment_needs || '')
  } finally {
    loading.value = false
  }
})

async function save() {
  saving.value = true
  try {
    const body = { ...form, club_id: Number(form.club_id) }
    if (isNew.value) {
      const res = await adminFetch<{ recruitment: { id: number } }>('admin/recruitments', { method: 'POST', body })
      toast.add({ title: 'Created', color: 'success' })
      await navigateTo(`/recruitments/${res.data.recruitment.id}`)
    } else {
      await adminFetch(`admin/recruitments/${route.params.id}`, { method: 'PUT', body })
      toast.add({ title: 'Updated', color: 'success' })
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
    <AdminPageHeader :title="isNew ? 'New recruitment' : `Recruitment #${route.params.id}`">
      <template #actions><UButton to="/recruitments" variant="ghost" color="neutral" label="Back" /></template>
    </AdminPageHeader>
    <AdminFormSkeleton v-if="loading" :fields="3" />
    <form v-else class="max-w-xl space-y-4 rounded-xl border border-white/10 bg-graphite-900/70 p-6" @submit.prevent="save">

      <UFormField label="Club ID"><UInput v-model="form.club_id" type="number" required class="w-full font-mono" /></UFormField>
      <UFormField label="Status"><UInput v-model="form.status" required class="w-full" /></UFormField>
      <UFormField label="Needs"><UTextarea v-model="form.recruitment_needs" class="w-full" /></UFormField>
      <UButton type="submit" color="primary" :loading="saving" :label="isNew ? 'Create' : 'Save'" />
    </form>
  </div>
</template>
