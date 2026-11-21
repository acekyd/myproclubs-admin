<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin-auth'] })
type Row = {
  id: number
  tournament_id: number
  round: string | null
  status: string | null
  home_score: number | null
  away_score: number | null
  home_team?: string | null
  away_team?: string | null
}
const { q, page, loading, error, result, load } = useAdminList<Row>('admin/fixtures')
onMounted(() => load())
watch(page, () => load())
let t: ReturnType<typeof setTimeout> | undefined
watch(q, () => { clearTimeout(t); t = setTimeout(() => { page.value = 1; load() }, 300) })

const rows = computed(() => (result.value?.data || []).map(row => ({
  ...row,
  matchup: `${row.home_team || 'TBD'} vs ${row.away_team || 'TBD'}`
})))
</script>

<template>
  <div>
    <AdminPageHeader
      title="Fixtures"
      description="Tournament matches and scheduled fixtures."
    />
    <AdminDataTable
      v-model:search="q"
      :columns="[
        { key: 'id', label: 'ID', mono: true },
        { key: 'tournament_id', label: 'Tournament', mono: true },
        { key: 'matchup', label: 'Match' },
        { key: 'round', label: 'Round' },
        { key: 'status', label: 'Status' },
        { key: 'home_score', label: 'Home' },
        { key: 'away_score', label: 'Away' },
      ]"
      :rows="rows as any"
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
