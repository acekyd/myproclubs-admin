<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin-auth'] })
type Row = {
  id: number
  fixture_id: number
  tournament_id?: number
  tournament_name?: string | null
  player_id: number
  player_name?: string
  goals: number | null
  assists: number | null
  rating: number | null
}
const { page, loading, error, result, load } = useAdminList<Row>('admin/player-stats')
onMounted(() => load())
watch(page, () => load())

const rows = computed(() => (result.value?.data || []).map(row => ({
  ...row,
  tournament_name: row.tournament_name || (row.tournament_id ? `#${row.tournament_id}` : '—'),
})))
</script>

<template>
  <div>
    <AdminPageHeader
      title="Player stats"
      description="Per-match tournament player statistics."
    />
    <AdminDataTable
      :columns="[
        { key: 'id', label: 'ID', mono: true },
        { key: 'fixture_id', label: 'Match', mono: true },
        { key: 'tournament_name', label: 'Tournament' },
        { key: 'player_name', label: 'Player' },
        { key: 'goals', label: 'G' },
        { key: 'assists', label: 'A' },
        { key: 'rating', label: 'Rating' },
      ]"
      :rows="rows as any"
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
