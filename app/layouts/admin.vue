<script setup lang="ts">
import { adminNav } from '~/utils/nav'

const auth = useAuthStore()
const route = useRoute()

const mobileOpen = ref(false)

function isActive(to: string) {
  if (to === '/') return route.path === '/'
  return route.path === to || route.path.startsWith(`${to}/`)
}

async function logout() {
  auth.clearSession()
  await navigateTo('/login')
}
</script>

<template>
  <div class="ops-noise min-h-screen text-graphite-100">
    <div class="ops-grid fixed inset-0 -z-10 opacity-40" />

    <div class="flex min-h-screen">
      <aside
        class="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/8 bg-graphite-950/95 backdrop-blur-md transition-transform lg:static lg:translate-x-0"
        :class="mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
      >
        <div class="ops-enter border-b border-white/8 px-5 py-5">
          <p class="font-mono text-[10px] uppercase tracking-[0.28em] text-ops-400">
            MyProClubs
          </p>
          <h1 class="mt-1 text-xl font-bold tracking-tight text-white">
            Control Room
          </h1>
        </div>

        <nav class="flex-1 overflow-y-auto px-3 py-4">
          <div
            v-for="(group, gi) in adminNav"
            :key="group.label"
            class="ops-enter mb-5"
            :class="`ops-enter-delay-${Math.min(gi + 1, 3)}`"
          >
            <p class="mb-2 px-2 font-mono text-[10px] uppercase tracking-[0.22em] text-graphite-500">
              {{ group.label }}
            </p>
            <ul class="space-y-0.5">
              <li v-for="item in group.items" :key="item.to">
                <NuxtLink
                  :to="item.to"
                  class="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors"
                  :class="isActive(item.to)
                    ? 'bg-ops-500/15 text-ops-300 ring-1 ring-ops-500/30'
                    : 'text-graphite-300 hover:bg-white/5 hover:text-white'"
                  @click="mobileOpen = false"
                >
                  <UIcon :name="item.icon" class="size-4 shrink-0 opacity-80" />
                  <span>{{ item.label }}</span>
                </NuxtLink>
              </li>
            </ul>
          </div>
        </nav>

        <div class="border-t border-white/8 p-4">
          <p class="truncate font-mono text-xs text-graphite-400">
            {{ auth.user?.email }}
          </p>
          <UButton
            class="mt-2"
            color="neutral"
            variant="ghost"
            size="sm"
            icon="i-lucide-log-out"
            label="Sign out"
            block
            @click="logout"
          />
        </div>
      </aside>

      <div
        v-if="mobileOpen"
        class="fixed inset-0 z-30 bg-black/60 lg:hidden"
        @click="mobileOpen = false"
      />

      <div class="flex min-w-0 flex-1 flex-col">
        <header class="sticky top-0 z-20 flex items-center gap-3 border-b border-white/8 bg-graphite-950/80 px-4 py-3 backdrop-blur-md lg:px-8">
          <UButton
            class="lg:hidden"
            color="neutral"
            variant="ghost"
            icon="i-lucide-menu"
            aria-label="Open navigation"
            @click="mobileOpen = !mobileOpen"
          />
          <div class="min-w-0 flex-1">
            <p class="font-mono text-[10px] uppercase tracking-[0.2em] text-graphite-500">
              Operator console
            </p>
            <p class="truncate text-sm text-graphite-200">
              Privileged actions are audited.
            </p>
          </div>
        </header>

        <main class="ops-enter flex-1 px-4 py-6 lg:px-8">
          <slot />
        </main>
      </div>
    </div>
  </div>
</template>
