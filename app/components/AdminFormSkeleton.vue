<script setup lang="ts">
const props = withDefaults(defineProps<{
  fields?: number
}>(), {
  fields: 5,
})

const indices = computed(() => Array.from({ length: props.fields }, (_, i) => i))
</script>

<template>
  <div class="max-w-xl space-y-4 rounded-xl border border-white/10 bg-graphite-900/70 p-6">
    <div
      v-for="i in indices"
      :key="i"
      class="space-y-2"
    >
      <div class="h-3 w-20 animate-pulse rounded bg-white/10" />
      <div class="h-10 w-full animate-pulse rounded-md bg-white/[0.06]" />
    </div>
  </div>
</template>

