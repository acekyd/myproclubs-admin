import { defineStore } from 'pinia'

export type AdminUser = {
  id: number
  first_name?: string
  last_name?: string
  email: string
  gamer_tag?: string
  platform?: string
  is_platform_admin?: boolean
}

export const useAuthStore = defineStore('auth', () => {
  const token = useCookie<string | null>('mpc_admin_token', {
    maxAge: 60 * 60 * 24 * 3,
    sameSite: 'lax',
  })
  const user = ref<AdminUser | null>(null)
  const bootstrapped = ref(false)

  const isAuthenticated = computed(() => Boolean(token.value && user.value?.is_platform_admin))

  function setSession(nextToken: string, nextUser: AdminUser) {
    token.value = nextToken
    user.value = nextUser
  }

  function clearSession() {
    token.value = null
    user.value = null
  }

  return {
    token,
    user,
    bootstrapped,
    isAuthenticated,
    setSession,
    clearSession,
  }
})
