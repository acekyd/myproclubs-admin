<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin-auth'] })

const route = useRoute()
const { adminFetch } = useAdminApi()
const toast = useToast()

const isNew = computed(() => route.params.id === 'new')
const loading = ref(!isNew.value)
const saving = ref(false)
const form = reactive({
  reference_id: '',
  name: '',
  slug: '',
  platform: '',
  is_recruiting: false,
})

onMounted(async () => {
  if (isNew.value) return
  try {
    const res = await adminFetch<{ club: Record<string, unknown> }>(`admin/clubs/${route.params.id}`)
    const c = res.data.club
    form.reference_id = String(c.reference_id || '')
    form.name = String(c.name || '')
    form.slug = String(c.slug || '')
    form.platform = String(c.platform || '')
    form.is_recruiting = Boolean(c.is_recruiting)
  } finally {
    loading.value = false
  }
})

async function save() {
  saving.value = true
  try {
    if (isNew.value) {
      const res = await adminFetch<{ club: { id: number } }>('admin/clubs', { method: 'POST', body: form })
      toast.add({ title: 'Club created', color: 'success' })
      await navigateTo(`/clubs/${res.data.club.id}`)
    } else {
      await adminFetch(`admin/clubs/${route.params.id}`, { method: 'PUT', body: form })
      toast.add({ title: 'Club updated', color: 'success' })
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
    <AdminPageHeader :title="isNew ? 'New club' : `Club #${route.params.id}`">
      <template #actions>
        <UButton to="/clubs" color="neutral" variant="ghost" label="Back" />
      </template>
    </AdminPageHeader>

    <AdminFormSkeleton v-if="loading" :fields="5" />
    <form v-else class="max-w-xl space-y-4 rounded-xl border border-white/10 bg-graphite-900/70 p-6" @submit.prevent="save">

      <UFormField label="Name"><UInput v-model="form.name" required class="w-full" /></UFormField>
      <UFormField label="Reference ID (EA)"><UInput v-model="form.reference_id" required class="w-full font-mono" /></UFormField>
      <UFormField label="Slug"><UInput v-model="form.slug" class="w-full font-mono" placeholder="Auto if empty on create" /></UFormField>
      <UFormField label="Platform"><UInput v-model="form.platform" class="w-full" /></UFormField>
      <UCheckbox v-model="form.is_recruiting" label="Currently recruiting" />
      <UButton type="submit" color="primary" :loading="saving" :label="isNew ? 'Create' : 'Save changes'" />
    </form>
  </div>
</template>
