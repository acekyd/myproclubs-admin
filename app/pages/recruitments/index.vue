<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin-auth'] })
type Row = { id: number, club_id: number, status: string, recruitment_needs: string | null }
const { page, loading, error, result, load } = useAdminList<Row>('admin/recruitments')
onMounted(() => load())
watch(page, () => load())
</script>

<template>
  <div>
    <AdminPageHeader title="Recruitment" description="Club recruitment posts.">
      <template #actions>
        <UButton to="/recruitments/new" color="primary" icon="i-lucide-plus" label="New" />
      </template>
    </AdminPageHeader>
    <AdminDataTable
      :columns="[
        { key: 'id', label: 'ID', mono: true },
        { key: 'club_id', label: 'Club', mono: true },
        { key: 'status', label: 'Status' },
        { key: 'recruitment_needs', label: 'Needs' },
      ]"
      :rows="(result?.data || []) as any"
      :loading="loading"
      :error="error"
      :page="result?.current_page"
      :last-page="result?.last_page"
      :total="result?.total"
      @page="(p) => { page = p }"
      @row-click="(row) => navigateTo(`/recruitments/${row.id}`)"
    />
  </div>
</template>
