<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import {
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
const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", val: boolean): void;
  (e: "saved"): void;
}>();

const loading = ref(true);
const pending = ref(false);
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

const quickPresets = [50, 100, 200, 500, 1000];

const categories = computed(
  () =>
    data.value?.categories.filter(
      (c) => c.transaction_type === draft.transactionType,
    ) ?? [],
);

const accounts = computed(() =>
  data.value?.accounts.filter((a) => a.is_active) ?? [],
);

async function initData() {
  loading.value = true;
  try {
    data.value = await loadFinanceData();
    if (accounts.value.length && !draft.accountId) {
      draft.accountId = accounts.value[0].id;
    }
  } catch {
    error.value = t("components.pageState.error");
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      draft.amount = "";
      draft.note = "";
      draft.occurredAt = isoToBangkokLocalInput(new Date().toISOString());
      errors.value = {};
      error.value = "";
      if (!data.value) {
        initData();
      }
    }
  },
);

onMounted(() => {
  if (props.modelValue) {
    initData();
  }
});

function setAmountPreset(val: number) {
  const current = parseFloat(draft.amount) || 0;
  draft.amount = (current + val).toString();
}

async function submit() {
  if (!data.value) return;
  pending.value = true;
  error.value = "";
  try {
    errors.value = await saveTransaction(
      undefined,
      draft,
      data.value.accounts,
      data.value.categories,
    );
    if (!Object.values(errors.value).some(Boolean)) {
      emit("update:modelValue", false);
      emit("saved");
    }
  } catch {
    error.value = t("components.pageState.error");
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <VDialog
    :model-value="modelValue"
    max-width="560"
    scrollable
    @update:model-value="(val) => emit('update:modelValue', val)"
  >
    <VCard class="rounded-xl pa-2 pa-sm-4">
      <VCardTitle class="d-flex align-center justify-space-between pt-3 px-4">
        <div class="d-flex align-center ga-2">
          <VAvatar color="primary" variant="tonal" size="36">
            <VIcon icon="mdi-flash-outline" />
          </VAvatar>
          <span class="text-h6 font-weight-bold">{{ $t('quickAdd.title') }}</span>
        </div>
        <VBtn
          icon="mdi-close"
          variant="text"
          size="small"
          :aria-label="$t('common.cancel')"
          @click="emit('update:modelValue', false)"
        />
      </VCardTitle>

      <VCardText class="pa-4">
        <div v-if="loading" class="d-flex justify-center py-8">
          <VProgressCircular indeterminate color="primary" />
        </div>

        <VAlert v-else-if="error" type="error" variant="tonal" class="mb-4">
          {{ error }}
        </VAlert>

        <VForm v-else @submit.prevent="submit">
          <!-- Type Toggle -->
          <VBtnToggle
            v-model="draft.transactionType"
            color="primary"
            mandatory
            divided
            density="compact"
            class="d-flex mb-4 w-100"
          >
            <VBtn
              v-for="type in (['expense', 'income', 'transfer'] as TransactionType[])"
              :key="type"
              :value="type"
              class="flex-grow-1"
            >
              {{ $t(`transactions.${type}`) }}
            </VBtn>
          </VBtnToggle>

          <!-- Amount Input & Presets -->
          <VTextField
            v-model="draft.amount"
            :label="$t('quickAdd.amount')"
            inputmode="decimal"
            prefix="฿"
            autofocus
            class="amount-field mb-2"
            :error-messages="errors.amount"
          />

          <div class="d-flex flex-wrap ga-2 mb-4">
            <VChip
              v-for="val in quickPresets"
              :key="val"
              color="primary"
              variant="tonal"
              size="small"
              class="font-weight-medium"
              @click="setAmountPreset(val)"
            >
              +฿{{ val }}
            </VChip>
          </div>

          <!-- Quick Category Chips -->
          <template v-if="draft.transactionType !== 'transfer'">
            <div class="text-caption font-weight-bold text-medium-emphasis mb-2">
              {{ $t('quickAdd.popularCategories') }}
            </div>
            <div class="d-flex flex-wrap ga-2 mb-4" style="max-height: 120px; overflow-y: auto;">
              <VChip
                v-for="cat in categories"
                :key="cat.id"
                :color="draft.categoryId === cat.id ? 'primary' : 'default'"
                :variant="draft.categoryId === cat.id ? 'flat' : 'outlined'"
                size="small"
                class="font-weight-medium"
                @click="draft.categoryId = cat.id"
              >
                {{ cat.name }}
              </VChip>
            </div>
          </template>

          <VRow dense>
            <VCol cols="12" sm="6">
              <VSelect
                v-model="draft.accountId"
                :label="draft.transactionType === 'transfer' ? $t('quickAdd.sourceAccount') : $t('transactions.account')"
                :items="accounts.map((a) => ({ title: a.name, value: a.id }))"
                :error-messages="errors.accountId"
                density="compact"
              />
            </VCol>
            <VCol cols="12" sm="6">
              <VSelect
                v-if="draft.transactionType === 'transfer'"
                v-model="draft.destinationAccountId"
                :label="$t('quickAdd.destinationAccount')"
                :items="accounts.map((a) => ({ title: a.name, value: a.id }))"
                :error-messages="errors.destinationAccountId"
                density="compact"
              />
              <VSelect
                v-else
                v-model="draft.categoryId"
                :label="$t('quickAdd.selectCategory')"
                :items="categories.map((c) => ({ title: c.name, value: c.id }))"
                :error-messages="errors.categoryId"
                density="compact"
              />
            </VCol>
          </VRow>

          <VTextField
            v-model="draft.note"
            :label="$t('quickAdd.note')"
            density="compact"
            :placeholder="$t('quickAdd.notePlaceholder')"
            class="mt-2"
          />

          <div class="d-flex ga-2 mt-4">
            <VBtn
              variant="text"
              color="secondary"
              class="flex-grow-1"
              @click="emit('update:modelValue', false)"
            >
              {{ $t('common.cancel') }}
            </VBtn>
            <VBtn
              type="submit"
              color="primary"
              class="flex-grow-1"
              :loading="pending"
            >
              {{ $t('quickAdd.submit') }}
            </VBtn>
          </div>
        </VForm>
      </VCardText>
    </VCard>
  </VDialog>
</template>

<style scoped>
.amount-field :deep(input) {
  font-size: 1.4rem;
  font-weight: 600;
}
</style>
