<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import PageState from "@/components/PageState.vue";
import {
  deleteTransaction,
  loadFinanceData,
  saveTransaction,
  type FinanceData,
} from "@/lib/finance";
import {
  isoToBangkokLocalInput,
  transactionTypeLabels,
  type TransactionType,
} from "@/lib/transactions";
import type { FieldErrors, TransactionDraft } from "@/types/finance";

const route = useRoute();
const router = useRouter();
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
      if (!item) throw new Error("ไม่พบรายการที่ต้องการแก้ไข");
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
      cause instanceof Error ? cause.message : "โหลดข้อมูลไม่สำเร็จ";
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
    error.value = "บันทึกรายการไม่สำเร็จ กรุณาลองใหม่";
  } finally {
    pending.value = false;
  }
}

async function remove() {
  if (!id.value || !window.confirm("ยืนยันการลบรายการนี้?")) return;
  deleting.value = true;
  try {
    await deleteTransaction(id.value);
    await router.push("/transactions");
  } catch {
    error.value = "ลบรายการไม่สำเร็จ กรุณาลองใหม่";
    deleting.value = false;
  }
}
</script>

<template>
  <PageState :loading="loading" :error="error && !data ? error : ''">
    <VCard v-if="data" class="materio-card mx-auto" max-width="760">
      <VCardItem class="px-5 px-sm-7 py-5">
        <VCardTitle class="font-weight-semibold">{{
          id ? "แก้ไขรายการ" : "เพิ่มรายการ"
        }}</VCardTitle>
        <template v-if="id" #append
          ><VBtn
            color="error"
            variant="tonal"
            prepend-icon="mdi-delete-outline"
            :loading="deleting"
            @click="remove"
            >ลบรายการ</VBtn
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
          >กรุณาสร้างบัญชีที่ใช้งานก่อนเพิ่มรายการ</VAlert
        >
        <VForm v-else @submit.prevent="submit">
          <VLabel class="mb-2">ประเภทรายการ</VLabel>
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
              >{{ transactionTypeLabels[type] }}</VBtn
            >
          </VBtnToggle>
          <VTextField
            v-model="draft.amount"
            label="จำนวนเงิน (บาท)"
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
                  draft.transactionType === 'transfer' ? 'บัญชีต้นทาง' : 'บัญชี'
                "
                :items="accounts.map((a) => ({ title: a.name, value: a.id }))"
                :error-messages="errors.accountId"
            /></VCol>
            <VCol cols="12" sm="6"
              ><VSelect
                v-if="draft.transactionType === 'transfer'"
                v-model="draft.destinationAccountId"
                label="บัญชีปลายทาง"
                :items="accounts.map((a) => ({ title: a.name, value: a.id }))"
                :error-messages="errors.destinationAccountId" /><VSelect
                v-else
                v-model="draft.categoryId"
                label="หมวดหมู่"
                :items="categories.map((c) => ({ title: c.name, value: c.id }))"
                :error-messages="errors.categoryId"
            /></VCol>
          </VRow>
          <VTextField
            v-model="draft.occurredAt"
            label="วันที่และเวลา (เวลาไทย)"
            type="datetime-local"
            :error-messages="errors.occurredAt"
            class="mb-2"
          />
          <VTextarea
            v-model="draft.note"
            label="โน้ต"
            placeholder="เพิ่มรายละเอียด..."
            rows="3"
            maxlength="500"
            counter
            :error-messages="errors.note"
          />
          <div class="d-flex ga-3 mt-3">
            <VBtn
              to="/transactions"
              variant="outlined"
              color="secondary"
              size="large"
              class="flex-grow-1"
              >ยกเลิก</VBtn
            ><VBtn
              type="submit"
              color="primary"
              size="large"
              class="flex-grow-1"
              :loading="pending"
              >บันทึกรายการ</VBtn
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
