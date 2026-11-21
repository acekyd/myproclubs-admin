<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin-auth'] })

type Person = {
  id: number
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  gamer_tag?: string | null
}

type MessageTemplate = {
  key: string
  label: string
  subject: string
  preview: string
}

const route = useRoute()
const { adminFetch } = useAdminApi()
const toast = useToast()
const isNew = computed(() => route.params.id === 'new')
const loading = ref(!isNew.value)
const saving = ref(false)
const editing = ref(isNew.value)
const seasons = ref<Array<Record<string, unknown>>>([])
const owner = ref<Person | null>(null)
const admins = ref<Person[]>([])
const messageOpen = ref(false)
const messageLoading = ref(false)
const messageSending = ref(false)
const templates = ref<MessageTemplate[]>([])
const selectedTemplate = ref('empty_no_teams')
const customSubject = ref('')
const customBody = ref('')

const form = reactive({
  owner_id: '' as string | number,
  name: '',
  slug: '',
  description: '',
  reference_id: '',
  logo: '',
  date: '',
  tournament_type: '',
  is_public: false
})

function personLabel(p: Person | null | undefined) {
  if (!p) return '—'
  const full = `${p.first_name || ''} ${p.last_name || ''}`.trim()
  return full || p.gamer_tag || p.email || `#${p.id}`
}

onMounted(async () => {
  if (isNew.value) return
  try {
    const res = await adminFetch<{
      tournament: Record<string, unknown> & {
        seasons?: Array<Record<string, unknown>>
        owner?: Person
        admins?: Person[]
      }
    }>(`admin/tournaments/${route.params.id}`)
    const t = res.data.tournament
    form.owner_id = t.owner_id as number
    form.name = String(t.name || '')
    form.slug = String(t.slug || '')
    form.description = String(t.description || '')
    form.reference_id = String(t.reference_id || '')
    form.logo = String(t.logo || '')
    form.date = t.date ? String(t.date).slice(0, 16) : ''
    form.tournament_type = String(t.tournament_type || '')
    form.is_public = Boolean(t.is_public)
    seasons.value = t.seasons || []
    owner.value = t.owner || null
    admins.value = t.admins || []
  } finally {
    loading.value = false
  }
})

async function save() {
  saving.value = true
  try {
    const body: Record<string, unknown> = {
      ...form,
      owner_id: Number(form.owner_id),
      date: form.date || null
    }
    if (isNew.value) {
      const res = await adminFetch<{ tournament: { id: number } }>('admin/tournaments', { method: 'POST', body })
      toast.add({ title: 'Tournament created', color: 'success' })
      await navigateTo(`/tournaments/${res.data.tournament.id}`)
    } else {
      const res = await adminFetch<{ tournament: Record<string, unknown> & { owner?: Person, admins?: Person[], seasons?: Array<Record<string, unknown>> } }>(
        `admin/tournaments/${route.params.id}`,
        { method: 'PUT', body }
      )
      const t = res.data.tournament
      owner.value = t.owner || owner.value
      admins.value = t.admins || admins.value
      seasons.value = t.seasons || seasons.value
      editing.value = false
      toast.add({ title: 'Tournament updated', color: 'success' })
    }
  } catch (e: unknown) {
    toast.add({ title: (e as { data?: { message?: string } })?.data?.message || 'Save failed', color: 'error' })
  } finally {
    saving.value = false
  }
}

async function openMessageModal() {
  messageOpen.value = true
  messageLoading.value = true
  try {
    const res = await adminFetch<{ templates: MessageTemplate[] }>(`admin/tournaments/${route.params.id}/message-templates`)
    templates.value = res.data.templates || []
    if (templates.value.length) {
      selectedTemplate.value = templates.value[0].key
      customSubject.value = templates.value.find(t => t.key === 'custom')?.subject || ''
    }
  } catch (e: unknown) {
    toast.add({ title: (e as { data?: { message?: string } })?.data?.message || 'Could not load templates', color: 'error' })
    messageOpen.value = false
  } finally {
    messageLoading.value = false
  }
}

