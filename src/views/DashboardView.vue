<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import CategoryBreakdown from "@/components/CategoryBreakdown.vue";
import DailyCashflowChart from "@/components/DailyCashflowChart.vue";
import PageState from "@/components/PageState.vue";
import { loadFinanceData, type FinanceData } from "@/lib/finance";
import { calculateAccountBalance, formatSatang } from "@/lib/money";
import {
  buildMonthlyReport,
  currentBangkokMonth,
  formatReportMonth,
  todayTotals,
} from "@/lib/reports";
import {
  formatBangkokDateTime,
  transactionTypeLabels,
  type TransactionType,
} from "@/lib/transactions";
import type { Transaction } from "@/types/finance";

const loading = ref(true);
const error = ref("");
const data = ref<FinanceData>();
const month = currentBangkokMonth();

onMounted(async () => {
  try {
    data.value = await loadFinanceData();
  } catch {
    error.value = "โหลดภาพรวมการเงินไม่สำเร็จ กรุณาลองใหม่";
  } finally {
    loading.value = false;
  }
});

const report = computed(() =>
  buildMonthlyReport(
    month,
    data.value?.transactions ?? [],
    data.value?.categories ?? [],
  ),
);
const today = computed(() => todayTotals(data.value?.transactions ?? []));
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
const dateLabel = new Intl.DateTimeFormat("th-TH", {
  timeZone: "Asia/Bangkok",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
}).format(new Date());

function transactionTitle(item: Transaction) {
  const type = item.transaction_type as TransactionType;
  return type === "transfer"
    ? `${accountNames.value.get(item.account_id) ?? "บัญชี"} → ${accountNames.value.get(item.destination_account_id ?? "") ?? "บัญชี"}`
    : (categoryNames.value.get(item.category_id ?? "") ??
        transactionTypeLabels[type]);
}

function typeIcon(type: string) {
  if (type === "expense") return "mdi-arrow-up-right";
  if (type === "income") return "mdi-arrow-down-left";
  return "mdi-swap-horizontal";
}
</script>

