<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin-auth'] })

type AuditRow = {
  id: number
  actor_id: number | null
  action: string
  subject_type: string | null
  subject_id: string | null
  context: Record<string, unknown> | null
  created_at: string
}

const { q, page, loading, error, result, load } = useAdminList<AuditRow>('admin/audit-logs')
const action = ref('')

async function refresh() {
  await load({ action: action.value || undefined })
}

onMounted(refresh)
watch([page, action], refresh)

let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(q, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    refresh()
  }, 300)
})
</script>

<template>
  <div>
    <AdminPageHeader title="Audit log" description="Operator mutations and support actions." />
    <div class="mb-4 flex flex-wrap gap-3">
      <UInput v-model="action" placeholder="Filter by action" class="max-w-xs font-mono" @change="page = 1; refresh()" />
    </div>
    <AdminDataTable
      v-model:search="q"
      :columns="[
        { key: 'id', label: 'ID', mono: true },
        { key: 'created_at', label: 'When', mono: true },
        { key: 'actor_id', label: 'Actor', mono: true },
        { key: 'action', label: 'Action', mono: true },
        { key: 'subject_type', label: 'Subject' },
        { key: 'subject_id', label: 'Subject ID', mono: true },
      ]"
      :rows="(result?.data || []) as any"
      :loading="loading"
      :error="error"
      :page="result?.current_page"
      :last-page="result?.last_page"
      :total="result?.total"
      search-placeholder="Search is unused — use action filter"
      @page="(p) => { page = p; refresh() }"
    >
      <template #cell-created_at="{ value }">
        <span class="font-mono text-xs">{{ value }}</span>
      </template>
    </AdminDataTable>
  </div>
</template>
