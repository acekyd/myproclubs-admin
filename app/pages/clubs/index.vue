<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin-auth'] })

type ClubRow = {
  id: number
  name: string
  slug: string
  reference_id: string
  platform: string | null
  is_recruiting: boolean
}

const { q, page, loading, error, result, load } = useAdminList<ClubRow>('admin/clubs')
const recruiting = ref(false)

async function refresh() {
  await load({ recruiting: recruiting.value || undefined })
}

onMounted(refresh)
watch([page, recruiting], refresh)

let t: ReturnType<typeof setTimeout> | undefined
watch(q, () => {
  clearTimeout(t)
  t = setTimeout(() => {
    page.value = 1
    refresh()
  }, 300)
})
</script>

<template>
  <div>
    <AdminPageHeader title="Clubs" description="MPC and tracked clubs.">
      <template #actions>
        <UCheckbox v-model="recruiting" label="Recruiting only" />
        <UButton to="/clubs/new" color="primary" icon="i-lucide-plus" label="New club" />
      </template>
    </AdminPageHeader>

    <AdminDataTable
      v-model:search="q"
      :columns="[
        { key: 'id', label: 'ID', mono: true },
        { key: 'name', label: 'Name' },
        { key: 'slug', label: 'Slug', mono: true },
        { key: 'reference_id', label: 'EA ID', mono: true },
        { key: 'platform', label: 'Platform' },
        { key: 'is_recruiting', label: 'Recruiting' },
      ]"
      :rows="(result?.data || []) as any"
      :loading="loading"
      :error="error"
      :page="result?.current_page"
      :last-page="result?.last_page"
      :total="result?.total"
      search-placeholder="Name, slug, EA ID, or ID"
      @page="(p) => { page = p }"
      @row-click="(row) => navigateTo(`/clubs/${row.id}`)"
    />
  </div>
</template>
