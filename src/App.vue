<script setup lang="ts">
import { onUnmounted } from "vue";
import { RouterView, useRouter } from "vue-router";

import { authStateDestination } from "@/lib/auth-state";
import { supabase } from "@/lib/supabase";

const router = useRouter();
let activeUserId: string | null | undefined;

const { data: authListener } = supabase.auth.onAuthStateChange(
  (_event, session) => {
    const nextUserId = session?.user.id ?? null;
    const destination = authStateDestination(activeUserId, nextUserId);
    activeUserId = nextUserId;

    if (destination) void router.replace(destination);
  },
);

onUnmounted(() => authListener.subscription.unsubscribe());
</script>

<template>
  <VApp>
    <RouterView />
  </VApp>
</template>
