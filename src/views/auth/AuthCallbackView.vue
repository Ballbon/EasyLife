<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";

import { supabase } from "@/lib/supabase";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const error = ref("");

onMounted(async () => {
  const code =
    typeof route.query.code === "string"
      ? route.query.code
      : new window.URLSearchParams(window.location.search).get("code");
  if (code) {
    const result = await supabase.auth.exchangeCodeForSession(code);
    if (result.error) error.value = t("auth.callback.invalidLink");
  }
  if (error.value) return;
  const next =
    typeof route.query.next === "string" && route.query.next.startsWith("/")
      ? route.query.next
      : "/";
  await router.replace(next);
});
</script>

<template>
  <main
    class="auth-gradient d-flex min-h-screen align-center justify-center pa-6"
  >
    <VCard class="materio-card pa-8 text-center" width="420">
      <template v-if="error">
        <VIcon icon="mdi-alert-circle-outline" color="error" size="48" />
        <p class="mt-4">{{ error }}</p>
        <VBtn to="/login" color="primary" class="mt-6">{{ $t('auth.backToLogin') }}</VBtn>
      </template>
      <template v-else>
        <VProgressCircular indeterminate color="primary" size="48" />
        <p class="mt-4">{{ $t('auth.callback.verifying') }}</p>
      </template>
    </VCard>
  </main>
</template>
