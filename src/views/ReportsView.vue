<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

import CategoryBreakdown from "@/components/CategoryBreakdown.vue";
import DailyCashflowChart from "@/components/DailyCashflowChart.vue";
import PageState from "@/components/PageState.vue";
import { downloadCsv, generateTransactionsCsv } from "@/lib/exportCsv";
import { loadFinanceData, type FinanceData } from "@/lib/finance";
import { formatSatang } from "@/lib/money";
import {
  buildMonthlyReport,
  currentBangkokMonth,
  formatReportMonth,
  nextMonth,
  percentageChange,
  previousMonth,
} from "@/lib/reports";

const { t } = useI18n();
const loading = ref(true);
const error = ref("");
const data = ref<FinanceData>();
const currentMonth = currentBangkokMonth();
const selectedMonth = ref(currentMonth);
const selectedMonthInput = computed({
  get: () => selectedMonth.value,
  set: (value: string) => {
    if (/^\d{4}-\d{2}$/.test(value) && value <= currentMonth) {
      selectedMonth.value = value;
    }
  },
});

async function loadData() {
  loading.value = true;
  error.value = "";
  try {
    data.value = await loadFinanceData();
  } catch {
    error.value = t("reports.loadError");
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadData();
});

function handleExportCsv() {
  if (!data.value) return;
  const filtered = data.value.transactions.filter((t) => {
    const bangkokMonth = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "2-digit",
    }).format(new Date(t.occurred_at));
    return bangkokMonth === selectedMonth.value;
  });
  const csvContent = generateTransactionsCsv(
    filtered,
    data.value.accounts,
    data.value.categories,
  );
  downloadCsv(csvContent, `easylife-report-${selectedMonth.value}.csv`);
}

const report = computed(() =>
  buildMonthlyReport(
    selectedMonth.value,
    data.value?.transactions ?? [],
    data.value?.categories ?? [],
  ),
);
const previousReport = computed(() =>
  buildMonthlyReport(
    previousMonth(selectedMonth.value),
    data.value?.transactions ?? [],
    data.value?.categories ?? [],
  ),
);
const incomeChange = computed(() =>
  percentageChange(report.value.income, previousReport.value.income),
);
const expenseChange = computed(() =>
  percentageChange(report.value.expense, previousReport.value.expense),
);

function moveMonth(direction: -1 | 1) {
  const target =
    direction === -1
      ? previousMonth(selectedMonth.value)
      : nextMonth(selectedMonth.value);
  if (target <= currentMonth) {
    selectedMonth.value = target;
  }
}

function formatDifference(diffSatang: number): string {
  if (diffSatang > 0)
    return t("reports.increasedBy", { amount: formatSatang(diffSatang) });
  if (diffSatang < 0)
    return t("reports.decreasedBy", {
      amount: formatSatang(Math.abs(diffSatang)),
    });
  return t("reports.sameAsLastMonth");
}

const incomeChip = computed(() => {
  const change = incomeChange.value;
  if (change === null) return { color: "secondary", text: "—" };
  if (change > 0) return { color: "success", text: `+${change.toFixed(1)}%` };
  if (change < 0) return { color: "error", text: `${change.toFixed(1)}%` };
  return { color: "secondary", text: "0.0%" };
});

const expenseChip = computed(() => {
  const change = expenseChange.value;
  if (change === null) return { color: "secondary", text: "—" };
  if (change < 0) return { color: "success", text: `${change.toFixed(1)}%` };
  if (change > 0) return { color: "error", text: `+${change.toFixed(1)}%` };
  return { color: "secondary", text: "0.0%" };
});
</script>

