<script setup lang="ts">
defineProps<{ loading?: boolean; error?: string }>();
</script>

<template>
  <div v-if="loading" class="d-flex justify-center py-16">
    <VProgressCircular indeterminate color="primary" size="48" />
  </div>
  <VAlert v-else-if="error" type="error" variant="tonal" border="start">{{
    error
  }}</VAlert>
  <slot v-else />
</template>
