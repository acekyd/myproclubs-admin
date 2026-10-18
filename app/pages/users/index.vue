<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin-auth'] })

type UserRow = {
  id: number
  first_name: string
  last_name: string
  email: string
  gamer_tag: string | null
  platform: string
  is_email_verified: boolean
}

const { q, page, loading, error, result, load } = useAdminList<UserRow>('admin/users')

onMounted(() => load())
watch(page, () => load())

let t: ReturnType<typeof setTimeout> | undefined
watch(q, () => {
  clearTimeout(t)
  t = setTimeout(() => {
    page.value = 1
    load()
  }, 300)
})
</script>

<template>
  <div>
    <AdminPageHeader title="Users" description="Search and manage platform accounts.">
      <template #actions>
        <UButton to="/users/new" color="primary" icon="i-lucide-plus" label="New user" />
      </template>
    </AdminPageHeader>

    <AdminDataTable
      v-model:search="q"
      :columns="[
        { key: 'id', label: 'ID', mono: true },
        { key: 'email', label: 'Email' },
        { key: 'gamer_tag', label: 'Gamer tag', mono: true },
        { key: 'platform', label: 'Platform' },
        { key: 'is_email_verified', label: 'Verified' },
      ]"
      :rows="(result?.data || []) as any"
      :loading="loading"
      :error="error"
      :page="result?.current_page"
      :last-page="result?.last_page"
      :total="result?.total"
      search-placeholder="Email, gamertag, name, or ID"
      @page="(p) => { page = p }"
      @row-click="(row) => navigateTo(`/users/${row.id}`)"
    />
  </div>
</template>
