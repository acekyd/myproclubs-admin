<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin-auth'] })
type Row = { id: number, file_type: string, url: string, key: string | null }
const { q, page, loading, error, result, load } = useAdminList<Row>('admin/media')
onMounted(() => load())
watch(page, () => load())
let t: ReturnType<typeof setTimeout> | undefined
watch(q, () => { clearTimeout(t); t = setTimeout(() => { page.value = 1; load() }, 300) })
</script>

<template>
  <div>
    <AdminPageHeader title="Media" description="Uploaded assets and media records.">
      <template #actions>
        <UButton to="/media/new" color="primary" icon="i-lucide-plus" label="New" />
      </template>
    </AdminPageHeader>
    <AdminDataTable
      v-model:search="q"
      :columns="[
        { key: 'id', label: 'ID', mono: true },
        { key: 'file_type', label: 'Type', mono: true },
        { key: 'url', label: 'URL' },
        { key: 'key', label: 'Key', mono: true },
      ]"
      :rows="(result?.data || []) as any"
      :loading="loading"
      :error="error"
      :page="result?.current_page"
      :last-page="result?.last_page"
      :total="result?.total"
      @page="(p) => { page = p }"
      @row-click="(row) => navigateTo(`/media/${row.id}`)"
    />
  </div>
</template>