<template>
  <PageState :loading="loading" :error="error">
    <div v-if="data" class="dashboard-page">
      <header
        class="d-flex flex-wrap align-end justify-space-between ga-4 mb-6"
      >
        <div>
          <p class="text-body-2 text-medium-emphasis">{{ dateLabel }}</p>
          <h1 class="page-title mt-1">
            สวัสดี {{ data.profile.display_name ?? "ผู้ใช้ EasyLife" }}
          </h1>
          <p class="mt-1 text-body-2 text-medium-emphasis">
            ภาพรวมที่ควรรู้ก่อนเริ่มใช้เงินวันนี้
          </p>
        </div>
        <VBtn
          to="/reports"
          variant="outlined"
          color="primary"
          prepend-icon="mdi-chart-box-outline"
        >
          ดูรายงานย้อนหลัง
        </VBtn>
      </header>

      <VRow class="mb-2">
        <VCol cols="12" lg="7">
          <VCard class="balance-card h-100 pa-6 pa-md-7">
            <div class="balance-orbit" aria-hidden="true"></div>
            <div class="position-relative">
              <div class="d-flex align-center ga-2 text-body-2 balance-label">
                <VIcon icon="mdi-wallet-outline" size="18" />
                เงินคงเหลือทุกบัญชี
              </div>
              <p class="balance-value mt-3">{{ formatSatang(totalBalance) }}</p>
              <p class="text-body-2 mt-2 balance-caption">
                กระแสเงินสด {{ formatReportMonth(month) }}
                <strong
                  :class="report.net >= 0 ? 'amount-income' : 'amount-expense'"
                >
                  {{ report.net >= 0 ? "+" : "" }}{{ formatSatang(report.net) }}
                </strong>
              </p>
            </div>
          </VCard>
        </VCol>
        <VCol cols="12" lg="5">
          <VCard class="materio-card h-100 pa-5 pa-md-6">
            <div class="d-flex align-center justify-space-between mb-5">
              <div>
                <p class="text-overline text-primary">วันนี้</p>
                <h2 class="text-h6 font-weight-semibold">เงินเข้าและออก</h2>
              </div>
              <VAvatar color="primary" variant="tonal" rounded="lg">
                <VIcon icon="mdi-calendar-today-outline" />
              </VAvatar>
            </div>
            <div class="today-grid">
              <div>
                <p class="text-caption text-medium-emphasis">รายรับ</p>
                <p class="text-h6 font-weight-semibold amount-income mt-1">
                  {{ formatSatang(today.income) }}
                </p>
              </div>
              <div>
                <p class="text-caption text-medium-emphasis">รายจ่าย</p>
                <p class="text-h6 font-weight-semibold amount-expense mt-1">
                  {{ formatSatang(today.expense) }}
                </p>
              </div>
            </div>
            <p class="text-caption text-medium-emphasis mt-5">
              {{
                today.transactionCount
                  ? `${today.transactionCount} รายการที่กระทบกระแสเงินสด`
                  : "วันนี้ยังไม่มีรายการรับหรือจ่าย"
              }}
            </p>
          </VCard>
        </VCol>
      </VRow>

      <VRow class="mb-2">
        <VCol cols="12" sm="4">
          <VCard class="metric-card materio-card h-100 pa-5">
            <p class="text-body-2 text-medium-emphasis">รายรับเดือนนี้</p>
            <p class="text-h5 font-weight-semibold mt-2">
              {{ formatSatang(report.income) }}
            </p>
            <VIcon class="metric-icon income" icon="mdi-trending-up" />
          </VCard>
        </VCol>
        <VCol cols="12" sm="4">
          <VCard class="metric-card materio-card h-100 pa-5">
            <p class="text-body-2 text-medium-emphasis">รายจ่ายเดือนนี้</p>
            <p class="text-h5 font-weight-semibold mt-2">
              {{ formatSatang(report.expense) }}
            </p>
            <VIcon class="metric-icon expense" icon="mdi-trending-down" />
          </VCard>
        </VCol>
        <VCol cols="12" sm="4">
          <VCard class="metric-card materio-card h-100 pa-5">
            <p class="text-body-2 text-medium-emphasis">หมวดที่ใช้มากสุด</p>
            <p class="text-h6 font-weight-semibold mt-2 text-truncate">
              {{ report.categories[0]?.name ?? "ยังไม่มีข้อมูล" }}
            </p>
            <p
              v-if="report.categories[0]"
              class="text-caption text-medium-emphasis mt-1"
            >
              {{ formatSatang(report.categories[0].amount) }}
            </p>
            <VIcon class="metric-icon category" icon="mdi-shape-outline" />
          </VCard>
        </VCol>
      </VRow>

      <VRow class="mb-2">
        <VCol cols="12" lg="8">
          <VCard class="materio-card h-100 pa-5 pa-md-6">
            <div
              class="d-flex flex-wrap align-start justify-space-between ga-3 mb-1"
            >
              <div>
                <p class="text-overline text-primary">จังหวะการใช้เงิน</p>
                <h2 class="text-h6 font-weight-semibold">
                  รายรับและรายจ่ายรายวัน
                </h2>
              </div>
              <VBtn
                to="/reports"
                variant="text"
                color="primary"
                append-icon="mdi-arrow-right"
              >
                รายละเอียด
              </VBtn>
            </div>
            <DailyCashflowChart :data="report.daily" />
          </VCard>
        </VCol>
        <VCol cols="12" lg="4">
          <VCard class="materio-card h-100 pa-5 pa-md-6">
            <p class="text-overline text-primary">รายจ่าย</p>
            <h2 class="text-h6 font-weight-semibold mb-5">ใช้ไปกับอะไร</h2>
            <CategoryBreakdown :categories="report.categories.slice(0, 5)" />
          </VCard>
        </VCol>
      </VRow>

      <VRow>
        <VCol cols="12" lg="8">
          <VCard class="materio-card h-100">
            <VCardItem class="px-5 px-md-6 py-4">
              <VCardTitle class="font-weight-semibold">รายการล่าสุด</VCardTitle>
              <template #append>
                <VBtn to="/transactions" variant="text" color="primary"
                  >ดูทั้งหมด</VBtn
                >
              </template>
            </VCardItem>
            <VDivider />
            <VList v-if="data.transactions.length" lines="two" class="py-2">
              <VListItem
                v-for="item in data.transactions.slice(0, 5)"
                :key="item.id"
                :to="`/transactions/${item.id}/edit`"
                class="px-5 px-md-6"
              >
                <template #prepend>
                  <VAvatar
                    :color="
                      item.transaction_type === 'expense'
                        ? 'error'
                        : item.transaction_type === 'income'
                          ? 'success'
                          : 'info'
                    "
                    variant="tonal"
                  >
                    <VIcon :icon="typeIcon(item.transaction_type)" />
                  </VAvatar>
                </template>
                <VListItemTitle class="font-weight-medium">{{
                  transactionTitle(item)
                }}</VListItemTitle>
                <VListItemSubtitle>{{
                  formatBangkokDateTime(item.occurred_at)
                }}</VListItemSubtitle>
                <template #append>
                  <span
                    class="font-weight-semibold transaction-amount"
                    :class="{
                      'amount-expense': item.transaction_type === 'expense',
                      'amount-income': item.transaction_type === 'income',
                    }"
                  >
                    {{
                      item.transaction_type === "expense"
                        ? "−"
                        : item.transaction_type === "income"
                          ? "+"
                          : ""
                    }}{{ formatSatang(Number(item.amount_satang)) }}
                  </span>
                </template>
              </VListItem>
            </VList>
            <div v-else class="pa-10 text-center text-medium-emphasis">
              <VIcon icon="mdi-receipt-text-outline" size="44" class="mb-3" />
              <p>ยังไม่มีรายการ เริ่มบันทึกเพื่อเห็นภาพรวมของคุณ</p>
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
            <VCardItem class="px-5 px-md-6 py-4">
              <VCardTitle class="font-weight-semibold">ยอดตามบัญชี</VCardTitle>
            </VCardItem>
            <VDivider />
            <VList class="py-3">
              <VListItem
                v-for="account in data.accounts"
                :key="account.id"
                prepend-icon="mdi-wallet-outline"
                :title="account.name"
              >
                <template #append>
                  <span class="font-weight-medium">
                    {{
                      formatSatang(
                        calculateAccountBalance(
                          Number(account.initial_balance_satang),
                          account.id,
                          data.transactions,
                        ),
                      )
                    }}
                  </span>
                </template>
              </VListItem>
            </VList>
          </VCard>
        </VCol>
      </VRow>
    </div>
  </PageState>
