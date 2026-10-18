<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin-auth'] })
type Row = { id: number, tournament_id: number, round: string | null, status: string | null, home_score: number | null, away_score: number | null }
const { page, loading, error, result, load } = useAdminList<Row>('admin/fixtures')
onMounted(() => load())
watch(page, () => load())
</script>

<template>
  <div>
    <AdminPageHeader title="Fixtures" description="Scheduled and completed fixtures." />
    <AdminDataTable
      :columns="[
        { key: 'id', label: 'ID', mono: true },
        { key: 'tournament_id', label: 'Tournament', mono: true },
        { key: 'round', label: 'Round' },
        { key: 'status', label: 'Status' },
        { key: 'home_score', label: 'Home' },
        { key: 'away_score', label: 'Away' },
      ]"
      :rows="(result?.data || []) as any"
      :loading="loading"
      :error="error"
      :page="result?.current_page"
      :last-page="result?.last_page"
      :total="result?.total"
      @page="(p) => { page = p }"
      @row-click="(row) => navigateTo(`/fixtures/${row.id}`)"
    />
  </div>
</template>
