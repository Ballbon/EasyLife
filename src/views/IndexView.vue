<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter } from "vue-router";

import { currentUserId } from "@/lib/finance";
import { supabase } from "@/lib/supabase";

const router = useRouter();
onMounted(async () => {
  try {
    const userId = await currentUserId();
    const { data } = await supabase
      .from("profiles")
      .select("onboarding_completed_at")
      .eq("id", userId)
      .maybeSingle();
    await router.replace(
      data?.onboarding_completed_at ? "/dashboard" : "/onboarding",
    );
  } catch {
    await router.replace("/login");
  }
});
</script>

<template>
  <div class="d-flex min-h-screen align-center justify-center">
    <VProgressCircular indeterminate color="primary" />
  </div>
</template>