</template>

<style scoped>
.balance-card {
  position: relative;
  overflow: hidden;
  color: white;
  background: linear-gradient(125deg, #5635a5 0%, #7c4dce 54%, #a36ff0 100%);
  box-shadow: 0 14px 30px rgba(86, 53, 165, 0.25) !important;
}
.balance-orbit {
  position: absolute;
  right: -3rem;
  top: -7rem;
  width: 20rem;
  height: 20rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  box-shadow:
    inset 0 0 0 3rem rgba(255, 255, 255, 0.035),
    inset 0 0 0 6rem rgba(255, 255, 255, 0.025);
}
.balance-label,
.balance-caption {
  color: rgba(255, 255, 255, 0.78);
}
.balance-caption strong {
  color: white;
}
.balance-value {
  font:
    700 clamp(2rem, 6vw, 3.1rem)/1.15 Inter,
    "Noto Sans Thai",
    sans-serif;
  letter-spacing: -0.045em;
}
.today-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.today-grid > div + div {
  padding-left: 1rem;
  border-left: 1px solid rgba(var(--v-border-color), 0.12);
}
.metric-card {
  position: relative;
  overflow: hidden;
}
.metric-icon {
  position: absolute;
  right: 1rem;
  bottom: 0.6rem;
  font-size: 3.8rem;
  opacity: 0.08;
}
.metric-icon.income {
  color: rgb(var(--v-theme-success));
}
.metric-icon.expense {
  color: rgb(var(--v-theme-error));
}
.metric-icon.category {
  color: rgb(var(--v-theme-primary));
}
@media (max-width: 599px) {
  .transaction-amount {
    max-width: 8rem;
    font-size: 0.8rem;
  }
}
</style>