<template>
  <PageState :loading="loading" :error="error" skeleton-type="dashboard" @retry="loadData">
    <div v-if="data" class="reports-page">
      <header class="d-flex flex-wrap align-center justify-space-between ga-4 mb-6">
        <div>
          <p class="text-caption font-weight-medium text-disabled mb-1">{{ $t('reports.monthlyLedger') }}</p>
          <h1 class="page-title mb-0">{{ $t('reports.pageTitle') }}</h1>
          <p class="text-body-2 text-medium-emphasis mt-1 mb-0">
            {{ $t('reports.pageSubtitle') }}
          </p>
        </div>
        <div class="d-flex flex-wrap align-center ga-3">
          <VBtn
            variant="outlined"
            color="secondary"
            prepend-icon="mdi-download-outline"
            class="text-none font-weight-medium border-opacity-75 rounded-lg"
            @click="handleExportCsv"
          >
            {{ $t('transactions.exportCsv') }}
          </VBtn>
          <div class="month-control" :aria-label="$t('reports.selectMonth')">
            <VBtn
              icon="mdi-chevron-left"
              variant="text"
              size="small"
              :aria-label="$t('reports.prevMonth')"
              @click="moveMonth(-1)"
            />
            <label>
              <span class="sr-only">{{ $t('reports.reportMonthLabel') }}</span>
              <input
                v-model="selectedMonthInput"
                type="month"
                :max="currentMonth"
              />
            </label>
            <VBtn
              icon="mdi-chevron-right"
              variant="text"
              size="small"
              :aria-label="$t('reports.nextMonth')"
              :disabled="selectedMonth >= currentMonth"
              @click="moveMonth(1)"
            />
          </div>
        </div>
      </header>

      <VCard class="report-hero mb-6 pa-6 pa-md-8 rounded-xl">
        <div class="report-hero-grid">
          <div>
            <p class="text-body-2 hero-muted mb-1">{{ $t('reports.netCashflow') }}</p>
            <p class="report-net my-2">
              {{ report.net >= 0 ? "+" : "" }}{{ formatSatang(report.net) }}
            </p>
            <p class="text-body-2 hero-muted mb-0">
              {{ formatReportMonth(selectedMonth) }} · {{ $t('reports.transactionCount', { count: report.transactionCount }) }}
            </p>
          </div>
          <div class="hero-flow rounded-lg">
            <div>
              <span>{{ $t('reports.moneyIn') }}</span>
              <strong class="text-emerald-300">{{ formatSatang(report.income) }}</strong>
            </div>
            <VIcon icon="mdi-arrow-right" class="d-none d-sm-inline-flex" />
            <div>
              <span>{{ $t('reports.moneyOut') }}</span>
              <strong class="text-rose-300">{{ formatSatang(report.expense) }}</strong>
            </div>
          </div>
        </div>
      </VCard>

      <VRow class="mb-4">
        <VCol cols="12" md="6">
          <VCard class="materio-card h-100 pa-6 rounded-xl">
            <div class="d-flex justify-space-between align-start ga-4">
              <div>
                <p class="text-body-2 text-medium-emphasis mb-1">
                  {{ $t('reports.incomeVsPrev') }}
                </p>
                <p class="text-h5 font-weight-bold my-1">
                  {{ formatSatang(report.income) }}
                </p>
                <p class="text-caption text-medium-emphasis mb-0">
                  {{ formatDifference(report.income - previousReport.income) }}
                </p>
              </div>
              <VChip :color="incomeChip.color" variant="tonal" size="small" class="font-weight-medium">{{
                incomeChip.text
              }}</VChip>
            </div>
          </VCard>
        </VCol>
        <VCol cols="12" md="6">
          <VCard class="materio-card h-100 pa-6 rounded-xl">
            <div class="d-flex justify-space-between align-start ga-4">
              <div>
                <p class="text-body-2 text-medium-emphasis mb-1">
                  {{ $t('reports.expenseVsPrev') }}
                </p>
                <p class="text-h5 font-weight-bold my-1">
                  {{ formatSatang(report.expense) }}
                </p>
                <p class="text-caption text-medium-emphasis mb-0">
                  {{
                    formatDifference(report.expense - previousReport.expense)
                  }}
                </p>
              </div>
              <VChip :color="expenseChip.color" variant="tonal" size="small" class="font-weight-medium">{{
                expenseChip.text
              }}</VChip>
            </div>
          </VCard>
        </VCol>
      </VRow>

      <VRow>
        <VCol cols="12" lg="8">
          <VCard class="materio-card h-100 pa-6 rounded-xl">
            <div class="mb-4">
              <p class="text-caption font-weight-bold text-uppercase text-primary tracking-wider mb-1">{{ $t('reports.dailyTagline') }}</p>
              <h2 class="text-subtitle-1 font-weight-bold mb-0">{{ $t('reports.dailyTitle') }}</h2>
              <p class="text-body-2 text-medium-emphasis mt-1 mb-0">
                {{ $t('reports.dailySubtitle') }}
              </p>
            </div>
            <DailyCashflowChart :data="report.daily" />
            <div v-if="report.transactionCount === 0" class="chart-empty">
              <VIcon icon="mdi-chart-timeline-variant-shimmer" size="34" />
              <span>{{ $t('reports.noTransactionsThisMonth') }}</span>
            </div>
          </VCard>
        </VCol>
        <VCol cols="12" lg="4">
          <VCard class="materio-card h-100 pa-6 rounded-xl">
            <p class="text-caption font-weight-bold text-uppercase text-primary tracking-wider mb-1">{{ $t('reports.categoryTagline') }}</p>
            <h2 class="text-subtitle-1 font-weight-bold mb-1">{{ $t('reports.categoryTitle') }}</h2>
            <p
              v-if="report.categories[0]"
              class="text-body-2 text-medium-emphasis mb-4"
            >
              {{ $t('reports.highestCategoryText', { name: report.categories[0].name, percentage: report.categories[0].percentage.toFixed(1) }) }}
            </p>
            <p v-else class="text-body-2 text-medium-emphasis mb-4">
              {{ $t('reports.categoriesEmpty') }}
            </p>
            <CategoryBreakdown :categories="report.categories" />
          </VCard>
        </VCol>
      </VRow>
    </div>
  </PageState>
</template>

<style scoped>
.month-control {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.35rem;
  border: 1px solid rgba(var(--v-border-color), 0.15);
  border-radius: 0.75rem;
  background: rgb(var(--v-theme-surface));
}
.month-control input {
  min-width: 9.5rem;
  border: 0;
  outline: 0;
  background: transparent;
  color: rgb(var(--v-theme-on-surface));
  font:
    600 0.9rem/1.5 Inter,
    "Noto Sans Thai",
    sans-serif;
}
.month-control:focus-within {
  outline: 2px solid rgba(var(--v-theme-primary), 0.35);
  outline-offset: 2px;
}
.report-hero {
  color: white;
  background: linear-gradient(135deg, #3b0764 0%, #6d28d9 50%, #7c3aed 100%);
  box-shadow: 0 10px 25px -5px rgba(124, 58, 237, 0.3) !important;
}
.report-hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(20rem, 0.9fr);
  align-items: center;
  gap: 2rem;
}
.hero-muted {
  color: rgba(255, 255, 255, 0.8);
}
.report-net {
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.04em;
}
.hero-flow {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 1rem;
  padding: 1.2rem 1.4rem;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.08);
}
.text-emerald-300 {
  color: #6ee7b7;
}
.text-rose-300 {
  color: #fca5a5;
}
.chart-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 1rem;
  padding: 0.85rem;
  border-radius: 0.75rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
  background: rgba(var(--v-theme-primary), 0.05);
  font-size: 0.875rem;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
