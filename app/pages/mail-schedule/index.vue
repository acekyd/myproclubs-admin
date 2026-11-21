<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin-auth'] })

type ScheduledMail = {
  id: number
  tournament_id: number
  template: string
  subject: string
  status: string
  send_at: string
  sent_at?: string | null
  tournament?: { id: number, name: string } | null
  recipients?: Array<{ name?: string, email?: string, role?: string }>
}

const status = ref('pending')
const page = ref(1)
const loading = ref(true)
const error = ref<string | null>(null)
const result = ref<{
  data: ScheduledMail[]
  current_page: number
  last_page: number
  total: number
} | null>(null)
const { adminFetch } = useAdminApi()

async function load() {
  loading.value = true
  error.value = null
  try {
    const res = await adminFetch<{
      data: ScheduledMail[]
      current_page: number
      last_page: number
      total: number
    }>(`admin/scheduled-mails?status=${encodeURIComponent(status.value)}&page=${page.value}&per_page=25`)
    result.value = res.data
  } catch (e: unknown) {
    error.value = (e as { data?: { message?: string } })?.data?.message || 'Failed to load scheduled mail'
  } finally {
    loading.value = false
  }
}

onMounted(() => load())
watch([status, page], () => load())

const rows = computed(() => (result.value?.data || []).map((row) => ({
  ...row,
  tournament_name: row.tournament?.name || `#${row.tournament_id}`,
  recipient_count: row.recipients?.length ?? 0,
  send_at_label: row.send_at ? String(row.send_at).replace('T', ' ').slice(0, 19) : '—'
})))
</script>

<template>
  <div>
    <AdminPageHeader
      title="Mail schedule"
      description="Pending tournament messages wait 30 minutes before sending. Cancel or edit while pending."
    >
      <template #actions>
        <USelect
          v-model="status"
          :items="[
            { label: 'Pending', value: 'pending' },
            { label: 'Sent', value: 'sent' },
            { label: 'Cancelled', value: 'cancelled' },
            { label: 'Failed', value: 'failed' },
            { label: 'All', value: 'all' },
          ]"
          class="w-40"
        />
      </template>
    </AdminPageHeader>

    <AdminDataTable
      :columns="[
        { key: 'id', label: 'ID', mono: true },
        { key: 'tournament_name', label: 'Tournament' },
        { key: 'subject', label: 'Subject' },
        { key: 'recipient_count', label: 'To', mono: true },
        { key: 'status', label: 'Status' },
        { key: 'send_at_label', label: 'Send at', mono: true },
      ]"
      :rows="rows as any"
      :loading="loading"
      :error="error"
      :page="result?.current_page"
      :last-page="result?.last_page"
      :total="result?.total"
      @page="(p) => { page = p }"
      @row-click="(row) => navigateTo(`/mail-schedule/${row.id}`)"
    />
  </div>
</template>
