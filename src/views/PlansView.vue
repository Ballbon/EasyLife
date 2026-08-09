<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";

import PageState from "@/components/PageState.vue";
import { formatSatang } from "@/lib/money";
import {
  allocationAmount,
  budgetStatuses,
  monthDate,
  validateAllocations,
  type AllocationDraft,
} from "@/lib/plan-calculations";
import {
  copyPreviousBudgets,
  deleteBudget,
  deleteGoal,
  loadPlansData,
  saveBudget,
  saveGoal,
  savePlan,
  type PlansData,
} from "@/lib/plans";
import {
  currentBangkokMonth,
  formatReportMonth,
  nextMonth,
  previousMonth,
} from "@/lib/reports";
import type { FinancialGoal } from "@/types/finance";

const loading = ref(true);
const pending = ref(false);
const error = ref("");
const success = ref("");
const data = ref<PlansData>();
const tab = ref<"budgets" | "plan" | "goals">("budgets");
const selectedMonth = ref(currentBangkokMonth());
const budgetDialog = ref(false);
const goalDialog = ref(false);
const editingBudgetId = ref("");

const budgetForm = reactive({ categoryId: "", amount: "" });
const goalForm = reactive({
  id: "",
  name: "",
  target: "",
  saved: "0.00",
  targetDate: "",
  color: "#7C3AED",
});
const expectedIncome = ref("");
const allocationDrafts = ref<AllocationDraft[]>([]);

const statuses = computed(() =>
  budgetStatuses(
    selectedMonth.value,
    data.value?.budgets ?? [],
    data.value?.categories ?? [],
    data.value?.transactions ?? [],
  ),
);
const budgetTotal = computed(() =>
  statuses.value.reduce(
    (sum, item) => sum + Number(item.budget.limit_satang),
    0,
  ),
);
const actualTotal = computed(() =>
  statuses.value.reduce((sum, item) => sum + item.actualSatang, 0),
);
const availableCategories = computed(() => {
  const used = new Set(statuses.value.map((item) => item.category.id));
  if (budgetForm.categoryId) used.delete(budgetForm.categoryId);
  return (data.value?.categories ?? []).filter((item) => !used.has(item.id));
});
const currentPlan = computed(() =>
  data.value?.plans.find(
    (item) => item.month === monthDate(selectedMonth.value),
  ),
);
const planValidation = computed(() =>
  validateAllocations(expectedIncome.value, allocationDrafts.value),
);
const unallocated = computed(() =>
  Math.max(
    0,
    (planValidation.value.incomeSatang ?? 0) - planValidation.value.totalSatang,
  ),
);
const allocationRatio = computed(() => {
  const income = planValidation.value.incomeSatang ?? 0;
  return income
    ? Math.min(100, (planValidation.value.totalSatang / income) * 100)
    : 0;
});

async function refresh() {
  data.value = await loadPlansData();
  hydratePlan();
}

async function loadData() {
  loading.value = true;
  error.value = "";
  try {
    await refresh();
  } catch {
    error.value = "โหลดแผนการเงินไม่สำเร็จ กรุณาลองใหม่";
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadData();
});

watch(selectedMonth, hydratePlan);

function hydratePlan() {
  const plan = currentPlan.value;
  if (!plan) {
    expectedIncome.value = "";
    allocationDrafts.value = [];
    return;
  }
  expectedIncome.value = (Number(plan.expected_income_satang) / 100).toFixed(2);
  allocationDrafts.value = (data.value?.allocations ?? [])
    .filter((item) => item.financial_plan_id === plan.id)
    .map((item) => ({
      id: item.id,
      name: item.name,
      type: item.allocation_type as "percentage" | "fixed",
      value:
        item.allocation_type === "percentage"
          ? String(item.percentage)
          : (Number(item.planned_amount_satang) / 100).toFixed(2),
      categoryId: item.category_id ?? "",
    }));
}

function moveMonth(direction: -1 | 1) {
  selectedMonth.value =
    direction === -1
      ? previousMonth(selectedMonth.value)
      : nextMonth(selectedMonth.value);
}

function openNewBudget() {
  editingBudgetId.value = "";
  Object.assign(budgetForm, {
    categoryId: availableCategories.value[0]?.id ?? "",
    amount: "",
  });
  budgetDialog.value = true;
}

