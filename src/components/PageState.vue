<script setup lang="ts">
import SkeletonLoader from "@/components/ui/SkeletonLoader.vue";

defineProps<{
  loading?: boolean;
  error?: string;
  skeletonType?: "cards" | "list" | "table" | "chart" | "dashboard";
}>();

defineEmits<{
  (e: "retry"): void;
}>();
</script>

<template>
  <div v-if="loading" class="py-4">
    <SkeletonLoader :type="skeletonType || 'dashboard'" />
  </div>

  <VAlert
    v-else-if="error"
    type="error"
    variant="tonal"
    border="start"
    class="my-4 pa-4 rounded-lg"
  >
    <div class="d-flex flex-wrap align-center justify-space-between ga-3">
      <div>
        <div class="font-weight-bold text-subtitle-1">เกิดข้อผิดพลาดในการโหลดข้อมูล</div>
        <div class="text-body-2">{{ error }}</div>
      </div>
      <VBtn
        color="error"
        variant="outlined"
        size="small"
        prepend-icon="mdi-refresh"
        @click="$emit('retry')"
      >
        ลองใหม่อีกครั้ง
      </VBtn>
    </div>
  </VAlert>

  <slot v-else />
</template>
