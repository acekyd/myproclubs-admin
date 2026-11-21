<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin-auth'] })
type Row = {
  id: number
  tournament_id?: number
  tournament_name?: string | null
  home_team: string
  away_team: string
  home_score: number | null
  away_score: number | null
  match_date: string | null
}
const { q, page, loading, error, result, load } = useAdminList<Row>('admin/records')
onMounted(() => load())
watch(page, () => load())
let t: ReturnType<typeof setTimeout> | undefined
watch(q, () => { clearTimeout(t); t = setTimeout(() => { page.value = 1; load() }, 300) })

const rows = computed(() => (result.value?.data || []).map(row => ({
  ...row,
  tournament_name: row.tournament_name || (row.tournament_id ? `#${row.tournament_id}` : '—'),
})))
</script>

<template>
  <div>
    <AdminPageHeader
      title="Records"
      description="Played tournament match results."
    />
    <AdminDataTable
      v-model:search="q"
      :columns="[
        { key: 'id', label: 'ID', mono: true },
        { key: 'tournament_name', label: 'Tournament' },
        { key: 'home_team', label: 'Home' },
        { key: 'away_team', label: 'Away' },
        { key: 'home_score', label: 'HS', mono: true },
        { key: 'away_score', label: 'AS', mono: true },
        { key: 'match_date', label: 'Date', mono: true },
      ]"
      :rows="rows as any"
      :loading="loading"
      :error="error"
      :page="result?.current_page"
      :last-page="result?.last_page"
      :total="result?.total"
      @page="(p) => { page = p }"
      @row-click="(row) => navigateTo(`/records/${row.id}`)"
    />
  </div>
</template>
