<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin-auth'] })
const route = useRoute()
const { adminFetch } = useAdminApi()
const toast = useToast()
const isNew = computed(() => route.params.id === 'new')
const loading = ref(!isNew.value)
const saving = ref(false)
const form = reactive({ file_type: '', url: '', key: '', bucket: '', asset_id: '' })

onMounted(async () => {
  if (isNew.value) return
  try {
    const res = await adminFetch<{ media: Record<string, unknown> }>(`admin/media/${route.params.id}`)
    Object.assign(form, {
      file_type: res.data.media.file_type || '',
      url: res.data.media.url || '',
      key: res.data.media.key || '',
      bucket: res.data.media.bucket || '',
      asset_id: res.data.media.asset_id || '',
    })
  } finally {
    loading.value = false
  }
})

async function save() {
  saving.value = true
  try {
    if (isNew.value) {
      const res = await adminFetch<{ media: { id: number } }>('admin/media', { method: 'POST', body: form })
      toast.add({ title: 'Created', color: 'success' })
      await navigateTo(`/media/${res.data.media.id}`)
    } else {
      await adminFetch(`admin/media/${route.params.id}`, { method: 'PUT', body: form })
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
    <AdminPageHeader :title="isNew ? 'New media' : `Media #${route.params.id}`">
      <template #actions><UButton to="/media" variant="ghost" color="neutral" label="Back" /></template>
    </AdminPageHeader>
    <AdminFormSkeleton v-if="loading" :fields="5" />
    <form v-else class="max-w-xl space-y-4 rounded-xl border border-white/10 bg-graphite-900/70 p-6" @submit.prevent="save">

      <UFormField label="File type"><UInput v-model="form.file_type" required class="w-full font-mono" /></UFormField>
      <UFormField label="URL"><UInput v-model="form.url" required class="w-full" /></UFormField>
      <UFormField label="Key"><UInput v-model="form.key" class="w-full font-mono" /></UFormField>
      <UFormField label="Bucket"><UInput v-model="form.bucket" class="w-full font-mono" /></UFormField>
      <UFormField label="Asset ID"><UInput v-model="form.asset_id" class="w-full font-mono" /></UFormField>
      <UButton type="submit" color="primary" :loading="saving" :label="isNew ? 'Create' : 'Save'" />
    </form>
  </div>
</template>
