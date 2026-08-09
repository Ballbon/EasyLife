<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { z } from "zod";

import { useAppNavigation } from "@/lib/navigation";
import { supabase } from "@/lib/supabase";
import type { FieldErrors } from "@/types/finance";

type Mode = "login" | "register" | "forgot" | "reset";
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { goBack } = useAppNavigation();
const mode = computed(() => route.meta.mode as Mode);
const pending = ref(false);
const message = ref("");
const success = ref(false);
const showPassword = ref(false);
const errors = ref<FieldErrors>({});
const form = reactive({
  displayName: "",
  email: "",
  password: "",
  confirmPassword: "",
});

const copy = computed(
  () =>
    ({
      login: {
        title: t("auth.login.title"),
        description: t("auth.login.description"),
        action: t("auth.login.action"),
      },
      register: {
        title: t("auth.register.title"),
        description: t("auth.register.description"),
        action: t("auth.register.action"),
      },
      forgot: {
        title: t("auth.forgot.title"),
        description: t("auth.forgot.description"),
        action: t("auth.forgot.action"),
      },
      reset: {
        title: t("auth.reset.title"),
        description: t("auth.reset.description"),
        action: t("auth.reset.action"),
      },
    })[mode.value],
);

watch(mode, () => {
  message.value = "";
  errors.value = {};
});

function validate() {
  const email = z.string().trim().email(t("auth.validation.invalidEmail"));
  const password = z
    .string()
    .min(8, t("auth.validation.passwordMin"))
    .max(72, t("auth.validation.passwordMax"));
  const schemas = {
    login: z.object({
      email,
      password: z.string().min(1, t("auth.validation.passwordRequired")),
    }),
    register: z
      .object({
        displayName: z
          .string()
          .trim()
          .min(2, t("onboarding.validation.nameMin"))
          .max(80),
        email,
        password,
        confirmPassword: z.string(),
      })
      .refine((value) => value.password === value.confirmPassword, {
        path: ["confirmPassword"],
        message: t("auth.validation.passwordMismatch"),
      }),
    forgot: z.object({ email }),
    reset: z
      .object({ password, confirmPassword: z.string() })
      .refine((value) => value.password === value.confirmPassword, {
        path: ["confirmPassword"],
        message: t("auth.validation.passwordMismatch"),
      }),
  };
  const result = schemas[mode.value].safeParse(form);
  errors.value = {};
  if (result.success) return true;
  for (const issue of result.error.issues)
    errors.value[String(issue.path[0])] = issue.message;
  return false;
}

