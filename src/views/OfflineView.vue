<script setup lang="ts">
import { useRouter } from "vue-router";
import EmptyState from "@/components/ui/EmptyState.vue";

const router = useRouter();

function retryConnection() {
  if (window.navigator.onLine) {
    router.replace("/dashboard");
  } else {
    window.location.reload();
  }
}
</script>

<template>
  <VContainer class="fill-height d-flex align-center justify-center py-12">
    <VCard class="materio-card pa-6 text-center" max-width="500">
      <EmptyState
        icon="mdi-wifi-off"
        title="ไม่มีการเชื่อมต่ออินเทอร์เน็ต"
        description="ไม่พบสัญญาณอินเทอร์เน็ต แอปพลิเคชันยังคงทำงานในโหมดออฟไลน์ด้วยข้อมูลที่แคชไว้ในเครื่อง"
        action-text="ลองเชื่อมต่ออีกครั้ง"
        action-icon="mdi-refresh"
        @action="retryConnection"
      />
    </VCard>
  </VContainer>
</template>