const activeTemplate = computed(() => templates.value.find(t => t.key === selectedTemplate.value))
const isCustom = computed(() => selectedTemplate.value === 'custom')

async function sendMessage() {
  messageSending.value = true
  try {
    const body: Record<string, unknown> = { template: selectedTemplate.value }
    if (isCustom.value) {
      body.subject = customSubject.value
      body.body = customBody.value
    }
    const res = await adminFetch<{ sent: number }>(`admin/tournaments/${route.params.id}/messages`, {
      method: 'POST',
      body
    })
    toast.add({ title: `Queued ${res.data.sent} message(s)`, color: 'success' })
    messageOpen.value = false
    customBody.value = ''
  } catch (e: unknown) {
    toast.add({ title: (e as { data?: { message?: string } })?.data?.message || 'Send failed', color: 'error' })
  } finally {
    messageSending.value = false
  }
}
</script>

<template>
  <div>
    <AdminPageHeader :title="isNew ? 'New tournament' : `Tournament #${route.params.id}`">
      <template #actions>
        <UButton
          v-if="!isNew"
          color="neutral"
          variant="outline"
          icon="i-lucide-mail"
          label="Send message"
          @click="openMessageModal"
        />
        <UButton
          to="/tournaments"
          variant="ghost"
          color="neutral"
          label="Back"
        />
      </template>
    </AdminPageHeader>

    <AdminFormSkeleton
      v-if="loading"
      :fields="7"
    />
    <div
      v-else
      class="grid gap-6 lg:grid-cols-[1fr_280px]"
    >
      <form
        class="space-y-4 rounded-xl border border-white/10 bg-graphite-900/70 p-6"
        @submit.prevent="save"
      >
        <div class="flex items-center justify-between gap-3">
          <p class="font-mono text-[10px] uppercase tracking-widest text-graphite-500">
            Details
          </p>
          <div
            v-if="!isNew"
            class="flex gap-2"
          >
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
          <UFormField label="Owner user ID">
            <UInput
              v-model="form.owner_id"
              type="number"
              required
              class="w-full font-mono"
              :disabled="!editing"
            />
          </UFormField>
          <UFormField label="Reference ID">
            <UInput
              v-model="form.reference_id"
              required
              class="w-full font-mono"
              :disabled="!editing"
            />
          </UFormField>
        </div>
        <UFormField label="Name">
          <UInput
            v-model="form.name"
            required
            class="w-full"
            :disabled="!editing"
          />
        </UFormField>
        <UFormField label="Slug">
          <UInput
            v-model="form.slug"
            class="w-full font-mono"
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
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="Type">
            <UInput
              v-model="form.tournament_type"
              class="w-full"
              :disabled="!editing"
            />
          </UFormField>
          <UFormField label="Date">
            <UInput
              v-model="form.date"
              type="datetime-local"
              class="w-full font-mono"
              :disabled="!editing"
            />
          </UFormField>
        </div>
        <UFormField label="Logo URL">
          <UInput
            v-model="form.logo"
            class="w-full"
            :disabled="!editing"
          />
        </UFormField>
        <UCheckbox
          v-model="form.is_public"
          label="Public"
          :disabled="!editing"
        />
        <UButton
          v-if="editing"
          type="submit"
          color="primary"
          :loading="saving"
          :label="isNew ? 'Create' : 'Save changes'"
        />
      </form>

      <aside
        v-if="!isNew"
        class="space-y-4"
      >
        <div class="rounded-xl border border-white/10 bg-graphite-900/70 p-4">
          <p class="font-mono text-[10px] uppercase tracking-widest text-graphite-500">
            Creator
          </p>
          <div class="mt-3 space-y-1 text-sm">
            <p class="text-graphite-100">
              {{ personLabel(owner) }}
            </p>
            <p
              v-if="owner?.email"
              class="font-mono text-xs text-ops-300"
            >
              {{ owner.email }}
            </p>
            <p
              v-if="owner?.id"
              class="font-mono text-[11px] text-graphite-500"
            >
              user #{{ owner.id }}
            </p>
          </div>
        </div>

        <div class="rounded-xl border border-white/10 bg-graphite-900/70 p-4">
          <p class="font-mono text-[10px] uppercase tracking-widest text-graphite-500">
            Tournament admins
          </p>
          <ul
            v-if="admins.length"
            class="mt-3 space-y-2"
          >
            <li
              v-for="admin in admins"
              :key="admin.id"
              class="rounded-md border border-white/8 px-3 py-2 text-sm"
            >
              <p class="text-graphite-100">
                {{ personLabel(admin) }}
              </p>
              <p
                v-if="admin.email"
                class="font-mono text-xs text-ops-300"
              >
                {{ admin.email }}
              </p>
            </li>
          </ul>
          <p
            v-else
            class="mt-3 text-sm text-graphite-500"
          >
            No co-admins yet.
          </p>
        </div>

        <div class="rounded-xl border border-white/10 bg-graphite-900/70 p-4">
          <p class="font-mono text-[10px] uppercase tracking-widest text-graphite-500">
            Seasons
          </p>
          <ul
            v-if="seasons.length"
            class="mt-3 space-y-2"
          >
            <li
              v-for="s in seasons"
              :key="String(s.id)"
              class="rounded-md border border-white/8 px-3 py-2 text-sm"
            >
              <span class="font-mono text-xs text-ops-300">#{{ s.id }}</span>
              <span class="ml-2 text-graphite-200">{{ s.name || s.title || 'Season' }}</span>
            </li>
          </ul>
          <p
            v-else
            class="mt-3 text-sm text-graphite-500"
          >
            No seasons attached.
          </p>
        </div>
      </aside>
    </div>

    <UModal
      v-model:open="messageOpen"
      title="Send tournament message"
      description="Sends to the creator and all tournament admins via the backend mail queue."
    >
      <template #content>
        <div class="space-y-4 p-5">
          <div>
            <h2 class="text-lg font-semibold text-graphite-50">
              Send tournament message
            </h2>
            <p class="mt-1 text-sm text-graphite-400">
              Sends to the creator and all tournament admins via the backend mail queue.
            </p>
          </div>

          <div
            v-if="messageLoading"
            class="py-8 text-center text-sm text-graphite-400"
          >
            Loading templates…
          </div>
          <div
            v-else
            class="space-y-4"
          >
            <UFormField label="Template">
              <USelect
                v-model="selectedTemplate"
                :items="templates.map(t => ({ label: t.label, value: t.key }))"
                class="w-full"
              />
            </UFormField>

            <p
              v-if="activeTemplate && !isCustom"
              class="rounded-md border border-white/8 bg-graphite-950/50 p-3 text-sm text-graphite-300"
            >
              {{ activeTemplate.preview }}
            </p>

            <template v-if="isCustom">
              <UFormField label="Subject">
                <UInput
                  v-model="customSubject"
                  class="w-full"
                  maxlength="180"
                />
              </UFormField>
              <UFormField label="Message">
                <UTextarea
                  v-model="customBody"
                  class="w-full"
                  :rows="6"
                  maxlength="5000"
                />
              </UFormField>
            </template>

            <div class="flex justify-end gap-2 pt-2">
              <UButton
                color="neutral"
                variant="ghost"
                label="Cancel"
                @click="messageOpen = false"
              />
              <UButton
                color="primary"
                icon="i-lucide-send"
                label="Send"
                :loading="messageSending"
                :disabled="isCustom && (!customSubject.trim() || !customBody.trim())"
                @click="sendMessage"
              />
            </div>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
