export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore()
  const { adminFetch } = useAdminApi()

  if (to.path === '/login') {
    if (auth.token && auth.isAuthenticated) {
      return navigateTo('/')
    }
    return
  }

  if (!auth.token) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }

  if (!auth.bootstrapped || !auth.user) {
    try {
      const res = await adminFetch<{ user: typeof auth.user }>('admin/me')
      auth.user = res.data.user
      auth.bootstrapped = true
      if (!res.data.user?.is_platform_admin) {
        auth.clearSession()
        return navigateTo({ path: '/login', query: { reason: 'forbidden' } })
      }
    } catch {
      auth.clearSession()
      return navigateTo({ path: '/login', query: { reason: 'expired' } })
    }
  }
})
