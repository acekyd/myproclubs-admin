<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin-auth'] })
const route = useRoute()
const { adminFetch } = useAdminApi()
const toast = useToast()
const loading = ref(true)
const saving = ref(false)
const form = reactive({ name: '', start_date: '', end_date: '' })

onMounted(async () => {
  try {
    const res = await adminFetch<{ season: Record<string, unknown> }>(`admin/seasons/${route.params.id}`)
    form.name = String(res.data.season.name || '')
    form.start_date = String(res.data.season.start_date || '').slice(0, 10)
    form.end_date = String(res.data.season.end_date || '').slice(0, 10)
  } finally {
    loading.value = false
  }
})

async function save() {
  saving.value = true
  try {
    await adminFetch(`admin/seasons/${route.params.id}`, {
      method: 'PUT',
      body: { ...form, start_date: form.start_date || null, end_date: form.end_date || null },
    })
    toast.add({ title: 'Season updated', color: 'success' })
  } catch (e: unknown) {
    toast.add({ title: (e as { data?: { message?: string } })?.data?.message || 'Save failed', color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <AdminPageHeader :title="`Season #${route.params.id}`">
      <template #actions><UButton to="/seasons" variant="ghost" color="neutral" label="Back" /></template>
    </AdminPageHeader>
    <AdminFormSkeleton v-if="loading" :fields="3" />
    <form v-else class="max-w-xl space-y-4 rounded-xl border border-white/10 bg-graphite-900/70 p-6" @submit.prevent="save">

      <UFormField label="Name"><UInput v-model="form.name" required class="w-full" /></UFormField>
      <UFormField label="Start"><UInput v-model="form.start_date" type="date" class="w-full font-mono" /></UFormField>
      <UFormField label="End"><UInput v-model="form.end_date" type="date" class="w-full font-mono" /></UFormField>
      <UButton type="submit" color="primary" :loading="saving" label="Save" />
    </form>
  </div>
</template>
