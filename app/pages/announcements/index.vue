<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin-auth'] })
type Row = { id: number, tournament_id: number, audience: string, message: string, created_at: string }
const { page, loading, error, result, load } = useAdminList<Row>('admin/announcements')
onMounted(() => load())
watch(page, () => load())
</script>

<template>
  <div>
    <AdminPageHeader title="Announcements" description="Tournament-scoped announcements.">
      <template #actions>
        <UButton to="/announcements/new" color="primary" icon="i-lucide-plus" label="New" />
      </template>
    </AdminPageHeader>
    <AdminDataTable
      :columns="[
        { key: 'id', label: 'ID', mono: true },
        { key: 'tournament_id', label: 'Tournament', mono: true },
        { key: 'audience', label: 'Audience' },
        { key: 'message', label: 'Message' },
        { key: 'created_at', label: 'Created', mono: true },
      ]"
      :rows="(result?.data || []) as any"
      :loading="loading"
      :error="error"
      :page="result?.current_page"
      :last-page="result?.last_page"
      :total="result?.total"
      @page="(p) => { page = p }"
      @row-click="(row) => navigateTo(`/announcements/${row.id}`)"
    />
  </div>
</template>
