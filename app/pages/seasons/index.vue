<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin-auth'] })
type Row = { id: number, name: string, start_date: string | null, end_date: string | null }
const { q, page, loading, error, result, load } = useAdminList<Row>('admin/seasons')
onMounted(() => load())
watch(page, () => load())
let t: ReturnType<typeof setTimeout> | undefined
watch(q, () => { clearTimeout(t); t = setTimeout(() => { page.value = 1; load() }, 300) })
</script>

<template>
  <div>
    <AdminPageHeader title="Seasons" description="League seasons (match data)." />
    <AdminDataTable
      v-model:search="q"
      :columns="[
        { key: 'id', label: 'ID', mono: true },
        { key: 'name', label: 'Name' },
        { key: 'start_date', label: 'Start', mono: true },
        { key: 'end_date', label: 'End', mono: true },
      ]"
      :rows="(result?.data || []) as any"
      :loading="loading"
      :error="error"
      :page="result?.current_page"
      :last-page="result?.last_page"
      :total="result?.total"
      @page="(p) => { page = p }"
      @row-click="(row) => navigateTo(`/seasons/${row.id}`)"
    />
  </div>
</template>
