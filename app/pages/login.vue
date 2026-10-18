<script setup lang="ts">
definePageMeta({
  layout: false,
  middleware: ['admin-auth'],
})

const auth = useAuthStore()
const { adminFetch, baseURL } = useAdminApi()
const route = useRoute()
const toast = useToast()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

onMounted(() => {
  if (route.query.reason === 'forbidden') {
    error.value = 'This account is not on the operator allowlist.'
  } else if (route.query.reason === 'expired') {
    error.value = 'Session expired. Sign in again.'
  }
})

async function submit() {
  loading.value = true
  error.value = null
  try {
    const res = await $fetch<{
      status: string
      data: { token: string, user: { id: number, email: string, is_platform_admin?: boolean } & Record<string, unknown> }
    }>('login', {
      baseURL,
      method: 'POST',
      body: { email: email.value, password: password.value },
    })

    const user = res.data.user
    if (!user.is_platform_admin) {
      error.value = 'Not an operator. Platform access requires an allowlisted verified email.'
      return
    }

    auth.setSession(res.data.token, {
      id: user.id,
      email: user.email,
      first_name: user.first_name as string | undefined,
      last_name: user.last_name as string | undefined,
      gamer_tag: user.gamer_tag as string | undefined,
      platform: user.platform as string | undefined,
      is_platform_admin: true,
    })

    // Confirm gate with admin/me
    await adminFetch('admin/me')
    toast.add({ title: 'Welcome to Control Room', color: 'success' })
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await navigateTo(redirect)
  } catch (e: unknown) {
    const msg = (e as { data?: { message?: string } })?.data?.message
    error.value = msg || 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="ops-noise relative flex min-h-screen items-center justify-center px-4">
    <div class="ops-grid absolute inset-0 opacity-50" />
    <div class="ops-enter relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-graphite-950/90 p-8 shadow-2xl shadow-ops-950/40 backdrop-blur">
      <p class="font-mono text-[10px] uppercase tracking-[0.3em] text-ops-400">
        MyProClubs
      </p>
      <h1 class="mt-2 text-3xl font-extrabold tracking-tight text-white">
        Control Room
      </h1>
      <p class="mt-2 text-sm text-graphite-400">
        Operator sign-in. Access is allowlist-gated and audited.
      </p>

      <form class="mt-8 space-y-4" action="#" method="post" @submit.prevent.stop="submit">
        <label class="block space-y-1.5 text-sm">
          <span class="text-graphite-300">Email</span>
          <input
            v-model="email"
            type="email"
            name="email"
            autocomplete="username"
            required
            class="w-full rounded-md border border-white/15 bg-graphite-950 px-3 py-2 text-white outline-none ring-ops-500 focus:ring-2"
            placeholder="operator@myproclubs.com"
          >
        </label>
        <label class="block space-y-1.5 text-sm">
          <span class="text-graphite-300">Password</span>
          <input
            v-model="password"
            type="password"
            name="password"
            autocomplete="current-password"
            required
            class="w-full rounded-md border border-white/15 bg-graphite-950 px-3 py-2 text-white outline-none ring-ops-500 focus:ring-2"
          >
        </label>


        <p v-if="error" class="rounded-md border border-ops-500/30 bg-ops-500/10 px-3 py-2 text-sm text-ops-300">
          {{ error }}
        </p>

        <UButton
          type="button"
          color="primary"
          block
          size="lg"
          :loading="loading"
          :disabled="loading"
          label="Enter console"
          @click="submit"
        />
      </form>
    </div>
  </div>
</template>
