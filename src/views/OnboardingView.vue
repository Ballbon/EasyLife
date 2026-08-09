<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { z } from "zod";

import { currentUserId } from "@/lib/finance";
import { useAppNavigation } from "@/lib/navigation";
import { parseMoneyToSatang } from "@/lib/money";
import { supabase } from "@/lib/supabase";
import type { FieldErrors } from "@/types/finance";

const { t } = useI18n();
const router = useRouter();
const { goBack } = useAppNavigation();
const pending = ref(false);
const loading = ref(true);
const message = ref("");
const errors = ref<FieldErrors>({});
const form = reactive({
  displayName: "",
  accountName: "เงินสด",
  accountType: "cash",
  initialBalance: "0.00",
});
const accountTypes = computed(() => [
  { title: t("settings.accounts.types.cash"), value: "cash" },
  { title: t("settings.accounts.types.bank"), value: "bank" },
  { title: t("settings.accounts.types.card"), value: "card" },
  { title: t("settings.accounts.types.ewallet"), value: "ewallet" },
]);

onMounted(async () => {
  try {
    const userId = await currentUserId();
    const { data } = await supabase
      .from("profiles")
      .select("display_name, onboarding_completed_at")
      .eq("id", userId)
      .single();
    if (data?.onboarding_completed_at) return router.replace("/dashboard");
    form.displayName = data?.display_name ?? "";
  } finally {
    loading.value = false;
  }
});

async function submit() {
  const schema = z.object({
    displayName: z
      .string()
      .trim()
      .min(2, t("onboarding.validation.nameMin"))
      .max(80),
    accountName: z.string().trim().min(1, t("settings.messages.enterAccountName")).max(80),
    accountType: z.enum(["cash", "bank", "card", "ewallet"]),
    initialBalance: z.string(),
  });
  const result = schema.safeParse(form);
  errors.value = {};
  if (!result.success)
    for (const issue of result.error.issues)
      errors.value[String(issue.path[0])] = issue.message;
  const satang = parseMoneyToSatang(form.initialBalance);
  if (satang === null)
    errors.value.initialBalance = t("onboarding.validation.invalidBalance");
  if (Object.values(errors.value).some(Boolean) || satang === null) return;
  pending.value = true;
  message.value = "";
  const { error } = await supabase.rpc("complete_onboarding", {
    display_name_input: form.displayName.trim(),
    account_name_input: form.accountName.trim(),
    account_type_input: form.accountType,
    initial_balance_satang_input: satang,
  });
  pending.value = false;
  if (error) message.value = t("onboarding.messages.setupError");
  else await router.replace("/dashboard");
}
</script>

<template>
  <main class="auth-gradient onboarding-page d-flex align-center pa-4 pa-md-8">
    <VContainer>
      <div v-if="loading" class="text-center">
        <VProgressCircular indeterminate color="primary" />
      </div>
      <VRow v-else align="center" justify="center">
        <VCol cols="12" md="5" class="d-none d-md-block pr-10">
          <div class="d-flex align-center ga-3 mb-8">
            <VAvatar color="primary" rounded="lg"
              ><VIcon icon="mdi-sprout" /></VAvatar
            ><span class="text-h5 font-weight-bold">EasyLife</span>
          </div>
          <h1 class="text-h3 font-weight-bold mb-5" v-html="$t('onboarding.heroTitle')">
          </h1>
          <p class="text-h6 text-medium-emphasis mb-8">
            {{ $t('onboarding.heroSubtitle') }}
          </p>
          <VList bg-color="transparent">
            <VListItem
              prepend-icon="mdi-clock-fast"
              :title="$t('onboarding.features.once')"
            />
            <VListItem
              prepend-icon="mdi-chart-donut"
              :title="$t('onboarding.features.notIncome')"
            />
            <VListItem
              prepend-icon="mdi-shield-check-outline"
              :title="$t('onboarding.features.rls')"
            />
          </VList>
        </VCol>
        <VCol cols="12" md="6" lg="5">
          <VCard class="materio-card pa-6 pa-sm-9">
            <div class="mb-3">
              <VBtn
                prepend-icon="mdi-arrow-left"
                variant="text"
                size="small"
                color="secondary"
                class="px-0"
                @click="goBack('/login')"
              >
                {{ $t('transactionForm.back') }}
              </VBtn>
            </div>
            <h2 class="text-h4 font-weight-semibold">{{ $t('onboarding.title') }}</h2>
            <p class="mt-2 mb-7 text-medium-emphasis">
              {{ $t('onboarding.subtitle') }}
            </p>
            <VAlert v-if="message" type="error" variant="tonal" class="mb-5">{{
              message
            }}</VAlert>
            <VForm @submit.prevent="submit">
              <VTextField
                v-model="form.displayName"
                :label="$t('onboarding.displayNameLabel')"
                :error-messages="errors.displayName"
                class="mb-2"
              />
              <VTextField
                v-model="form.accountName"
                :label="$t('onboarding.accountNameLabel')"
                :error-messages="errors.accountName"
                class="mb-2"
              />
              <VSelect
                v-model="form.accountType"
                :label="$t('settings.accounts.typeLabel')"
                :items="accountTypes"
                :error-messages="errors.accountType"
                class="mb-2"
              />
              <VTextField
                v-model="form.initialBalance"
                :label="$t('onboarding.initialBalanceLabel')"
                inputmode="decimal"
                prefix="฿"
                :error-messages="errors.initialBalance"
                :hint="$t('onboarding.initialBalanceHint')"
                persistent-hint
                class="mb-6"
              />
              <VBtn
                type="submit"
                block
                size="large"
                color="primary"
                :loading="pending"
                >{{ $t('onboarding.submit') }}</VBtn
              >
            </VForm>
          </VCard>
        </VCol>
      </VRow>
    </VContainer>
  </main>
</template>

<style scoped>
.onboarding-page {
  min-height: 100vh;
}
</style>
