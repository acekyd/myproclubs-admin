<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin-auth'] })
type Row = { id: number, name: string, slug: string, reference_id: string, is_public: boolean, tournament_type: string | null }
const { q, page, loading, error, result, load } = useAdminList<Row>('admin/tournaments')
onMounted(() => load())
watch(page, () => load())
let t: ReturnType<typeof setTimeout> | undefined
watch(q, () => { clearTimeout(t); t = setTimeout(() => { page.value = 1; load() }, 300) })
</script>

<template>
  <div>
    <AdminPageHeader title="Tournaments" description="Competitions and seasons overview.">
      <template #actions>
        <UButton to="/tournaments/new" color="primary" icon="i-lucide-plus" label="New tournament" />
      </template>
    </AdminPageHeader>
    <AdminDataTable
      v-model:search="q"
      :columns="[
        { key: 'id', label: 'ID', mono: true },
        { key: 'name', label: 'Name' },
        { key: 'slug', label: 'Slug', mono: true },
        { key: 'reference_id', label: 'Ref', mono: true },
        { key: 'tournament_type', label: 'Type' },
        { key: 'is_public', label: 'Public' },
      ]"
      :rows="(result?.data || []) as any"
      :loading="loading"
      :error="error"
      :page="result?.current_page"
      :last-page="result?.last_page"
      :total="result?.total"
      @page="(p) => { page = p }"
      @row-click="(row) => navigateTo(`/tournaments/${row.id}`)"
    />
  </div>
</template>
