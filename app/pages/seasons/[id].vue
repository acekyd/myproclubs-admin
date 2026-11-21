<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin-auth'] })
const route = useRoute()
const { adminFetch } = useAdminApi()
const toast = useToast()
const loading = ref(true)
const saving = ref(false)
const editing = ref(false)
const tournamentLabel = ref('')
const form = reactive({
  name: '',
  start_date: '',
  end_date: '',
  description: '',
  is_concluded: false
})

onMounted(async () => {
  try {
    const res = await adminFetch<{ season: Record<string, unknown> & { tournament?: { id: number, name: string } } }>(`admin/seasons/${route.params.id}`)
    const s = res.data.season
    form.name = String(s.name || '')
    form.start_date = String(s.start_date || '').slice(0, 10)
    form.end_date = String(s.end_date || '').slice(0, 10)
    form.description = String(s.description || '')
    form.is_concluded = Boolean(s.is_concluded)
    tournamentLabel.value = s.tournament ? `${s.tournament.name} (#${s.tournament.id})` : String(s.tournament_id || '')
  } finally {
    loading.value = false
  }
})

async function save() {
  saving.value = true
  try {
    await adminFetch(`admin/seasons/${route.params.id}`, {
      method: 'PUT',
      body: {
        ...form,
        start_date: form.start_date || null,
        end_date: form.end_date || null
      }
    })
    editing.value = false
    toast.add({ title: 'Season updated', color: 'success' })
  } catch (e: unknown) {
    toast.add({ title: (e as { data?: { message?: string } })?.data?.message || 'Save failed', color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <AdminPageHeader :title="`Season #${route.params.id}`">
      <template #actions>
        <UButton
          to="/seasons"
          variant="ghost"
          color="neutral"
          label="Back"
        />
      </template>
    </AdminPageHeader>
    <AdminFormSkeleton
      v-if="loading"
      :fields="4"
    />
    <form
      v-else
      class="max-w-xl space-y-4 rounded-xl border border-white/10 bg-graphite-900/70 p-6"
      @submit.prevent="save"
    >
      <div class="flex items-center justify-between gap-3">
        <p class="text-sm text-graphite-400">
          Tournament: <span class="text-graphite-200">{{ tournamentLabel || '—' }}</span>
        </p>
        <div class="flex gap-2">
          <UButton
            v-if="!editing"
            color="neutral"
            variant="outline"
            icon="i-lucide-pencil"
            label="Edit"
            @click="editing = true"
          />
          <UButton
            v-else
            color="neutral"
            variant="ghost"
            label="Cancel"
            @click="editing = false"
          />
        </div>
      </div>

      <UFormField label="Name">
        <UInput
          v-model="form.name"
          required
          class="w-full"
          :disabled="!editing"
        />
      </UFormField>
      <UFormField label="Description">
        <UInput
          v-model="form.description"
          class="w-full"
          :disabled="!editing"
        />
      </UFormField>
      <UFormField label="Start">
        <UInput
          v-model="form.start_date"
          type="date"
          class="w-full font-mono"
          :disabled="!editing"
        />
      </UFormField>
      <UFormField label="End">
        <UInput
          v-model="form.end_date"
          type="date"
          class="w-full font-mono"
          :disabled="!editing"
        />
      </UFormField>
      <UCheckbox
        v-model="form.is_concluded"
        label="Concluded"
        :disabled="!editing"
      />
      <UButton
        v-if="editing"
        type="submit"
        color="primary"
        :loading="saving"
        label="Save"
      />
    </form>
  </div>
</template>
