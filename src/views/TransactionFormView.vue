<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";

import PageState from "@/components/PageState.vue";
import { useAppNavigation } from "@/lib/navigation";
import {
  deleteTransaction,
  loadFinanceData,
  saveTransaction,
  type FinanceData,
} from "@/lib/finance";
import {
  isoToBangkokLocalInput,
  type TransactionType,
} from "@/lib/transactions";
import type { FieldErrors, TransactionDraft } from "@/types/finance";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { goBack } = useAppNavigation();
const id = computed(() =>
  typeof route.params.id === "string" ? route.params.id : undefined,
);
const loading = ref(true);
const pending = ref(false);
const deleting = ref(false);
const error = ref("");
const errors = ref<FieldErrors>({});
const data = ref<FinanceData>();
const draft = reactive<TransactionDraft>({
  transactionType: "expense",
  amount: "",
  accountId: "",
  destinationAccountId: "",
  categoryId: "",
  occurredAt: isoToBangkokLocalInput(new Date().toISOString()),
  note: "",
});
const transactionTypes: TransactionType[] = ["expense", "income", "transfer"];
const categories = computed(
  () =>
    data.value?.categories.filter(
      (category) => category.transaction_type === draft.transactionType,
    ) ?? [],
);
const accounts = computed(() =>
  id.value
    ? (data.value?.accounts ?? [])
    : (data.value?.accounts.filter((account) => account.is_active) ?? []),
);

onMounted(async () => {
  try {
    data.value = await loadFinanceData();
    if (id.value) {
      const item = data.value.transactions.find(
        (transaction) => transaction.id === id.value,
      );
      if (!item) throw new Error(t("transactionForm.messages.notFound"));
      Object.assign(draft, {
        transactionType: item.transaction_type as TransactionType,
        amount: (Number(item.amount_satang) / 100).toFixed(2),
        accountId: item.account_id,
        destinationAccountId: item.destination_account_id ?? "",
        categoryId: item.category_id ?? "",
        occurredAt: isoToBangkokLocalInput(item.occurred_at),
        note: item.note ?? "",
      });
    } else if (accounts.value.length) draft.accountId = accounts.value[0].id;
  } catch (cause) {
    error.value =
      cause instanceof Error ? cause.message : t("transactionForm.messages.loadError");
  } finally {
    loading.value = false;
  }
});

async function submit() {
  if (!data.value) return;
  pending.value = true;
  error.value = "";
  try {
    errors.value = await saveTransaction(
      id.value,
      draft,
      data.value.accounts,
      data.value.categories,
    );
    if (!Object.values(errors.value).some(Boolean))
      await router.push("/transactions");
  } catch {
    error.value = t("transactionForm.messages.saveError");
  } finally {
    pending.value = false;
  }
}

async function remove() {
  if (!id.value || !window.confirm(t("transactionForm.messages.confirmDelete"))) return;
  deleting.value = true;
  try {
    await deleteTransaction(id.value);
    await router.push("/transactions");
  } catch {
    error.value = t("transactionForm.messages.deleteError");
    deleting.value = false;
  }
}
</script>

<template>
  <PageState :loading="loading" :error="error && !data ? error : ''">
    <VCard v-if="data" class="materio-card mx-auto" max-width="760">
      <VCardItem class="px-5 px-sm-7 py-5">
        <template #prepend>
          <VBtn
            icon="mdi-arrow-left"
            variant="text"
            size="small"
            class="mr-2"
            :aria-label="$t('transactionForm.back')"
            :title="$t('transactionForm.back')"
            @click="goBack('/transactions')"
          />
        </template>
        <VCardTitle class="font-weight-semibold">{{
          id ? $t('transactionForm.titleEdit') : $t('transactionForm.titleCreate')
        }}</VCardTitle>
        <template v-if="id" #append
          ><VBtn
            color="error"
            variant="tonal"
            prepend-icon="mdi-delete-outline"
            :loading="deleting"
            @click="remove"
            >{{ $t('transactionForm.deleteTransaction') }}</VBtn
          ></template
        >
      </VCardItem>
      <VDivider />
      <VCardText class="pa-5 pa-sm-7">
        <VAlert v-if="error" type="error" variant="tonal" class="mb-6">{{
          error
        }}</VAlert>
        <VAlert
          v-if="!accounts.length"
          type="warning"
          variant="tonal"
          class="mb-6"
          >{{ $t('transactionForm.createAccountFirst') }}</VAlert
        >
        <VForm v-else @submit.prevent="submit">
          <VLabel class="mb-2">{{ $t('transactionForm.typeLabel') }}</VLabel>
          <VBtnToggle
            v-model="draft.transactionType"
            color="primary"
            mandatory
            divided
            class="d-flex mb-6"
          >
            <VBtn
              v-for="type in transactionTypes"
              :key="type"
              :value="type"
              class="flex-grow-1"
              >{{ $t(`transactions.${type}`) }}</VBtn
            >
          </VBtnToggle>
          <VTextField
            v-model="draft.amount"
            :label="$t('transactionForm.amountLabel')"
            inputmode="decimal"
            prefix="฿"
            class="amount-field mb-2"
            :error-messages="errors.amount"
          />
          <VRow>
            <VCol cols="12" sm="6"
              ><VSelect
                v-model="draft.accountId"
                :label="
                  draft.transactionType === 'transfer' ? $t('quickAdd.sourceAccount') : $t('transactions.account')
                "
                :items="accounts.map((a) => ({ title: a.name, value: a.id }))"
                :error-messages="errors.accountId"
            /></VCol>
            <VCol cols="12" sm="6"
              ><VSelect
                v-if="draft.transactionType === 'transfer'"
                v-model="draft.destinationAccountId"
                :label="$t('quickAdd.destinationAccount')"
                :items="accounts.map((a) => ({ title: a.name, value: a.id }))"
                :error-messages="errors.destinationAccountId" /><VSelect
                v-else
                v-model="draft.categoryId"
                :label="$t('quickAdd.selectCategory')"
                :items="categories.map((c) => ({ title: c.name, value: c.id }))"
                :error-messages="errors.categoryId"
            /></VCol>
          </VRow>
          <VTextField
            v-model="draft.occurredAt"
            :label="$t('transactionForm.dateLabel')"
            type="datetime-local"
            :error-messages="errors.occurredAt"
            class="mb-2"
          />
          <VTextarea
            v-model="draft.note"
            :label="$t('quickAdd.note')"
            :placeholder="$t('quickAdd.notePlaceholder')"
            rows="3"
            maxlength="500"
            counter
            :error-messages="errors.note"
          />
          <div class="d-flex ga-3 mt-3">
            <VBtn
              variant="outlined"
              color="secondary"
              size="large"
              class="flex-grow-1"
              @click="goBack('/transactions')"
              >{{ $t('common.cancel') }}</VBtn
            ><VBtn
              type="submit"
              color="primary"
              size="large"
              class="flex-grow-1"
              :loading="pending"
              >{{ $t('common.save') }}</VBtn
            >
          </div>
        </VForm>
      </VCardText>
    </VCard>
  </PageState>
</template>

<style scoped>
.amount-field :deep(input) {
  font-size: 1.5rem;
  font-weight: 600;
}
</style>
