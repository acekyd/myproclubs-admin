<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin-auth'] })

type Recipient = {
  user_id: number
  name: string
  email: string
  role: string
}

type ScheduledMail = {
  id: number
  tournament_id: number
  template: string
  subject: string
  body: string
  reply_to_email?: string | null
  reply_to_name?: string | null
  status: string
  send_at: string
  sent_at?: string | null
  cancelled_at?: string | null
  cancel_reason?: string | null
  recipients: Recipient[]
  tournament?: { id: number, name: string, slug?: string } | null
}

import { apiErrorMessage, safeTrim } from '~/utils/admin-api'

const route = useRoute()
const { adminFetch } = useAdminApi()
const toast = useToast()
const loading = ref(true)
const saving = ref(false)
const cancelling = ref(false)
const mail = ref<ScheduledMail | null>(null)
const subject = ref('')
const body = ref('')
const replyToEmail = ref('')
const replyToName = ref('')
const sendAt = ref('')
const selectedRecipientIds = ref<number[]>([])
const cancelReason = ref('')
const loadError = ref<string | null>(null)

const isPending = computed(() => mail.value?.status === 'pending')
const canSaveChanges = computed(() => (
  isPending.value
  && safeTrim(subject.value) !== ''
  && safeTrim(body.value) !== ''
  && selectedRecipientIds.value.length > 0
))

onMounted(async () => {
  try {
    const res = await adminFetch<{ scheduled_mail: ScheduledMail }>(`admin/scheduled-mails/${route.params.id}`)
    mail.value = res.data.scheduled_mail
    subject.value = String(mail.value?.subject ?? '')
    body.value = String(mail.value?.body ?? '')
    replyToEmail.value = String(mail.value?.reply_to_email ?? '')
    replyToName.value = String(mail.value?.reply_to_name ?? '')
    sendAt.value = mail.value?.send_at ? String(mail.value.send_at).slice(0, 16) : ''
    selectedRecipientIds.value = (mail.value?.recipients || []).map(r => r.user_id)
  } catch (e: unknown) {
    loadError.value = apiErrorMessage(e, 'Failed to load scheduled mail')
  } finally {
    loading.value = false
  }
})

function toggleRecipient(id: number, checked: boolean) {
  if (checked) {
    if (!selectedRecipientIds.value.includes(id)) selectedRecipientIds.value = [...selectedRecipientIds.value, id]
  } else {
    selectedRecipientIds.value = selectedRecipientIds.value.filter(x => x !== id)
  }
}

async function save() {
  if (!isPending.value) return
  saving.value = true
  try {
    const res = await adminFetch<{ scheduled_mail: ScheduledMail }>(`admin/scheduled-mails/${route.params.id}`, {
      method: 'PUT',
      body: {
        subject: safeTrim(subject.value),
        body: safeTrim(body.value),
        recipient_user_ids: selectedRecipientIds.value,
        reply_to_email: safeTrim(replyToEmail.value) || null,
        reply_to_name: safeTrim(replyToName.value) || null,
        send_at: sendAt.value || null
      }
    })
    mail.value = res.data.scheduled_mail
    toast.add({ title: 'Scheduled mail updated', color: 'success' })
  } catch (e: unknown) {
    toast.add({ title: apiErrorMessage(e, 'Update failed'), color: 'error' })
  } finally {
    saving.value = false
  }
}

async function cancelMail() {
  if (!isPending.value) return
  cancelling.value = true
  try {
    const res = await adminFetch<{ scheduled_mail: ScheduledMail }>(`admin/scheduled-mails/${route.params.id}/cancel`, {
      method: 'POST',
      body: { reason: cancelReason.value || null }
    })
    mail.value = res.data.scheduled_mail
    toast.add({ title: 'Scheduled mail cancelled', color: 'success' })
  } catch (e: unknown) {
    toast.add({ title: apiErrorMessage(e, 'Cancel failed'), color: 'error' })
  } finally {
    cancelling.value = false
  }
}
</script>

<template>
  <div>
    <AdminPageHeader :title="`Scheduled mail #${route.params.id}`">
      <template #actions>
        <UButton
          v-if="mail?.tournament_id"
          :to="`/tournaments/${mail.tournament_id}`"
          color="neutral"
          variant="outline"
          label="Tournament"
        />
        <UButton
          to="/mail-schedule"
          variant="ghost"
          color="neutral"
          label="Back"
        />
      </template>
    </AdminPageHeader>

    <AdminFormSkeleton
      v-if="loading"
      :fields="6"
    />
    <div
      v-else-if="loadError"
      class="rounded-xl border border-ops-500/20 bg-ops-500/10 px-4 py-3 text-sm text-ops-300"
    >
      {{ loadError }}
    </div>
    <div
      v-else-if="mail"
      class="grid max-w-3xl gap-6"
    >
      <div class="rounded-xl border border-white/10 bg-graphite-900/70 p-6 space-y-4">
        <div class="flex flex-wrap gap-3 text-sm text-graphite-400">
          <span>Status: <span class="text-graphite-100">{{ mail.status }}</span></span>
          <span>Template: <span class="font-mono text-ops-300">{{ mail.template }}</span></span>
          <span v-if="mail.tournament">Tournament: <span class="text-graphite-100">{{ mail.tournament.name }}</span></span>
        </div>

        <UFormField label="Subject">
          <UInput
            v-model="subject"
            class="w-full"
            :disabled="!isPending"
            maxlength="180"
          />
        </UFormField>
        <UFormField label="Message">
          <UTextarea
            v-model="body"
            class="w-full"
            :rows="8"
            :disabled="!isPending"
            maxlength="5000"
          />
        </UFormField>
        <div class="grid gap-3 sm:grid-cols-2">
          <UFormField label="Reply-to email">
            <UInput
              v-model="replyToEmail"
              type="email"
              class="w-full font-mono"
              :disabled="!isPending"
            />
          </UFormField>
          <UFormField label="Reply-to name">
            <UInput
              v-model="replyToName"
              class="w-full"
              :disabled="!isPending"
            />
          </UFormField>
        </div>
        <UFormField label="Send at">
          <UInput
            v-model="sendAt"
            type="datetime-local"
            class="w-full font-mono"
            :disabled="!isPending"
          />
        </UFormField>

        <div>
          <p class="mb-2 text-sm text-graphite-300">
            Recipients
          </p>
          <ul class="space-y-2">
            <li
              v-for="r in mail.recipients || []"
              :key="r.user_id"
              class="flex items-start gap-3 rounded-md border border-white/8 px-3 py-2"
            >
              <UCheckbox
                :model-value="selectedRecipientIds.includes(r.user_id)"
                :disabled="!isPending"
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
        </div>

        <div
          v-if="isPending"
          class="flex flex-wrap gap-2 pt-2"
        >
          <UButton
            color="primary"
            label="Save changes"
            :loading="saving"
            :disabled="!canSaveChanges"
            @click="save"
          />
        </div>
      </div>

      <div
        v-if="isPending"
        class="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6 space-y-3"
      >
        <p class="text-sm text-amber-100">
          Cancel before send time to stop delivery.
        </p>
        <UFormField label="Cancel reason (optional)">
          <UInput
            v-model="cancelReason"
            class="w-full"
          />
        </UFormField>
        <UButton
          color="error"
          variant="soft"
          label="Cancel scheduled send"
          :loading="cancelling"
          @click="cancelMail"
        />
      </div>

      <p
        v-else-if="mail.cancel_reason"
        class="text-sm text-graphite-400"
      >
        Cancel reason: {{ mail.cancel_reason }}
      </p>
    </div>
  </div>
</template>
