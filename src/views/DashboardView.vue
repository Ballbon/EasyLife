<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import PageState from "@/components/PageState.vue";
import { loadFinanceData, type FinanceData } from "@/lib/finance";
import { calculateAccountBalance, formatSatang } from "@/lib/money";
import {
  formatBangkokDateTime,
  transactionTypeLabels,
  type TransactionType,
} from "@/lib/transactions";

const loading = ref(true);
const error = ref("");
const data = ref<FinanceData>();

onMounted(async () => {
  try {
    data.value = await loadFinanceData();
  } catch {
    error.value = "โหลดข้อมูลการเงินไม่สำเร็จ กรุณาลองใหม่";
  } finally {
    loading.value = false;
  }
});

const monthPrefix = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Bangkok",
  year: "numeric",
  month: "2-digit",
}).format(new Date());
const monthly = computed(
  () =>
    data.value?.transactions.filter(
      (item) =>
        new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Bangkok",
          year: "numeric",
          month: "2-digit",
        }).format(new Date(item.occurred_at)) === monthPrefix,
    ) ?? [],
);
const income = computed(() =>
  monthly.value
    .filter((item) => item.transaction_type === "income")
    .reduce((sum, item) => sum + Number(item.amount_satang), 0),
);
const expense = computed(() =>
  monthly.value
    .filter((item) => item.transaction_type === "expense")
    .reduce((sum, item) => sum + Number(item.amount_satang), 0),
);
const totalBalance = computed(
  () =>
    data.value?.accounts.reduce(
      (sum, account) =>
        sum +
        calculateAccountBalance(
          Number(account.initial_balance_satang),
          account.id,
          data.value?.transactions ?? [],
        ),
      0,
    ) ?? 0,
);
const accountNames = computed(
  () => new Map(data.value?.accounts.map((item) => [item.id, item.name])),
);
const categoryNames = computed(
  () => new Map(data.value?.categories.map((item) => [item.id, item.name])),
);
const summary = computed(() => [
  {
    label: "ยอดคงเหลือรวม",
    value: formatSatang(totalBalance.value),
    icon: "mdi-wallet-outline",
    color: "primary",
  },
  {
    label: "รายรับเดือนนี้",
    value: formatSatang(income.value),
    icon: "mdi-arrow-down-left",
    color: "success",
  },
  {
    label: "รายจ่ายเดือนนี้",
    value: formatSatang(expense.value),
    icon: "mdi-arrow-up-right",
    color: "error",
  },
  {
    label: "รายการเดือนนี้",
    value: `${monthly.value.length} รายการ`,
    icon: "mdi-format-list-checks",
    color: "info",
  },
]);

function transactionTitle(
  item: NonNullable<FinanceData>["transactions"][number],
) {
  const type = item.transaction_type as TransactionType;
  return type === "transfer"
    ? `${accountNames.value.get(item.account_id) ?? "บัญชี"} → ${accountNames.value.get(item.destination_account_id ?? "") ?? "บัญชี"}`
    : (categoryNames.value.get(item.category_id ?? "") ??
        transactionTypeLabels[type]);
}
function typeIcon(type: string) {
  return type === "expense"
    ? "mdi-arrow-up-right"
    : type === "income"
      ? "mdi-arrow-down-left"
      : "mdi-swap-horizontal";
}
</script>

<template>
  <PageState :loading="loading" :error="error">
    <div v-if="data">
      <div class="mb-7">
        <p class="text-body-2 text-medium-emphasis">สวัสดี 👋</p>
        <h1 class="page-title">
          {{ data.profile.display_name ?? "ผู้ใช้ EasyLife" }}
        </h1>
        <p class="mt-1 text-body-2 text-medium-emphasis">
          นี่คือภาพรวมการเงินของคุณในเดือนนี้
        </p>
      </div>

      <VRow class="mb-2">
        <VCol v-for="item in summary" :key="item.label" cols="12" sm="6" lg="3">
          <VCard class="materio-card pa-5 h-100">
            <div class="d-flex justify-space-between align-start">
              <div>
                <p class="text-body-2 text-medium-emphasis">{{ item.label }}</p>
                <p class="text-h5 font-weight-semibold mt-2">
                  {{ item.value }}
                </p>
              </div>
              <VAvatar :color="item.color" variant="tonal" rounded="lg"
                ><VIcon :icon="item.icon"
              /></VAvatar>
            </div>
          </VCard>
        </VCol>
      </VRow>

      <VRow>
        <VCol cols="12" lg="8">
          <VCard class="materio-card h-100">
            <VCardItem
              ><VCardTitle class="font-weight-semibold">รายการล่าสุด</VCardTitle
              ><template #append
                ><VBtn to="/transactions" variant="text" color="primary"
                  >ดูทั้งหมด</VBtn
                ></template
              ></VCardItem
            >
            <VDivider />
            <VList v-if="data.transactions.length" lines="two" class="py-2">
              <VListItem
                v-for="item in data.transactions.slice(0, 6)"
                :key="item.id"
                :to="`/transactions/${item.id}/edit`"
              >
                <template #prepend
                  ><VAvatar
                    :color="
                      item.transaction_type === 'expense'
                        ? 'error'
                        : item.transaction_type === 'income'
                          ? 'success'
                          : 'info'
                    "
                    variant="tonal"
                    ><VIcon :icon="typeIcon(item.transaction_type)" /></VAvatar
                ></template>
                <VListItemTitle class="font-weight-medium">{{
                  transactionTitle(item)
                }}</VListItemTitle>
                <VListItemSubtitle>{{
                  formatBangkokDateTime(item.occurred_at)
                }}</VListItemSubtitle>
                <template #append
                  ><span
                    class="font-weight-semibold"
                    :class="{
                      'amount-expense': item.transaction_type === 'expense',
                      'amount-income': item.transaction_type === 'income',
                    }"
                    >{{
                      item.transaction_type === "expense"
                        ? "−"
                        : item.transaction_type === "income"
                          ? "+"
                          : ""
                    }}{{ formatSatang(Number(item.amount_satang)) }}</span
                  ></template
                >
              </VListItem>
            </VList>
            <div v-else class="pa-10 text-center text-medium-emphasis">
              <VIcon icon="mdi-receipt-text-outline" size="44" class="mb-3" />
              <p>ยังไม่มีรายการ</p>
              <VBtn
                to="/transactions/new"
                variant="text"
                color="primary"
                class="mt-2"
                >เพิ่มรายการแรก</VBtn
              >
            </div>
          </VCard>
        </VCol>

        <VCol cols="12" lg="4">
          <VCard class="materio-card h-100">
            <VCardItem
              ><VCardTitle class="font-weight-semibold"
                >บัญชีของฉัน</VCardTitle
              ></VCardItem
            >
            <VDivider />
            <VList class="py-3">
              <VListItem
                v-for="account in data.accounts"
                :key="account.id"
                prepend-icon="mdi-wallet-outline"
                :title="account.name"
              >
                <template #append
                  ><span class="font-weight-medium">{{
                    formatSatang(
                      calculateAccountBalance(
                        Number(account.initial_balance_satang),
                        account.id,
                        data.transactions,
                      ),
                    )
                  }}</span></template
                >
              </VListItem>
            </VList>
            <VCardActions class="pa-4"
              ><VBtn
                to="/settings/accounts"
                block
                variant="outlined"
                color="primary"
                >จัดการบัญชี</VBtn
              ></VCardActions
            >
          </VCard>
        </VCol>
      </VRow>
    </div>
  </PageState>
</template>
