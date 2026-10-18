<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div class="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div>
      <h2 class="text-2xl font-bold tracking-tight text-white md:text-3xl">
        {{ title }}
      </h2>
      <p v-if="description" class="mt-1 max-w-2xl text-sm text-graphite-400">
        {{ description }}
      </p>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>
