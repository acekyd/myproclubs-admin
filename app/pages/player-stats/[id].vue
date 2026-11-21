<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin-auth'] })
const route = useRoute()
const { adminFetch } = useAdminApi()
const toast = useToast()
const loading = ref(true)
const saving = ref(false)
const editing = ref(false)
const playerName = ref('')
const form = reactive({
  fixture_id: '' as string | number,
  player_id: '' as string | number,
  goals: '' as string | number,
  assists: '' as string | number,
  man_of_the_match: false,
  rating: '' as string | number,
  position: ''
})

onMounted(async () => {
  try {
    const res = await adminFetch<{ player_stat: Record<string, unknown> }>(`admin/player-stats/${route.params.id}`)
    const s = res.data.player_stat
    form.fixture_id = (s.match_id as number) ?? (s.fixture_id as number)
    form.player_id = s.player_id as number
    form.goals = (s.goals as number) ?? ''
    form.assists = (s.assists as number) ?? ''
    form.man_of_the_match = Boolean(s.man_of_the_match ?? s.mom)
    form.rating = (s.rating as number) ?? ''
    form.position = String(s.position || '')
    playerName.value = String(s.player_name || '')
  } finally {
    loading.value = false
  }
})

async function save() {
  saving.value = true
  try {
    await adminFetch(`admin/player-stats/${route.params.id}`, {
      method: 'PUT',
      body: {
        match_id: Number(form.fixture_id),
        goals: form.goals === '' ? null : Number(form.goals),
        assists: form.assists === '' ? null : Number(form.assists),
        man_of_the_match: form.man_of_the_match,
        rating: form.rating === '' ? null : Number(form.rating),
        position: form.position || null
      }
    })
    editing.value = false
    toast.add({ title: 'Player stat updated', color: 'success' })
  } catch (e: unknown) {
    toast.add({ title: (e as { data?: { message?: string } })?.data?.message || 'Save failed', color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <AdminPageHeader :title="`Player stat #${route.params.id}`">
      <template #actions>
        <UButton
          to="/player-stats"
          variant="ghost"
          color="neutral"
          label="Back"
        />
      </template>
    </AdminPageHeader>
    <AdminFormSkeleton
      v-if="loading"
      :fields="5"
    />
    <form
      v-else
      class="max-w-xl space-y-4 rounded-xl border border-white/10 bg-graphite-900/70 p-6"
      @submit.prevent="save"
    >
      <div class="flex items-center justify-between gap-3">
        <p class="text-sm text-graphite-400">
          {{ playerName || 'Player' }}
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

      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="Match ID">
          <UInput
            v-model="form.fixture_id"
            type="number"
            class="w-full font-mono"
            :disabled="!editing"
          />
        </UFormField>
        <UFormField label="Tournament player ID">
          <UInput
            v-model="form.player_id"
            type="number"
            class="w-full font-mono"
            disabled
          />
        </UFormField>
      </div>
      <UFormField label="Position">
        <UInput
          v-model="form.position"
          class="w-full"
          :disabled="!editing"
        />
      </UFormField>
      <div class="grid gap-4 sm:grid-cols-3">
        <UFormField label="Goals">
          <UInput
            v-model="form.goals"
            type="number"
            class="w-full font-mono"
            :disabled="!editing"
          />
        </UFormField>
        <UFormField label="Assists">
          <UInput
            v-model="form.assists"
            type="number"
            class="w-full font-mono"
            :disabled="!editing"
          />
        </UFormField>
        <UFormField label="Rating">
          <UInput
            v-model="form.rating"
            type="number"
            step="0.1"
            class="w-full font-mono"
            :disabled="!editing"
          />
        </UFormField>
      </div>
      <UCheckbox
        v-model="form.man_of_the_match"
        label="Man of the match"
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