function openBudget(status: (typeof statuses.value)[number]) {
  editingBudgetId.value = status.budget.id;
  Object.assign(budgetForm, {
    categoryId: status.category.id,
    amount: (Number(status.budget.limit_satang) / 100).toFixed(2),
  });
  budgetDialog.value = true;
}

async function submitBudget() {
  if (!budgetForm.categoryId) return void (error.value = "กรุณาเลือกหมวดหมู่");
  await runAction(async () => {
    await saveBudget(
      selectedMonth.value,
      budgetForm.categoryId,
      budgetForm.amount,
    );
    budgetDialog.value = false;
    success.value = editingBudgetId.value
      ? "ปรับวงเงินแล้ว"
      : "เพิ่มงบประมาณแล้ว";
  });
}

async function removeBudget(id: string) {
  if (!window.confirm("ลบงบหมวดนี้ออกจากเดือนที่เลือก?")) return;
  await runAction(async () => {
    await deleteBudget(id);
    budgetDialog.value = false;
    success.value = "ลบงบประมาณแล้ว";
  });
}

async function copyBudgets() {
  await runAction(async () => {
    const count = await copyPreviousBudgets(selectedMonth.value);
    success.value = count
      ? `คัดลอกงบจากเดือนก่อนแล้ว ${count} หมวด`
      : "เดือนก่อนไม่มีงบให้คัดลอก";
  });
}

function addAllocation() {
  allocationDrafts.value.push({
    id: window.crypto.randomUUID(),
    name: "",
    type: "percentage",
    value: "",
    categoryId: "",
  });
}

function allocationPreview(item: AllocationDraft): number {
  const income = planValidation.value.incomeSatang ?? 0;
  return allocationAmount(
    {
      allocation_type: item.type,
      percentage: item.type === "percentage" ? Number(item.value) || 0 : null,
      planned_amount_satang:
        item.type === "fixed"
          ? Math.round((Number(item.value.replaceAll(",", "")) || 0) * 100)
          : null,
    },
    income,
  );
}

async function submitPlan() {
  if (planValidation.value.error) {
    error.value = planValidation.value.error;
    return;
  }
  await runAction(async () => {
    await savePlan(
      selectedMonth.value,
      expectedIncome.value,
      allocationDrafts.value,
    );
    success.value = "บันทึกแผนจัดสรรแล้ว";
  });
}

function openGoal(goal?: FinancialGoal) {
  Object.assign(
    goalForm,
    goal
      ? {
          id: goal.id,
          name: goal.name,
          target: (Number(goal.target_amount_satang) / 100).toFixed(2),
          saved: (Number(goal.saved_amount_satang) / 100).toFixed(2),
          targetDate: goal.target_date ?? "",
          color: goal.color,
        }
      : {
          id: "",
          name: "",
          target: "",
          saved: "0.00",
          targetDate: "",
          color: "#7C3AED",
        },
  );
  goalDialog.value = true;
}

async function submitGoal() {
  await runAction(async () => {
    await saveGoal({ ...goalForm, id: goalForm.id || undefined });
    goalDialog.value = false;
    success.value = goalForm.id ? "อัปเดตเป้าหมายแล้ว" : "สร้างเป้าหมายแล้ว";
  });
}

async function removeGoal(id: string) {
  if (!window.confirm("ลบเป้าหมายนี้?")) return;
  await runAction(async () => {
    await deleteGoal(id);
    goalDialog.value = false;
    success.value = "ลบเป้าหมายแล้ว";
  });
}

async function runAction(action: () => Promise<void>) {
  error.value = "";
  success.value = "";
  pending.value = true;
  try {
    await action();
    await refresh();
  } catch (caught) {
    error.value =
      caught instanceof Error ? caught.message : "บันทึกไม่สำเร็จ กรุณาลองใหม่";
  } finally {
    pending.value = false;
  }
}

function budgetColor(state: "safe" | "near" | "over") {
  return { safe: "success", near: "warning", over: "error" }[state];
}

function goalProgress(goal: FinancialGoal) {
  return Math.min(
    100,
    (Number(goal.saved_amount_satang) / Number(goal.target_amount_satang)) *
      100,
  );
}
</script>

