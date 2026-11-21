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
  body: string
}

type MessageRecipient = {
  user_id: number
  name: string
  email: string
  role: string
}

type ReplyToOption = {
  email: string
  name: string
  role: string
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
const confirmSaveOpen = ref(false)
const templates = ref<MessageTemplate[]>([])
const messageRecipients = ref<MessageRecipient[]>([])
const replyToOptions = ref<ReplyToOption[]>([])
const selectedRecipientIds = ref<number[]>([])
const selectedTemplate = ref('empty_no_teams')
const messageSubject = ref('')
const messageBody = ref('')
const replyToEmail = ref('')
const replyToName = ref('')
const delayMinutes = ref(30)

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

function requestSave() {
  if (isNew.value) {
    void save()
    return
  }
  confirmSaveOpen.value = true
}

async function save() {
  confirmSaveOpen.value = false
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

function applyTemplate(key: string) {
  const tpl = templates.value.find(t => t.key === key)
  if (!tpl) return
  selectedTemplate.value = key
  messageSubject.value = tpl.subject
  messageBody.value = tpl.body
}

function toggleRecipient(id: number, checked: boolean) {
  if (checked) {
    if (!selectedRecipientIds.value.includes(id)) selectedRecipientIds.value = [...selectedRecipientIds.value, id]
  } else {
    selectedRecipientIds.value = selectedRecipientIds.value.filter(x => x !== id)
  }
}

async function openMessageModal() {
  messageOpen.value = true
  messageLoading.value = true
  try {
    const res = await adminFetch<{
      templates: MessageTemplate[]
      recipients: MessageRecipient[]
      reply_to_options: ReplyToOption[]
      delay_minutes: number
    }>(`admin/tournaments/${route.params.id}/message-templates`)
    templates.value = res.data.templates || []
    messageRecipients.value = res.data.recipients || []
    replyToOptions.value = res.data.reply_to_options || []
    delayMinutes.value = res.data.delay_minutes || 30
    selectedRecipientIds.value = messageRecipients.value.map(r => r.user_id)
    const defaultReply = replyToOptions.value[0]
    replyToEmail.value = defaultReply?.email || ''
    replyToName.value = defaultReply?.name || ''
    if (templates.value.length) applyTemplate(templates.value[0].key)
  } catch (e: unknown) {
    toast.add({ title: (e as { data?: { message?: string } })?.data?.message || 'Could not load templates', color: 'error' })
    messageOpen.value = false
  } finally {
    messageLoading.value = false
  }
}

watch(selectedTemplate, (key) => {
  if (!messageLoading.value) applyTemplate(key)
})

async function sendMessage() {
  if (!messageSubject.value.trim() || !messageBody.value.trim()) {
    toast.add({ title: 'Subject and message body are required', color: 'error' })
    return
  }
  if (!selectedRecipientIds.value.length) {
    toast.add({ title: 'Select at least one recipient', color: 'error' })
    return
  }
  messageSending.value = true
  try {
    const res = await adminFetch<{ delay_minutes: number, send_at: string }>(`admin/tournaments/${route.params.id}/messages`, {
      method: 'POST',
      body: {
        template: selectedTemplate.value,
        subject: messageSubject.value,
        body: messageBody.value,
        recipient_user_ids: selectedRecipientIds.value,
        reply_to_email: replyToEmail.value || null,
        reply_to_name: replyToName.value || null
      }
    })
    toast.add({
      title: `Scheduled for ${res.data.delay_minutes || delayMinutes.value} minutes`,
      description: 'Cancel or edit from Mail schedule before it sends.',
      color: 'success'
    })
    messageOpen.value = false
  } catch (e: unknown) {
    toast.add({ title: (e as { data?: { message?: string } })?.data?.message || 'Schedule failed', color: 'error' })
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
        @submit.prevent="requestSave"
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
      v-model:open="confirmSaveOpen"
      title="Confirm tournament update"
      description="This will overwrite the tournament fields in the live database."
    >
      <template #content>
        <div class="space-y-4 p-5">
          <div>
            <h2 class="text-lg font-semibold text-graphite-50">
              Confirm tournament update
            </h2>
            <p class="mt-1 text-sm text-graphite-400">
              Update <span class="text-graphite-200">{{ form.name || `Tournament #${route.params.id}` }}</span>? This cannot be undone from here.
            </p>
          </div>
          <div class="flex justify-end gap-2 pt-2">
            <UButton
              color="neutral"
              variant="ghost"
              label="Cancel"
              @click="confirmSaveOpen = false"
            />
            <UButton
              color="primary"
              label="Yes, save changes"
              :loading="saving"
              @click="save"
            />
          </div>
        </div>
      </template>
    </UModal>

    <UModal
      v-model:open="messageOpen"
      title="Send tournament message"
      description="Queued for 30 minutes so you can cancel or edit from Mail schedule."
    >
      <template #content>
        <div class="max-h-[80vh] space-y-4 overflow-y-auto p-5">
          <div>
            <h2 class="text-lg font-semibold text-graphite-50">
              Send tournament message
            </h2>
            <p class="mt-1 text-sm text-graphite-400">
              Schedules for {{ delayMinutes }} minutes. Edit recipients and copy below, then cancel from Mail schedule if needed.
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

            <UFormField label="Subject">
              <UInput
                v-model="messageSubject"
                class="w-full"
                maxlength="180"
              />
            </UFormField>
            <UFormField label="Message">
              <UTextarea
                v-model="messageBody"
                class="w-full"
                :rows="8"
                maxlength="5000"
              />
            </UFormField>

            <div class="rounded-md border border-white/8 bg-graphite-950/40 p-3 space-y-3">
              <p class="text-sm text-graphite-300">
                Reply-to
              </p>
              <p class="text-xs text-graphite-500">
                When recipients hit reply, this address gets the response. Useful when different operators own the thread.
              </p>
              <UFormField
                v-if="replyToOptions.length"
                label="Quick pick"
              >
                <USelect
                  :model-value="replyToEmail"
                  :items="replyToOptions.map(o => ({ label: `${o.name} · ${o.email} (${o.role})`, value: o.email }))"
                  class="w-full"
                  @update:model-value="(email: string) => {
                    const opt = replyToOptions.find(o => o.email === email)
                    replyToEmail = email
                    replyToName = opt?.name || replyToName
                  }"
                />
              </UFormField>
              <div class="grid gap-3 sm:grid-cols-2">
                <UFormField label="Reply-to email">
                  <UInput
                    v-model="replyToEmail"
                    type="email"
                    class="w-full font-mono"
                    placeholder="ops@example.com"
                  />
                </UFormField>
                <UFormField label="Reply-to name">
                  <UInput
                    v-model="replyToName"
                    class="w-full"
                    placeholder="Ops desk"
                  />
                </UFormField>
              </div>
            </div>

            <div>
              <p class="mb-2 text-sm text-graphite-300">
                Recipients
              </p>
              <ul class="space-y-2">
                <li
                  v-for="r in messageRecipients"
                  :key="r.user_id"
                  class="flex items-start gap-3 rounded-md border border-white/8 px-3 py-2"
                >
                  <UCheckbox
                    :model-value="selectedRecipientIds.includes(r.user_id)"
                    @update:model-value="(v: boolean | 'indeterminate') => toggleRecipient(r.user_id, v === true)"
                  />
                  <div class="min-w-0 text-sm">
                    <p class="text-graphite-100">
                      {{ r.name }}
                      <span class="ml-2 font-mono text-[10px] uppercase tracking-wider text-graphite-500">{{ r.role }}</span>
                    </p>
                    <p class="truncate font-mono text-xs text-ops-300">
                      {{ r.email }}
                    </p>
                  </div>
                </li>
              </ul>
              <p
                v-if="!messageRecipients.length"
                class="text-sm text-graphite-500"
              >
                No creator/admin emails available.
              </p>
            </div>

            <div class="flex justify-end gap-2 pt-2">
              <UButton
                color="neutral"
                variant="ghost"
                label="Cancel"
                @click="messageOpen = false"
              />
              <UButton
                color="primary"
                icon="i-lucide-clock"
                label="Schedule send"
                :loading="messageSending"
                :disabled="!messageSubject.trim() || !messageBody.trim() || !selectedRecipientIds.length"
                @click="sendMessage"
              />
            </div>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
