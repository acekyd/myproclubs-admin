<script setup lang="ts" generic="T extends Record<string, unknown>">
export type Column<T> = {
  key: string
  label: string
  class?: string
  mono?: boolean
}

const props = withDefaults(defineProps<{
  columns: Column<T>[]
  rows: T[]
  loading?: boolean
  error?: string | null
  page?: number
  lastPage?: number
  total?: number
  searchPlaceholder?: string
  skeletonRows?: number
}>(), {
  skeletonRows: 8,
})

const emit = defineEmits<{
  search: [value: string]
  page: [value: number]
  rowClick: [row: T]
}>()

const search = defineModel<string>('search', { default: '' })

const skeletonIndices = computed(() => Array.from({ length: props.skeletonRows }, (_, i) => i))

function cell(row: T, key: string) {
  const parts = key.split('.')
  let cur: unknown = row
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in (cur as object)) {
      cur = (cur as Record<string, unknown>)[p]
    } else {
      return '—'
    }
  }
  if (cur === null || cur === undefined || cur === '') return '—'
  if (typeof cur === 'boolean') return cur ? 'Yes' : 'No'
  return String(cur)
}
</script>

<template>
  <div class="overflow-hidden rounded-xl border border-white/10 bg-graphite-900/60 shadow-xl shadow-black/20">
    <div class="flex flex-wrap items-center gap-3 border-b border-white/8 px-4 py-3">
      <UInput
        v-model="search"
        :placeholder="searchPlaceholder || 'Search…'"
        icon="i-lucide-search"
        class="w-full max-w-sm"
        size="md"
        :disabled="loading && !rows.length"
        @update:model-value="emit('search', String($event ?? ''))"
      />
      <div class="ml-auto font-mono text-xs text-graphite-500">
        <span v-if="loading && total == null" class="inline-block h-3 w-20 animate-pulse rounded bg-white/10" />
        <span v-else-if="total != null">{{ total }} records</span>
      </div>
    </div>

    <div v-if="error" class="border-b border-ops-500/20 bg-ops-500/10 px-4 py-3 text-sm text-ops-300">
      {{ error }}
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full text-left text-sm">
        <thead class="border-b border-white/8 bg-white/[0.02]">
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              class="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-graphite-500"
              :class="col.class"
            >
              {{ col.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <template v-if="loading && !rows.length">
            <tr
              v-for="i in skeletonIndices"
              :key="`sk-${i}`"
              class="border-b border-white/[0.04]"
            >
              <td
                v-for="col in columns"
                :key="col.key"
                class="px-4 py-3"
              >
                <span
                  class="block h-3.5 animate-pulse rounded bg-white/10"
                  :class="col.mono ? 'w-16' : (i % 2 === 0 ? 'w-28' : 'w-40')"
                  :style="{ animationDelay: `${i * 40}ms` }"
                />
              </td>
            </tr>
          </template>

          <template v-else-if="!rows.length">
            <tr>
              <td
                :colspan="columns.length"
                class="px-4 py-10 text-center text-sm text-graphite-400"
              >
                No results.
              </td>
            </tr>
          </template>

          <template v-else>
            <tr
              v-for="(row, idx) in rows"
              :key="(row.id as string | number | undefined) ?? idx"
              class="cursor-pointer border-b border-white/[0.04] transition-colors hover:bg-ops-500/5"
              :class="loading ? 'opacity-60' : ''"
              @click="emit('rowClick', row)"
            >
              <td
                v-for="col in columns"
                :key="col.key"
                class="px-4 py-3 text-graphite-200"
                :class="[col.class, col.mono ? 'font-mono text-xs' : '']"
              >
                <slot :name="`cell-${col.key}`" :row="row" :value="cell(row, col.key)">
                  {{ cell(row, col.key) }}
                </slot>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <div
      v-if="loading || (lastPage && lastPage > 1)"
      class="flex items-center justify-between gap-3 border-t border-white/8 px-4 py-3"
    >
      <UButton
        color="neutral"
        variant="ghost"
        size="sm"
        :disabled="loading || !page || page <= 1"
        label="Previous"
        @click="emit('page', (page || 1) - 1)"
      />
      <span class="font-mono text-xs text-graphite-500">
        <template v-if="loading && !lastPage">
          <span class="inline-block h-3 w-24 animate-pulse rounded bg-white/10" />
        </template>
        <template v-else-if="lastPage">
          Page {{ page }} / {{ lastPage }}
        </template>
      </span>
      <UButton
        color="neutral"
        variant="ghost"
        size="sm"
        :disabled="loading || !page || !lastPage || page >= lastPage"
        label="Next"
        @click="emit('page', (page || 1) + 1)"
      />
    </div>
  </div>
</template>
