<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import CategoryBreakdown from "@/components/CategoryBreakdown.vue";
import DailyCashflowChart from "@/components/DailyCashflowChart.vue";
import PageState from "@/components/PageState.vue";
import { downloadCsv, generateTransactionsCsv } from "@/lib/exportCsv";
import { loadFinanceData, type FinanceData } from "@/lib/finance";
import { useAppNavigation } from "@/lib/navigation";
import { formatSatang } from "@/lib/money";
import {
  buildMonthlyReport,
  currentBangkokMonth,
  formatReportMonth,
  nextMonth,
  percentageChange,
  previousMonth,
} from "@/lib/reports";

const loading = ref(true);
const error = ref("");
const data = ref<FinanceData>();
const { goBack } = useAppNavigation();
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
    error.value = "โหลดรายงานไม่สำเร็จ กรุณาลองใหม่";
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
  if (diffSatang > 0) return `เพิ่มขึ้น ${formatSatang(diffSatang)}`;
  if (diffSatang < 0) return `ลดลง ${formatSatang(Math.abs(diffSatang))}`;
  return "เท่ากับเดือนก่อน";
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
      <header class="report-header mb-6">
        <div>
          <p class="text-overline text-primary">Monthly ledger</p>
          <div class="d-flex align-center ga-2 mt-1">
            <VBtn
              icon="mdi-arrow-left"
              variant="tonal"
              color="secondary"
              size="small"
              aria-label="ย้อนกลับ"
              title="ย้อนกลับ"
              @click="goBack('/dashboard')"
            />
            <h1 class="page-title mb-0">รายงานการเงิน</h1>
          </div>
          <p class="mt-1 text-body-2 text-medium-emphasis">
            เปรียบเทียบพฤติกรรมการรับและใช้เงินเดือนต่อเดือน
          </p>
        </div>
        <div class="d-flex flex-wrap align-center ga-2">
          <VBtn
            variant="outlined"
            color="secondary"
            prepend-icon="mdi-download-outline"
            size="small"
            @click="handleExportCsv"
          >
            ส่งออก CSV
          </VBtn>
          <div class="month-control" aria-label="เลือกเดือนที่ต้องการดูรายงาน">
            <VBtn
              icon="mdi-chevron-left"
              variant="text"
              size="small"
              aria-label="เดือนก่อนหน้า"
              @click="moveMonth(-1)"
            />
            <label>
              <span class="sr-only">เดือนรายงาน</span>
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
              aria-label="เดือนถัดไป"
              :disabled="selectedMonth >= currentMonth"
              @click="moveMonth(1)"
            />
          </div>
        </div>
      </header>

      <VCard class="report-hero mb-6 pa-6 pa-md-8">
        <div class="report-hero-grid">
          <div>
            <p class="text-body-2 hero-muted">กระแสเงินสดสุทธิ</p>
            <p class="report-net mt-2">
              {{ report.net >= 0 ? "+" : "" }}{{ formatSatang(report.net) }}
            </p>
            <p class="text-body-2 hero-muted mt-2">
              {{ formatReportMonth(selectedMonth) }} ·
              {{ report.transactionCount }} รายการ
            </p>
          </div>
          <div class="hero-flow">
            <div>
              <span>เงินเข้า</span
              ><strong>{{ formatSatang(report.income) }}</strong>
            </div>
            <VIcon icon="mdi-arrow-right" class="d-none d-sm-inline-flex" />
            <div>
              <span>เงินออก</span
              ><strong>{{ formatSatang(report.expense) }}</strong>
            </div>
          </div>
        </div>
      </VCard>

      <VRow class="mb-2">
        <VCol cols="12" md="6">
          <VCard class="comparison-card materio-card h-100 pa-5 pa-md-6">
            <div class="d-flex justify-space-between align-start ga-4">
              <div>
                <p class="text-body-2 text-medium-emphasis">
                  รายรับเทียบเดือนก่อน
                </p>
                <p class="text-h5 font-weight-semibold mt-2">
                  {{ formatSatang(report.income) }}
                </p>
                <p class="text-caption text-medium-emphasis mt-2">
                  {{ formatDifference(report.income - previousReport.income) }}
                </p>
              </div>
              <VChip :color="incomeChip.color" variant="tonal" size="small">{{
                incomeChip.text
              }}</VChip>
            </div>
          </VCard>
        </VCol>
        <VCol cols="12" md="6">
          <VCard class="comparison-card materio-card h-100 pa-5 pa-md-6">
            <div class="d-flex justify-space-between align-start ga-4">
              <div>
                <p class="text-body-2 text-medium-emphasis">
                  รายจ่ายเทียบเดือนก่อน
                </p>
                <p class="text-h5 font-weight-semibold mt-2">
                  {{ formatSatang(report.expense) }}
                </p>
                <p class="text-caption text-medium-emphasis mt-2">
                  {{
                    formatDifference(report.expense - previousReport.expense)
                  }}
                </p>
              </div>
              <VChip :color="expenseChip.color" variant="tonal" size="small">{{
                expenseChip.text
              }}</VChip>
            </div>
          </VCard>
        </VCol>
      </VRow>

      <VRow>
        <VCol cols="12" lg="8">
          <VCard class="materio-card h-100 pa-5 pa-md-6">
            <div class="mb-1">
              <p class="text-overline text-primary">วันที่เงินขยับ</p>
              <h2 class="text-h6 font-weight-semibold">กระแสเงินสดรายวัน</h2>
              <p class="text-body-2 text-medium-emphasis mt-1">
                มองหาวันที่รายจ่ายพุ่ง เพื่อย้อนดูว่าเกิดจากอะไร
              </p>
            </div>
            <DailyCashflowChart :data="report.daily" />
            <div v-if="report.transactionCount === 0" class="chart-empty">
              <VIcon icon="mdi-chart-timeline-variant-shimmer" size="34" />
              <span>ยังไม่มีรายการในเดือนนี้</span>
            </div>
          </VCard>
        </VCol>
        <VCol cols="12" lg="4">
          <VCard class="materio-card h-100 pa-5 pa-md-6">
            <p class="text-overline text-primary">สัดส่วนรายจ่าย</p>
            <h2 class="text-h6 font-weight-semibold">หมวดที่ใช้เงิน</h2>
            <p
              v-if="report.categories[0]"
              class="text-body-2 text-medium-emphasis mt-1 mb-5"
            >
              {{ report.categories[0].name }} สูงสุดที่
              {{ report.categories[0].percentage.toFixed(1) }}%
            </p>
            <p v-else class="text-body-2 text-medium-emphasis mt-1 mb-5">
              รายจ่ายจะแสดงที่นี่เมื่อเริ่มบันทึก
            </p>
            <CategoryBreakdown :categories="report.categories" />
          </VCard>
        </VCol>
      </VRow>
    </div>
  </PageState>
