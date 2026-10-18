<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin-auth'] })
type Row = { id: number, fixture_id: number, player_id: number, goals: number | null, assists: number | null, rating: number | null }
const { page, loading, error, result, load } = useAdminList<Row>('admin/player-stats')
onMounted(() => load())
watch(page, () => load())
</script>

<template>
  <div>
    <AdminPageHeader title="Player stats" description="Per-fixture player statistics." />
    <AdminDataTable
      :columns="[
        { key: 'id', label: 'ID', mono: true },
        { key: 'fixture_id', label: 'Fixture', mono: true },
        { key: 'player_id', label: 'Player', mono: true },
        { key: 'goals', label: 'G' },
        { key: 'assists', label: 'A' },
        { key: 'rating', label: 'Rating' },
      ]"
      :rows="(result?.data || []) as any"
      :loading="loading"
      :error="error"
      :page="result?.current_page"
      :last-page="result?.last_page"
      :total="result?.total"
      @page="(p) => { page = p }"
      @row-click="(row) => navigateTo(`/player-stats/${row.id}`)"
    />
  </div>
</template>
