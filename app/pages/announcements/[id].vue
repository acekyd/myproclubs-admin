<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin-auth'] })
const route = useRoute()
const { adminFetch } = useAdminApi()
const toast = useToast()
const isNew = computed(() => route.params.id === 'new')
const loading = ref(!isNew.value)
const saving = ref(false)
const form = reactive({ tournament_id: '' as string | number, message: '', audience: '' })

onMounted(async () => {
  if (isNew.value) return
  try {
    const res = await adminFetch<{ announcement: Record<string, unknown> }>(`admin/announcements/${route.params.id}`)
    const a = res.data.announcement
    form.tournament_id = a.tournament_id as number
    form.message = String(a.message || '')
    form.audience = String(a.audience || '')
  } finally {
    loading.value = false
  }
})

async function save() {
  saving.value = true
  try {
    const body = { ...form, tournament_id: Number(form.tournament_id) }
    if (isNew.value) {
      const res = await adminFetch<{ announcement: { id: number } }>('admin/announcements', { method: 'POST', body })
      toast.add({ title: 'Created', color: 'success' })
      await navigateTo(`/announcements/${res.data.announcement.id}`)
    } else {
      await adminFetch(`admin/announcements/${route.params.id}`, { method: 'PUT', body })
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
    <AdminPageHeader :title="isNew ? 'New announcement' : `Announcement #${route.params.id}`">
      <template #actions><UButton to="/announcements" variant="ghost" color="neutral" label="Back" /></template>
    </AdminPageHeader>
    <AdminFormSkeleton v-if="loading" :fields="3" />
    <form v-else class="max-w-xl space-y-4 rounded-xl border border-white/10 bg-graphite-900/70 p-6" @submit.prevent="save">

      <UFormField label="Tournament ID"><UInput v-model="form.tournament_id" type="number" required class="w-full font-mono" /></UFormField>
      <UFormField label="Audience"><UInput v-model="form.audience" required class="w-full" /></UFormField>
      <UFormField label="Message"><UTextarea v-model="form.message" required :rows="6" class="w-full" /></UFormField>
      <UButton type="submit" color="primary" :loading="saving" :label="isNew ? 'Create' : 'Save'" />
    </form>
  </div>
</template>
