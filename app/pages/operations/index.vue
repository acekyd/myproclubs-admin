<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['admin-auth'],
})

const { adminFetch } = useAdminApi()
const toast = useToast()

const counts = ref<Record<string, number> | null>(null)
const form = reactive({
  operation: 'verify_email' as 'verify_email' | 'revoke_tokens' | 'set_membership',
  user_id: '' as string | number,
  club_id: '' as string | number,
  is_manager: false,
  reason: '',
})
const confirmMutate = ref(false)
const loading = ref(false)


const operations = [
  { value: 'verify_email', label: 'Confirm email after identity verification' },
  { value: 'revoke_tokens', label: 'Revoke all API tokens' },
  { value: 'set_membership', label: 'Add membership / change club manager access' },
]

const route = useRoute()

onMounted(async () => {
  if (route.query.user_id) {
    form.user_id = String(route.query.user_id)
  }
  const res = await adminFetch<{ counts: Record<string, number> }>('admin/dashboard')
  counts.value = res.data.counts
})


async function submit() {
  if (!confirmMutate.value) {
    toast.add({ title: 'Confirm that this mutates a live account', color: 'warning' })
    return
  }
  if (String(form.reason).trim().length < 10) {
    toast.add({ title: 'Reason must be at least 10 characters', color: 'error' })
    return
  }
  loading.value = true
  try {
    await adminFetch('admin/support', {
      method: 'POST',
      body: {
        operation: form.operation,
        user_id: Number(form.user_id),
        reason: form.reason,
        club_id: form.operation === 'set_membership' ? Number(form.club_id) : undefined,
        is_manager: form.operation === 'set_membership' ? form.is_manager : undefined,
      },
    })
    toast.add({ title: 'Support action completed and recorded', color: 'success' })
    form.reason = ''
    confirmMutate.value = false
  } catch (e: unknown) {
    toast.add({
      title: (e as { data?: { message?: string } })?.data?.message || 'Action failed',
      color: 'error',
    })
  } finally {
    loading.value = false
  }
}

</script>

<template>
  <div>
    <AdminPageHeader
      title="Support & operations"
      description="Resolve account issues. Every action requires a reason and is written to the audit log."
    />

    <div class="mb-8 grid gap-3 sm:grid-cols-4">
      <div
        v-for="key in (counts ? Object.keys(counts) : ['users', 'clubs', 'tournaments', 'failed_jobs'])"
        :key="key"
        class="rounded-lg border border-white/10 bg-graphite-900/60 px-4 py-3"
      >
        <p class="font-mono text-[10px] uppercase tracking-widest text-graphite-500">
          {{ key }}
        </p>
        <p class="mt-1 font-mono text-2xl text-white">
          <span
            v-if="!counts"
            class="inline-block h-7 w-14 animate-pulse rounded bg-white/10"
          />
          <template v-else>
            {{ counts[key] }}
          </template>
        </p>
      </div>
    </div>


    <form
      class="max-w-xl space-y-4 rounded-xl border border-white/10 bg-graphite-900/70 p-6"
      @submit.prevent="submit"
    >
      <h3 class="text-lg font-semibold text-white">
        Resolve an account issue
      </h3>
      <p class="text-sm text-graphite-400">
        Check the account and club IDs in their management screens before applying a change.
      </p>

      <UFormField label="Operation">
        <USelect
          v-model="form.operation"
          :items="operations"
          value-key="value"
          label-key="label"
          class="w-full"
        />
      </UFormField>

      <UFormField label="User ID">
        <UInput v-model="form.user_id" type="number" min="1" required class="w-full font-mono" />
      </UFormField>

      <template v-if="form.operation === 'set_membership'">
        <UFormField label="Club ID">
          <UInput v-model="form.club_id" type="number" min="1" required class="w-full font-mono" />
        </UFormField>
        <UCheckbox v-model="form.is_manager" label="Club manager" />
      </template>

      <UFormField label="Reason" hint="Support reference and decision. Do not enter passwords or codes.">
        <UTextarea v-model="form.reason" :rows="4" required class="w-full" />
      </UFormField>

      <div class="rounded-md border border-ops-500/30 bg-ops-500/10 px-3 py-2 text-sm text-ops-200">
        This writes to live user/club data and the audit log. It does not send emails, but it does mutate accounts.
      </div>

      <UCheckbox v-model="confirmMutate" label="I understand this mutates a live account" />

      <UButton
        type="submit"
        color="primary"
        :loading="loading"
        :disabled="!confirmMutate"
        label="Run support action"
      />
    </form>

  </div>
</template>
