<script setup lang="ts">
useHead({
  titleTemplate: (title) => (title ? `${title} · Control Room` : 'ProClubs · Control Room'),
})
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
