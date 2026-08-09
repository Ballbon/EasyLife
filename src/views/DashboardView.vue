<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import AllocationOverview from "@/components/AllocationOverview.vue";
import CategoryBreakdown from "@/components/CategoryBreakdown.vue";
import DailyCashflowChart from "@/components/DailyCashflowChart.vue";
import PageState from "@/components/PageState.vue";
import { loadFinanceData, type FinanceData } from "@/lib/finance";
import { calculateAccountBalance, formatSatang } from "@/lib/money";
import { buildAllocationOverview } from "@/lib/plan-calculations";
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

async function loadData() {
  loading.value = true;
  error.value = "";
  try {
    data.value = await loadFinanceData();
  } catch {
    error.value = "โหลดภาพรวมการเงินไม่สำเร็จ กรุณาลองใหม่";
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadData();
});

const report = computed(() =>
  buildMonthlyReport(
    month,
    data.value?.transactions ?? [],
    data.value?.categories ?? [],
  ),
);
const allocationOverview = computed(() =>
  buildAllocationOverview(
    month,
    data.value?.plans ?? [],
    data.value?.allocations ?? [],
    data.value?.budgets ?? [],
    data.value?.categories ?? [],
    data.value?.transactions ?? [],
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
  <PageState :loading="loading" :error="error" skeleton-type="dashboard" @retry="loadData">
    <div v-if="data" class="dashboard-page">
      <!-- HEADER -->
      <header class="d-flex flex-wrap align-center justify-space-between ga-4 mb-6">
        <div>
          <p class="text-caption font-weight-medium text-disabled mb-1">{{ dateLabel }}</p>
          <h1 class="page-title mb-0">
            สวัสดี {{ data.profile.display_name ?? "ผู้ใช้ EasyLife" }}
          </h1>
          <p class="text-body-2 text-medium-emphasis mt-1 mb-0">
            สรุปภาพรวมการเงินและการบริหารจัดการของคุณในวันนี้
          </p>
        </div>
        <VBtn
          to="/reports"
          variant="outlined"
          color="primary"
          prepend-icon="mdi-chart-box-outline"
          class="text-none font-weight-medium border-opacity-75 rounded-lg"
        >
          ดูรายงานย้อนหลัง
        </VBtn>
      </header>

      <!-- PRIMARY BALANCE & TODAY METRICS -->
      <VRow class="mb-4">
        <VCol cols="12" lg="7">
          <VCard class="balance-card h-100 pa-6 pa-md-7 rounded-xl">
            <div class="position-relative z-1">
              <div class="d-flex align-center justify-space-between mb-4">
                <span class="d-flex align-center ga-2 text-body-2 font-weight-medium text-white-70">
                  <VIcon icon="mdi-wallet-outline" size="18" />
                  เงินคงเหลือสุทธิทุกบัญชี
                </span>
                <span class="badge-period px-3 py-1 text-caption font-weight-medium rounded-pill">
                  {{ formatReportMonth(month) }}
                </span>
              </div>
              <div class="balance-value my-2">{{ formatSatang(totalBalance) }}</div>
              <div class="d-flex align-center ga-2 text-body-2 text-white-80 mt-4">
                <span>กระแสเงินสดสุทธิเดือนนี้:</span>
                <span
                  class="font-weight-bold"
                  :class="report.net >= 0 ? 'text-emerald-300' : 'text-rose-300'"
                >
                  {{ report.net >= 0 ? "+" : "" }}{{ formatSatang(report.net) }}
                </span>
              </div>
            </div>
          </VCard>
        </VCol>
        <VCol cols="12" lg="5">
          <VCard class="materio-card h-100 pa-6 rounded-xl">
            <div class="d-flex align-center justify-space-between mb-4">
              <div>
                <p class="text-caption font-weight-bold text-uppercase text-primary tracking-wider mb-1">วันนี้</p>
                <h2 class="text-subtitle-1 font-weight-bold mb-0">เงินเข้าและออก</h2>
              </div>
              <VAvatar color="primary" variant="tonal" rounded="lg" size="40">
                <VIcon icon="mdi-calendar-today-outline" size="20" />
              </VAvatar>
            </div>
            <div class="today-grid py-2">
              <div>
                <p class="text-caption text-medium-emphasis mb-1">รายรับวันนี้</p>
                <p class="text-h6 font-weight-bold amount-income mb-0">
                  {{ formatSatang(today.income) }}
                </p>
              </div>
              <div>
                <p class="text-caption text-medium-emphasis mb-1">รายจ่ายวันนี้</p>
                <p class="text-h6 font-weight-bold amount-expense mb-0">
                  {{ formatSatang(today.expense) }}
                </p>
              </div>
            </div>
            <p class="text-caption text-medium-emphasis mt-4 mb-0">
              {{
                today.transactionCount
                  ? `${today.transactionCount} รายการที่มีผลต่อกระแสเงินสด`
                  : "วันนี้ยังไม่มีรายการรับหรือจ่าย"
              }}
            </p>
          </VCard>
        </VCol>
      </VRow>

      <!-- KPI METRIC CARDS -->
      <VRow class="mb-4">
        <VCol cols="12" sm="4">
          <VCard class="materio-card h-100 pa-5 rounded-xl">
            <div class="d-flex align-center justify-space-between">
              <span class="text-body-2 text-medium-emphasis">รายรับเดือนนี้</span>
              <VAvatar color="success" variant="tonal" size="32" rounded="md">
                <VIcon icon="mdi-trending-up" size="18" color="success" />
              </VAvatar>
            </div>
            <p class="text-h5 font-weight-bold mt-3 mb-0">
              {{ formatSatang(report.income) }}
            </p>
          </VCard>
        </VCol>
        <VCol cols="12" sm="4">
          <VCard class="materio-card h-100 pa-5 rounded-xl">
            <div class="d-flex align-center justify-space-between">
              <span class="text-body-2 text-medium-emphasis">รายจ่ายเดือนนี้</span>
              <VAvatar color="error" variant="tonal" size="32" rounded="md">
                <VIcon icon="mdi-trending-down" size="18" color="error" />
              </VAvatar>
            </div>
            <p class="text-h5 font-weight-bold mt-3 mb-0">
              {{ formatSatang(report.expense) }}
            </p>
          </VCard>
        </VCol>
        <VCol cols="12" sm="4">
          <VCard class="materio-card h-100 pa-5 rounded-xl">
            <div class="d-flex align-center justify-space-between">
              <span class="text-body-2 text-medium-emphasis">หมวดที่ใช้มากสุด</span>
              <VAvatar color="primary" variant="tonal" size="32" rounded="md">
                <VIcon icon="mdi-shape-outline" size="18" color="primary" />
              </VAvatar>
            </div>
            <p class="text-h6 font-weight-bold mt-3 mb-0 text-truncate">
              {{ report.categories[0]?.name ?? "ยังไม่มีข้อมูล" }}
            </p>
            <p v-if="report.categories[0]" class="text-caption text-medium-emphasis mt-1 mb-0">
              {{ formatSatang(report.categories[0].amount) }}
            </p>
          </VCard>
        </VCol>
      </VRow>

      <!-- PRE-SPENDING MONEY ALLOCATION CARD -->
      <AllocationOverview :overview="allocationOverview" :month="month" class="mb-6" />

      <!-- CASHFLOW CHART & SPENDING BREAKDOWN -->
      <VRow class="mb-4">
        <VCol cols="12" lg="8">
          <VCard class="materio-card h-100 pa-6 rounded-xl">
            <div class="d-flex flex-wrap align-start justify-space-between ga-3 mb-4">
              <div>
                <p class="text-caption font-weight-bold text-uppercase text-primary tracking-wider mb-1">จังหวะการใช้เงิน</p>
                <h2 class="text-subtitle-1 font-weight-bold mb-0">
                  รายรับและรายจ่ายรายวัน
                </h2>
              </div>
              <VBtn
                to="/reports"
                variant="text"
                color="primary"
                append-icon="mdi-arrow-right"
                class="text-none font-weight-medium px-2"
              >
                ดูรายละเอียด
              </VBtn>
            </div>
            <DailyCashflowChart :data="report.daily" />
          </VCard>
        </VCol>
        <VCol cols="12" lg="4">
          <VCard class="materio-card h-100 pa-6 rounded-xl">
            <p class="text-caption font-weight-bold text-uppercase text-primary tracking-wider mb-1">สัดส่วนรายจ่าย</p>
            <h2 class="text-subtitle-1 font-weight-bold mb-4">ใช้ไปกับอะไร</h2>
            <CategoryBreakdown :categories="report.categories.slice(0, 5)" />
          </VCard>
        </VCol>
      </VRow>

      <!-- RECENT TRANSACTIONS & ACCOUNT BALANCES -->
      <VRow>
        <VCol cols="12" lg="8">
          <VCard class="materio-card h-100 rounded-xl">
            <VCardItem class="px-6 py-4">
              <VCardTitle class="text-subtitle-1 font-weight-bold">รายการล่าสุด</VCardTitle>
              <template #append>
                <VBtn to="/transactions" variant="text" color="primary" class="text-none font-weight-medium"
                  >ดูทั้งหมด</VBtn
                >
              </template>
            </VCardItem>
            <VDivider class="border-opacity-50" />
            <VList v-if="data.transactions.length" lines="two" class="py-1">
              <VListItem
                v-for="item in data.transactions.slice(0, 5)"
                :key="item.id"
                :to="`/transactions/${item.id}/edit`"
                class="px-6 py-3"
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
                    size="40"
                    rounded="lg"
                    class="mr-3"
                  >
                    <VIcon :icon="typeIcon(item.transaction_type)" size="20" />
                  </VAvatar>
                </template>
                <VListItemTitle class="font-weight-semibold text-body-2">{{
                  transactionTitle(item)
                }}</VListItemTitle>
                <VListItemSubtitle class="text-caption text-medium-emphasis">{{
                  formatBangkokDateTime(item.occurred_at)
                }}</VListItemSubtitle>
                <template #append>
                  <span
                    class="font-weight-bold text-body-2 transaction-amount ml-2"
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
              <VIcon icon="mdi-receipt-text-outline" size="44" class="mb-3 text-disabled" />
              <p class="mb-2">ยังไม่มีรายการ เริ่มบันทึกเพื่อเห็นภาพรวมของคุณ</p>
              <VBtn
                to="/transactions/new"
                variant="flat"
                color="primary"
                class="text-none font-weight-medium rounded-lg px-4"
                >เพิ่มรายการแรก</VBtn
              >
            </div>
          </VCard>
        </VCol>

        <VCol cols="12" lg="4">
          <VCard class="materio-card h-100 rounded-xl">
            <VCardItem class="px-6 py-4">
              <VCardTitle class="text-subtitle-1 font-weight-bold">ยอดตามบัญชี</VCardTitle>
            </VCardItem>
            <VDivider class="border-opacity-50" />
            <VList class="py-2">
              <VListItem
                v-for="account in data.accounts"
                :key="account.id"
                class="px-6 py-3"
              >
                <template #prepend>
                  <VAvatar color="primary" variant="tonal" size="36" rounded="lg" class="mr-3">
                    <VIcon icon="mdi-wallet-outline" size="18" color="primary" />
                  </VAvatar>
                </template>
                <VListItemTitle class="font-weight-medium text-body-2">{{ account.name }}</VListItemTitle>
                <template #append>
                  <span class="font-weight-bold text-body-2 ml-2">
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
  background: linear-gradient(135deg, #6d28d9 0%, #7c3aed 50%, #8b5cf6 100%);
  box-shadow: 0 10px 25px -5px rgba(124, 58, 237, 0.3) !important;
}
.balance-value {
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.03em;
}
.text-white-70 {
  color: rgba(255, 255, 255, 0.75);
}
.text-white-80 {
  color: rgba(255, 255, 255, 0.85);
}
.text-emerald-300 {
  color: #6ee7b7;
}
.text-rose-300 {
  color: #fca5a5;
}
.badge-period {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  color: white;
}
.today-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.today-grid > div + div {
  padding-left: 1rem;
  border-left: 1px solid rgba(var(--v-border-color), 0.15);
}
</style>
