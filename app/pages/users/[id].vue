<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin-auth'] })

const route = useRoute()
const { adminFetch } = useAdminApi()
const toast = useToast()

const isNew = computed(() => route.params.id === 'new')
const loading = ref(!isNew.value)
const saving = ref(false)
const form = reactive({
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  gamer_tag: '',
  platform: 'pc',
  bio: ''
})
const meta = ref<Record<string, unknown> | null>(null)

onMounted(async () => {
  if (isNew.value) return
  try {
    const res = await adminFetch<{ user: Record<string, unknown> }>(`admin/users/${route.params.id}`)
    const u = res.data.user
    meta.value = u
    form.first_name = String(u.first_name || '')
    form.last_name = String(u.last_name || '')
    form.email = String(u.email || '')
    form.gamer_tag = String(u.gamer_tag || '')
    form.platform = String(u.platform || 'pc')
    form.bio = String(u.bio || '')
  } finally {
    loading.value = false
  }
})

async function save() {
  saving.value = true
  try {
    const body: Record<string, unknown> = { ...form }
    if (!body.password) delete body.password
    if (isNew.value) {
      const res = await adminFetch<{ user: { id: number } }>('admin/users', { method: 'POST', body })
      toast.add({ title: 'User created', color: 'success' })
      await navigateTo(`/users/${res.data.user.id}`)
    } else {
      await adminFetch(`admin/users/${route.params.id}`, { method: 'PUT', body })
      toast.add({ title: 'User updated', color: 'success' })
    }
  } catch (e: unknown) {
    toast.add({ title: (e as { data?: { message?: string } })?.data?.message || 'Save failed', color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <AdminPageHeader
      :title="isNew ? 'New user' : `User #${route.params.id}`"
      description="People · account fields"
    >
      <template #actions>
        <UButton
          v-if="!isNew"
          :to="{ path: '/insights/journeys', query: { user_id: route.params.id } }"
          color="neutral"
          variant="outline"
          icon="i-lucide-route"
          label="User journey"
        />
        <UButton
          to="/users"
          color="neutral"
          variant="ghost"
          label="Back"
        />
        <UButton
          v-if="!isNew"
          :to="`/operations?user_id=${route.params.id}`"
          color="neutral"
          variant="outline"
          icon="i-lucide-wrench"
          label="Support"
        />
      </template>
    </AdminPageHeader>

    <AdminFormSkeleton
      v-if="loading"
      :fields="6"
    />
    <form
      v-else
      class="max-w-xl space-y-4 rounded-xl border border-white/10 bg-graphite-900/70 p-6"
      @submit.prevent="save"
    >
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="First name">
          <UInput
            v-model="form.first_name"
            required
            class="w-full"
          />
        </UFormField>
        <UFormField label="Last name">
          <UInput
            v-model="form.last_name"
            required
            class="w-full"
          />
        </UFormField>
      </div>
      <UFormField label="Email">
        <UInput
          v-model="form.email"
          type="email"
          required
          class="w-full"
        />
      </UFormField>
      <UFormField :label="isNew ? 'Password' : 'Password (leave blank to keep)'">
        <UInput
          v-model="form.password"
          type="password"
          :required="isNew"
          minlength="12"
          class="w-full"
        />
      </UFormField>
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="Gamer tag">
          <UInput
            v-model="form.gamer_tag"
            class="w-full font-mono"
          />
        </UFormField>
        <UFormField label="Platform">
          <UInput
            v-model="form.platform"
            required
            class="w-full"
          />
        </UFormField>
      </div>
      <UFormField label="Bio">
        <UTextarea
          v-model="form.bio"
          class="w-full"
        />
      </UFormField>
      <UButton
        type="submit"
        color="primary"
        :loading="saving"
        :label="isNew ? 'Create' : 'Save changes'"
      />
    </form>
  </div>
</template>