<template>
  <PageState :loading="loading" :error="error && !data ? error : ''" skeleton-type="dashboard" @retry="loadData">
    <div v-if="data" class="plans-page">
      <header class="d-flex flex-wrap align-center justify-space-between ga-4 mb-6">
        <div>
          <p class="text-caption font-weight-medium text-disabled mb-1">Money map</p>
          <h1 class="page-title mb-0">วางเงินก่อนใช้จริง</h1>
          <p class="text-body-2 text-medium-emphasis mt-1 mb-0">
            กำหนดขอบเขต แบ่งรายได้ และค่อย ๆ ไปถึงเป้าหมายการเงิน
          </p>
        </div>
        <div
          v-if="tab !== 'goals'"
          class="month-control"
          aria-label="เลือกเดือน"
        >
          <VBtn
            icon="mdi-chevron-left"
            variant="text"
            size="small"
            aria-label="เดือนก่อนหน้า"
            @click="moveMonth(-1)"
          />
          <label>
            <span class="sr-only">เดือนที่วางแผน</span>
            <input v-model="selectedMonth" type="month" />
          </label>
          <VBtn
            icon="mdi-chevron-right"
            variant="text"
            size="small"
            aria-label="เดือนถัดไป"
            @click="moveMonth(1)"
          />
        </div>
      </header>

      <VTabs v-model="tab" color="primary" class="plans-tabs mb-6" show-arrows>
        <VTab value="budgets" prepend-icon="mdi-gauge" class="text-none font-weight-semibold">งบรายหมวด</VTab>
        <VTab value="plan" prepend-icon="mdi-chart-donut" class="text-none font-weight-semibold">แบ่งรายได้</VTab>
        <VTab value="goals" prepend-icon="mdi-flag-checkered" class="text-none font-weight-semibold">เป้าหมาย</VTab>
      </VTabs>

      <VAlert
        v-if="error"
        type="error"
        variant="tonal"
        closable
        class="mb-5 rounded-lg"
        @click:close="error = ''"
        >{{ error }}</VAlert
      >
      <VAlert
        v-if="success"
        type="success"
        variant="tonal"
        closable
        class="mb-5 rounded-lg"
        @click:close="success = ''"
        >{{ success }}</VAlert
      >

      <section v-if="tab === 'budgets'">
        <VCard class="budget-hero pa-6 pa-md-8 rounded-xl mb-6">
          <div class="budget-hero-grid">
            <div>
              <p class="hero-label mb-1">
                งบคงเหลือ · {{ formatReportMonth(selectedMonth) }}
              </p>
              <p class="hero-amount my-2">
                {{ formatSatang(budgetTotal - actualTotal) }}
              </p>
              <p class="hero-note mb-0">
                ใช้แล้ว {{ formatSatang(actualTotal) }} จาก {{ formatSatang(budgetTotal) }}
              </p>
            </div>
            <div class="budget-actions">
              <VBtn
                variant="tonal"
                prepend-icon="mdi-content-copy"
                class="text-none font-weight-medium rounded-lg"
                @click="copyBudgets"
                >คัดลอกเดือนก่อน</VBtn
              >
              <VBtn
                color="white"
                prepend-icon="mdi-plus"
                class="text-none font-weight-medium rounded-lg"
                :disabled="!availableCategories.length"
                @click="openNewBudget"
                >เพิ่มงบ</VBtn
              >
            </div>
          </div>
        </VCard>

        <div v-if="statuses.length" class="budget-grid">
          <VCard
            v-for="status in statuses"
            :key="status.budget.id"
            class="budget-card materio-card pa-5 rounded-xl"
            tabindex="0"
            @click="openBudget(status)"
            @keydown.enter="openBudget(status)"
          >
            <div class="d-flex justify-space-between align-start ga-3">
              <div class="d-flex align-center ga-3">
                <VAvatar
                  :style="{
                    color: status.category.color,
                    backgroundColor: `${status.category.color}18`,
                  }"
                  rounded="lg"
                  size="40"
                >
                  <VIcon icon="mdi-shape-outline" size="20" />
                </VAvatar>
                <div>
                  <p class="font-weight-bold text-body-2 mb-0">{{ status.category.name }}</p>
                  <p class="text-caption text-medium-emphasis mb-0 mt-1">
                    ใช้แล้ว {{ formatSatang(status.actualSatang) }}
                  </p>
                </div>
              </div>
              <VChip
                :color="budgetColor(status.state)"
                variant="tonal"
                size="small"
                class="font-weight-medium"
              >
                {{
                  status.state === "over"
                    ? "เกินงบ"
                    : `${Math.round(status.percentage)}%`
                }}
              </VChip>
            </div>
            <VProgressLinear
              :model-value="Math.min(status.percentage, 100)"
              :color="budgetColor(status.state)"
              bg-color="grey-lighten-3"
              rounded
              height="8"
              class="my-4"
            />
            <div class="d-flex justify-space-between text-body-2">
              <span class="text-medium-emphasis">{{
                status.state === "over" ? "เกินมา" : "เหลือใช้"
              }}</span>
              <strong :class="status.state === 'over' ? 'text-error' : ''">{{
                formatSatang(Math.abs(status.remainingSatang))
              }}</strong>
            </div>
          </VCard>
        </div>
        <VCard v-else class="empty-card materio-card pa-10 text-center rounded-xl">
          <VAvatar color="primary" variant="tonal" size="64" class="mb-4" rounded="xl"
            ><VIcon icon="mdi-wallet-plus-outline" size="32" color="primary"
          /></VAvatar>
          <h2 class="text-h6 font-weight-bold">
            เดือนนี้ยังไม่มีขอบเขตการใช้เงิน
          </h2>
          <p class="text-body-2 text-medium-emphasis mt-1 mb-6">
            เริ่มจากหมวดที่ใช้บ่อยที่สุด แล้วค่อยเพิ่มหมวดอื่น
          </p>
          <VBtn
            color="primary"
            prepend-icon="mdi-plus"
            class="text-none font-weight-medium rounded-lg px-6"
            :disabled="!availableCategories.length"
            @click="openNewBudget"
            >ตั้งงบหมวดแรก</VBtn
          >
        </VCard>
      </section>

      <section v-else-if="tab === 'plan'" class="plan-layout">
        <div>
          <VCard class="materio-card pa-6 rounded-xl mb-5">
            <p class="text-caption font-weight-bold text-uppercase text-primary tracking-wider mb-1">รายได้ตั้งต้น</p>
            <h2 class="text-subtitle-1 font-weight-bold mb-4">
              เดือนนี้มีเงินให้วางแผนเท่าไร
            </h2>
            <VTextField
              v-model="expectedIncome"
              label="รายได้คาดการณ์"
              prefix="฿"
              inputmode="decimal"
              hide-details
              rounded="lg"
            />
          </VCard>

          <VCard class="materio-card pa-6 rounded-xl">
            <div class="d-flex justify-space-between align-center ga-4 mb-5">
              <div>
                <p class="text-caption font-weight-bold text-uppercase text-primary tracking-wider mb-1">รายการจัดสรร</p>
                <h2 class="text-subtitle-1 font-weight-bold mb-0">แบ่งเงินตามเจตนา</h2>
              </div>
              <VBtn
                variant="tonal"
                color="primary"
                prepend-icon="mdi-plus"
                class="text-none font-weight-medium rounded-lg"
                @click="addAllocation"
                >เพิ่มรายการ</VBtn
              >
            </div>
            <div v-if="allocationDrafts.length" class="allocation-list">
              <div
                v-for="(item, index) in allocationDrafts"
                :key="item.id"
                class="allocation-row"
              >
                <span class="allocation-index">{{
                  String(index + 1).padStart(2, "0")
                }}</span>
                <VTextField
                  v-model="item.name"
                  label="ชื่อรายการ"
                  hide-details
                  rounded="lg"
                />
                <VSelect
                  v-model="item.type"
                  label="รูปแบบ"
                  :items="[
                    { title: 'เปอร์เซ็นต์', value: 'percentage' },
                    { title: 'จำนวนคงที่', value: 'fixed' },
                  ]"
                  hide-details
                  rounded="lg"
                />
                <VTextField
                  v-model="item.value"
                  :label="
                    item.type === 'percentage' ? 'เปอร์เซ็นต์' : 'จำนวนเงิน'
                  "
                  :suffix="item.type === 'percentage' ? '%' : undefined"
                  :prefix="item.type === 'fixed' ? '฿' : undefined"
                  inputmode="decimal"
                  hide-details
                  rounded="lg"
                />
                <VSelect
                  v-model="item.categoryId"
                  label="ผูกหมวด (ถ้ามี)"
                  :items="data.categories"
                  item-title="name"
                  item-value="id"
                  clearable
                  hide-details
                  rounded="lg"
                />
                <div class="allocation-preview">
                  <span>คิดเป็น</span
                  ><strong>{{ formatSatang(allocationPreview(item)) }}</strong>
                </div>
                <VBtn
                  icon="mdi-close"
                  variant="text"
                  color="secondary"
                  size="small"
                  :aria-label="`ลบรายการ ${index + 1}`"
                  @click="allocationDrafts.splice(index, 1)"
                />
              </div>
            </div>
            <div v-else class="plan-empty">
              <VIcon icon="mdi-vector-line" /><span
                >ยังไม่มีรายการจัดสรร เพิ่มรายการแรกเพื่อเริ่มแบ่งเงิน</span
              >
            </div>
          </VCard>
        </div>

        <aside>
          <VCard class="allocation-meter pa-6 rounded-xl">
            <p class="meter-label mb-1">เงินที่ยังไม่จัดสรร</p>
            <p class="meter-value my-2">{{ formatSatang(unallocated) }}</p>
            <div
              class="meter-track mt-6"
              role="progressbar"
              :aria-valuenow="allocationRatio"
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <span :style="{ width: `${allocationRatio}%` }" />
            </div>
            <div class="d-flex justify-space-between mt-3 text-caption">
              <span>จัดแล้ว {{ formatSatang(planValidation.totalSatang) }}</span
              ><span>{{ allocationRatio.toFixed(1) }}%</span>
            </div>
            <VDivider class="my-5 border-opacity-50" />
            <div class="meter-stat">
              <span>เปอร์เซ็นต์รวม</span
              ><strong>{{ planValidation.percentageTotal.toFixed(2) }}%</strong>
            </div>
            <div class="meter-stat mt-3">
              <span>จำนวนรายการ</span
              ><strong>{{ allocationDrafts.length }}</strong>
            </div>
            <VAlert
              v-if="planValidation.error && expectedIncome"
              type="warning"
              variant="tonal"
              density="compact"
              class="mt-5 rounded-lg"
              >{{ planValidation.error }}</VAlert
            >
            <VBtn
              block
              color="primary"
              class="mt-6 text-none font-weight-medium rounded-lg py-3"
              :loading="pending"
              :disabled="Boolean(planValidation.error)"
              @click="submitPlan"
              >บันทึกแผนเดือนนี้</VBtn
            >
          </VCard>
        </aside>
      </section>

      <section v-else>
        <div class="d-flex justify-space-between align-center ga-4 mb-6">
          <div>
            <p class="text-caption font-weight-bold text-uppercase text-primary tracking-wider mb-1">Future funds</p>
            <h2 class="text-subtitle-1 font-weight-bold mb-0">เงินก้อนที่กำลังสร้าง</h2>
          </div>
          <VBtn color="primary" prepend-icon="mdi-plus" class="text-none font-weight-medium rounded-lg px-4" @click="openGoal()"
            >สร้างเป้าหมาย</VBtn
          >
        </div>
        <div v-if="data.goals.length" class="goals-grid">
          <VCard
            v-for="goal in data.goals"
            :key="goal.id"
            class="goal-card materio-card pa-6 rounded-xl"
            @click="openGoal(goal)"
          >
            <div class="goal-mark" :style="{ backgroundColor: goal.color }" />
            <div class="d-flex justify-space-between align-start ga-3">
              <div>
                <p class="text-caption text-medium-emphasis mb-1">
                  {{
                    goal.target_date
                      ? `เป้าหมาย ${new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(new Date(`${goal.target_date}T00:00:00+07:00`))}`
                      : "ไม่กำหนดวัน"
                  }}
                </p>
                <h3 class="text-h6 font-weight-bold mb-0">
                  {{ goal.name }}
                </h3>
              </div>
              <VChip
                :style="{
                  color: goal.color,
                  backgroundColor: `${goal.color}18`,
                }"
                size="small"
                class="font-weight-medium"
                >{{ goalProgress(goal).toFixed(0) }}%</VChip
              >
            </div>
            <div class="goal-numbers mt-6">
              <strong>{{
                formatSatang(Number(goal.saved_amount_satang))
              }}</strong
              ><span
                >จาก {{ formatSatang(Number(goal.target_amount_satang)) }}</span
              >
            </div>
            <VProgressLinear
              :model-value="goalProgress(goal)"
              :color="goal.color"
              bg-color="grey-lighten-3"
              rounded
              height="8"
              class="mt-4"
            />
            <p class="text-caption text-medium-emphasis mt-3 mb-0">
              เหลืออีก
              {{
                formatSatang(
                  Math.max(
                    0,
                    Number(goal.target_amount_satang) -
                      Number(goal.saved_amount_satang),
                  ),
                )
              }}
            </p>
          </VCard>
        </div>
        <VCard v-else class="empty-card materio-card pa-10 text-center rounded-xl"
          ><VAvatar color="primary" variant="tonal" size="64" class="mb-4" rounded="xl"
            ><VIcon icon="mdi-flag-outline" size="32" color="primary"
          /></VAvatar>
          <h2 class="text-h6 font-weight-bold">ตั้งชื่อให้เงินก้อนถัดไป</h2>
          <p class="text-body-2 text-medium-emphasis mt-1 mb-6">
            เงินฉุกเฉิน ทริปพักผ่อน หรือของชิ้นสำคัญ เริ่มติดตามได้จากที่นี่
          </p>
          <VBtn color="primary" class="text-none font-weight-medium rounded-lg px-6" @click="openGoal()"
            >สร้างเป้าหมายแรก</VBtn
          ></VCard
        >
      </section>
    </div>

    <VDialog v-model="budgetDialog" max-width="480">
      <VCard class="pa-6 rounded-xl"
        ><h2 class="text-h6 font-weight-bold">
          {{ editingBudgetId ? "ปรับวงเงิน" : "เพิ่มงบรายหมวด" }}
        </h2>
        <p class="text-body-2 text-medium-emphasis mt-1 mb-5">
          {{ formatReportMonth(selectedMonth) }}
        </p>
        <VForm @submit.prevent="submitBudget"
          ><VSelect
            v-model="budgetForm.categoryId"
            label="หมวดรายจ่าย"
            :items="availableCategories"
            item-title="name"
            item-value="id"
            :disabled="Boolean(editingBudgetId)"
            class="mb-3"
            rounded="lg"
          /><VTextField
            v-model="budgetForm.amount"
            label="วงเงิน"
            prefix="฿"
            inputmode="decimal"
            class="mb-4"
            rounded="lg"
          />
          <div class="d-flex justify-space-between ga-3">
            <VBtn
              v-if="editingBudgetId"
              variant="text"
              color="error"
              class="text-none font-weight-medium rounded-lg"
              @click="removeBudget(editingBudgetId)"
              >ลบงบ</VBtn
            ><VSpacer /><VBtn variant="text" class="text-none rounded-lg" @click="budgetDialog = false"
              >ยกเลิก</VBtn
            ><VBtn type="submit" color="primary" class="text-none font-weight-medium rounded-lg px-5" :loading="pending"
              >บันทึก</VBtn
            >
          </div></VForm
        ></VCard
      >
    </VDialog>

    <VDialog v-model="goalDialog" max-width="520">
      <VCard class="pa-6 rounded-xl"
        ><h2 class="text-h6 font-weight-bold">
          {{ goalForm.id ? "อัปเดตเป้าหมาย" : "สร้างเป้าหมาย" }}
        </h2>
        <p class="text-body-2 text-medium-emphasis mt-1 mb-5">
          บันทึกความคืบหน้าด้วยยอดที่ออมได้จริง
        </p>
        <VForm @submit.prevent="submitGoal"
          ><VTextField
            v-model="goalForm.name"
            label="ชื่อเป้าหมาย"
            class="mb-3"
            rounded="lg"
          /><VRow dense
            ><VCol cols="12" sm="6"
              ><VTextField
                v-model="goalForm.target"
                label="ยอดเป้าหมาย"
                prefix="฿"
                inputmode="decimal"
                rounded="lg" /></VCol
            ><VCol cols="12" sm="6"
              ><VTextField
                v-model="goalForm.saved"
                label="ออมแล้ว"
                prefix="฿"
                inputmode="decimal"
                rounded="lg" /></VCol></VRow
          ><VRow dense
            ><VCol cols="12" sm="8"
              ><VTextField
                v-model="goalForm.targetDate"
                label="วันที่อยากถึงเป้าหมาย"
                type="date"
                rounded="lg" /></VCol
            ><VCol cols="12" sm="4"
              ><VTextField
                v-model="goalForm.color"
                label="สี"
                type="color"
                rounded="lg" /></VCol
          ></VRow>
          <div class="d-flex justify-space-between ga-3 mt-4">
            <VBtn
              v-if="goalForm.id"
              variant="text"
              color="error"
              class="text-none font-weight-medium rounded-lg"
              @click="removeGoal(goalForm.id)"
              >ลบเป้าหมาย</VBtn
            ><VSpacer /><VBtn variant="text" class="text-none rounded-lg" @click="goalDialog = false"
              >ยกเลิก</VBtn
            ><VBtn type="submit" color="primary" class="text-none font-weight-medium rounded-lg px-5" :loading="pending"
              >บันทึก</VBtn
            >
          </div></VForm
        ></VCard
      >
    </VDialog>
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
.plans-tabs {
  border-bottom: 1px solid rgba(var(--v-border-color), 0.15);
}
.budget-hero {
  color: white;
  background: linear-gradient(135deg, #4c1d95 0%, #6d28d9 50%, #7c3aed 100%);
  box-shadow: 0 10px 25px -5px rgba(124, 58, 237, 0.3) !important;
}
.budget-hero-grid {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 2rem;
}
.hero-label,
.hero-note {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.875rem;
}
.hero-amount {
  font-size: clamp(2rem, 6vw, 3.25rem);
  font-weight: 700;
  letter-spacing: -0.04em;
}
.budget-actions {
  display: flex;
  gap: 0.75rem;
}
.budget-actions :deep(.v-btn--variant-tonal) {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}
.budget-actions :deep(.v-btn.bg-white) {
  color: #6d28d9 !important;
}
.budget-grid,
.goals-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.25rem;
}
.budget-card,
.goal-card {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.budget-card:hover,
.goal-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08) !important;
}
.plan-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 22rem;
  align-items: start;
  gap: 1.5rem;
}
.allocation-list {
  display: grid;
  gap: 0.85rem;
}
.allocation-row {
  display: grid;
  grid-template-columns: 2.25rem 1.2fr 0.8fr 0.8fr 1fr 7rem auto;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem;
  border: 1px solid rgba(var(--v-border-color), 0.15);
  border-radius: 0.85rem;
}
.allocation-index {
  color: rgba(var(--v-theme-on-surface), 0.4);
  font-size: 0.75rem;
  font-weight: 700;
}
.allocation-preview {
  display: grid;
  gap: 0.15rem;
}
.allocation-preview span {
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-size: 0.7rem;
}
.allocation-preview strong {
  font-size: 0.8rem;
}
.plan-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  min-height: 8rem;
  border: 1px dashed rgba(var(--v-border-color), 0.25);
  border-radius: 0.85rem;
  color: rgba(var(--v-theme-on-surface), 0.58);
  font-size: 0.875rem;
}
.allocation-meter {
  position: sticky;
  top: 88px;
  color: white;
  background: #1e1b4b;
  box-shadow: 0 10px 25px -5px rgba(30, 27, 75, 0.3) !important;
}
.meter-label,
.allocation-meter .text-caption {
  color: rgba(255, 255, 255, 0.7);
}
.meter-value {
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.03em;
}
.meter-track {
  height: 0.85rem;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.15);
}
.meter-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #a78bfa, #34d399);
  transition: width 0.25s ease;
}
.meter-stat {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
}
.goal-card {
  position: relative;
  overflow: hidden;
}
.goal-mark {
  position: absolute;
  inset: 0 auto 0 0;
  width: 0.35rem;
}
.goal-numbers strong {
  font-size: 1.35rem;
}
.goal-numbers span {
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-size: 0.8rem;
}
.empty-card {
  border-style: dashed !important;
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
