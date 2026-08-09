<script setup lang="ts">
import { onMounted, ref } from "vue";

interface BeforeInstallPromptEvent {
  preventDefault: () => void;
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null);
const showInstallBanner = ref(false);

onMounted(() => {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt.value = e as unknown as BeforeInstallPromptEvent;
    showInstallBanner.value = true;
  });
});

async function installPWA() {
  if (!deferredPrompt.value) return;
  await deferredPrompt.value.prompt();
  const choice = await deferredPrompt.value.userChoice;
  if (choice.outcome === "accepted") {
    showInstallBanner.value = false;
  }
  deferredPrompt.value = null;
}

function dismissBanner() {
  showInstallBanner.value = false;
}
</script>

<template>
  <VSnackbar
    v-model="showInstallBanner"
    location="bottom center"
    timeout="-1"
    color="surface"
    elevation="8"
    class="pwa-snackbar border"
  >
    <div class="d-flex align-center ga-3 py-1">
      <VAvatar color="primary" rounded="lg" size="36">
        <VIcon icon="mdi-cellphone-arrow-down" color="white" />
      </VAvatar>
      <div>
        <div class="text-subtitle-2 font-weight-bold text-high-emphasis">
          ติดตั้งแอป EasyLife
        </div>
        <div class="text-caption text-medium-emphasis">
          ติดตั้งลงในเครื่องเพื่อใช้งานได้อย่างรวดเร็วและรองรับออฟไลน์
        </div>
      </div>
    </div>

    <template #actions>
      <VBtn color="primary" size="small" variant="flat" @click="installPWA">
        ติดตั้ง
      </VBtn>
      <VBtn color="secondary" size="small" variant="text" @click="dismissBanner">
        ไว้ทีหลัง
      </VBtn>
    </template>
  </VSnackbar>
</template>