async function submit() {
  message.value = "";
  success.value = false;
  if (!validate()) return;
  pending.value = true;
  try {
    if (mode.value === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password,
      });
      if (error) throw new Error(t("auth.messages.invalidCredentials"));
      await router.replace(
        typeof route.query.redirect === "string" ? route.query.redirect : "/",
      );
    } else if (mode.value === "register") {
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: { display_name: form.displayName.trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
        },
      });
      if (error)
        throw new Error(
          error.code === "user_already_exists"
            ? t("auth.messages.emailExists")
            : t("auth.messages.registerError"),
        );
      if (data.session) await router.replace("/onboarding");
      else {
        success.value = true;
        message.value = t("auth.messages.registerSuccessCheckEmail");
      }
    } else if (mode.value === "forgot") {
      await supabase.auth.resetPasswordForEmail(form.email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });
      success.value = true;
      message.value = t("auth.messages.resetSentIfFound");
    } else {
      const { error } = await supabase.auth.updateUser({
        password: form.password,
      });
      if (error) throw new Error(t("auth.messages.resetFailed"));
      await supabase.auth.signOut();
      await router.replace({ path: "/login", query: { reset: "success" } });
    }
  } catch (error) {
    message.value =
      error instanceof Error ? error.message : t("auth.messages.genericError");
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <main
    class="auth-gradient auth-page d-flex align-center justify-center pa-4 pa-md-8"
  >
    <div class="auth-grid w-100">
      <section
        class="auth-hero d-none d-md-flex flex-column justify-center pa-10"
      >
        <div class="d-flex align-center ga-3 mb-10">
          <VAvatar color="primary" rounded="lg" size="44">
            <VIcon icon="mdi-wallet" color="white" size="24" />
          </VAvatar>
          <span class="text-h5 font-weight-bold text-high-emphasis tracking-tight">EasyLife</span>
        </div>
        <h1 class="text-h3 font-weight-bold mb-4 line-height-tight" v-html="$t('auth.heroTitle')">
        </h1>
        <p class="text-subtitle-1 text-medium-emphasis">
          {{ $t('auth.heroSubtitle') }}
        </p>
      </section>

      <VCard class="materio-card pa-8 pa-sm-10 rounded-xl" max-width="460" width="100%">
        <div class="d-flex d-md-none align-center ga-3 mb-6">
          <VAvatar color="primary" rounded="lg" size="38">
            <VIcon icon="mdi-wallet" color="white" size="20" />
          </VAvatar>
          <span class="text-h6 font-weight-bold tracking-tight">EasyLife</span>
        </div>
        <div v-if="mode !== 'login'" class="mb-4">
          <VBtn
            prepend-icon="mdi-arrow-left"
            variant="text"
            size="small"
            color="secondary"
            class="px-0 text-none rounded-lg"
            @click="goBack('/login')"
          >
            {{ $t('auth.backToLogin') }}
          </VBtn>
        </div>
        <h2 class="text-h5 font-weight-bold">{{ copy.title }}</h2>
        <p class="mt-1 mb-6 text-body-2 text-medium-emphasis">{{ copy.description }}</p>
        <VAlert
          v-if="route.query.reset === 'success' && mode === 'login'"
          type="success"
          variant="tonal"
          class="mb-5 rounded-lg"
          >{{ $t('auth.messages.resetSuccessLogin') }}</VAlert
        >
        <VAlert
          v-if="message"
          :type="success ? 'success' : 'error'"
          variant="tonal"
          class="mb-5 rounded-lg"
          >{{ message }}</VAlert
        >
        <VForm @submit.prevent="submit">
          <VTextField
            v-if="mode === 'register'"
            v-model="form.displayName"
            :label="$t('onboarding.displayNameLabel')"
            autocomplete="name"
            :error-messages="errors.displayName"
            class="mb-3"
            rounded="lg"
          />
          <VTextField
            v-if="mode !== 'reset'"
            v-model="form.email"
            :label="$t('auth.labels.email')"
            type="email"
            autocomplete="email"
            prepend-inner-icon="mdi-email-outline"
            :error-messages="errors.email"
            class="mb-3"
            rounded="lg"
          />
          <VTextField
            v-if="mode === 'login' || mode === 'register' || mode === 'reset'"
            v-model="form.password"
            :label="mode === 'reset' ? $t('auth.labels.newPassword') : $t('auth.labels.password')"
            :type="showPassword ? 'text' : 'password'"
            prepend-inner-icon="mdi-lock-outline"
            :append-inner-icon="
              showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'
            "
            :error-messages="errors.password"
            class="mb-3"
            rounded="lg"
            @click:append-inner="showPassword = !showPassword"
          />
          <VTextField
            v-if="mode === 'register' || mode === 'reset'"
            v-model="form.confirmPassword"
            :label="$t('auth.labels.confirmPassword')"
            :type="showPassword ? 'text' : 'password'"
            prepend-inner-icon="mdi-lock-check-outline"
            :error-messages="errors.confirmPassword"
            class="mb-3"
            rounded="lg"
          />
          <div v-if="mode === 'login'" class="mb-5 text-right">
            <RouterLink to="/forgot-password" class="text-primary text-caption font-weight-medium"
              >{{ $t('auth.forgotPasswordLink') }}</RouterLink
            >
          </div>
          <VBtn
            type="submit"
            color="primary"
            block
            size="large"
            class="text-none font-weight-medium rounded-lg"
            :loading="pending"
            >{{ copy.action }}</VBtn
          >
        </VForm>
        <p
          v-if="mode === 'login'"
          class="mt-6 text-center text-body-2 text-medium-emphasis mb-0"
        >
          {{ $t('auth.noAccount') }}
          <RouterLink to="/register" class="text-primary font-weight-semibold ml-1"
            >{{ $t('auth.registerLink') }}</RouterLink
          >
        </p>
        <p
          v-else-if="mode === 'register'"
          class="mt-6 text-center text-body-2 text-medium-emphasis mb-0"
        >
          {{ $t('auth.hasAccount') }}
          <RouterLink to="/login" class="text-primary font-weight-semibold ml-1"
            >{{ $t('auth.loginLink') }}</RouterLink
          >
        </p>
        <p v-else-if="mode === 'forgot'" class="mt-6 text-center mb-0">
          <RouterLink to="/login" class="text-primary text-body-2 font-weight-medium"
            >{{ $t('auth.backToLogin') }}</RouterLink
          >
        </p>
      </VCard>
    </div>
  </main>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
}
.auth-grid {
  display: grid;
  max-width: 1100px;
  grid-template-columns: minmax(0, 1fr) 460px;
  gap: 64px;
  align-items: center;
}
.auth-hero {
  min-height: 520px;
}
.line-height-tight {
  line-height: 1.2;
}
@media (max-width: 959px) {
  .auth-grid {
    display: flex;
    justify-content: center;
  }
}
</style>