</template>

<style scoped>
.report-header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1.5rem;
}
.month-control {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.35rem;
  border: 1px solid rgba(var(--v-border-color), 0.12);
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
  color-scheme: light;
}
.month-control:focus-within {
  outline: 2px solid rgba(var(--v-theme-primary), 0.35);
  outline-offset: 2px;
}
.report-hero {
  color: white;
  background: linear-gradient(118deg, #29233a 0%, #463275 55%, #6843a5 100%);
  box-shadow: 0 12px 28px rgba(41, 35, 58, 0.2) !important;
}
.report-hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(20rem, 0.9fr);
  align-items: center;
  gap: 2rem;
}
.hero-muted {
  color: rgba(255, 255, 255, 0.7);
}
.report-net {
  font:
    700 clamp(2rem, 5vw, 3rem)/1.1 Inter,
    "Noto Sans Thai",
    sans-serif;
  letter-spacing: -0.045em;
}
.hero-flow {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 1rem;
  padding: 1.2rem 1.4rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.06);
}
.hero-flow div {
  display: grid;
  gap: 0.35rem;
}
.hero-flow span {
  color: rgba(255, 255, 255, 0.65);
  font-size: 0.75rem;
}
.hero-flow strong {
  font-size: 1rem;
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
@media (max-width: 959px) {
  .report-hero-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 599px) {
  .report-header {
    align-items: stretch;
    flex-direction: column;
  }
  .month-control {
    justify-content: space-between;
  }
  .hero-flow {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
