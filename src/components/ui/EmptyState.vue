<script setup lang="ts">
defineProps<{
  icon?: string;
  title: string;
  description?: string;
  actionText?: string;
  actionIcon?: string;
  to?: string;
}>();

defineEmits<{
  (e: "action"): void;
}>();
</script>

<template>
  <div class="empty-state-wrapper pa-8 pa-md-12 text-center">
    <div class="empty-state-icon-container mb-4 mx-auto">
      <VAvatar color="primary" variant="tonal" size="72" class="empty-avatar">
        <VIcon :icon="icon || 'mdi-text-box-search-outline'" size="36" />
      </VAvatar>
    </div>
    <h3 class="text-h6 font-weight-bold mb-1 text-high-emphasis">{{ title }}</h3>
    <p v-if="description" class="text-body-2 text-medium-emphasis mb-6 mx-auto" style="max-width: 420px;">
      {{ description }}
    </p>
    <VBtn
      v-if="actionText"
      color="primary"
      variant="flat"
      :to="to"
      :prepend-icon="actionIcon"
      size="large"
      class="text-none font-weight-medium px-6"
      @click="$emit('action')"
    >
      {{ actionText }}
    </VBtn>
  </div>
</template>

<style scoped>
.empty-state-wrapper {
  background: transparent;
}
.empty-avatar {
  background-color: rgba(145, 85, 253, 0.08) !important;
}
</style>
