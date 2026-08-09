<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";

import PageState from "@/components/PageState.vue";
import EmptyState from "@/components/ui/EmptyState.vue";
import { downloadCsv, generateTransactionsCsv } from "@/lib/exportCsv";
import { loadFinanceData, type FinanceData } from "@/lib/finance";
import { formatSatang } from "@/lib/money";
import {
  formatBangkokDateTime,
  transactionTypeLabels,
  type TransactionType,
} from "@/lib/transactions";
import type { Transaction } from "@/types/finance";

const loading = ref(true);
const error = ref("");
const data = ref<FinanceData>();
const filters = reactive({
  q: "",
  type: "",
  account: "",
  category: "",
  from: "",
  to: "",
});
const typeItems = [
  { title: "ทุกประเภท", value: "" },
  { title: "รายจ่าย", value: "expense" },
  { title: "รายรับ", value: "income" },
  { title: "โอนเงิน", value: "transfer" },
];

async function loadData() {
  loading.value = true;
  error.value = "";
  try {
    data.value = await loadFinanceData();
  } catch {
    error.value = "โหลดรายการไม่สำเร็จ กรุณาลองใหม่";
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadData();
});

function handleExportCsv() {
  if (!data.value) return;
  const csvContent = generateTransactionsCsv(
    transactions.value,
    data.value.accounts,
    data.value.categories,
  );
  const todayStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
  }).format(new Date());
  downloadCsv(csvContent, `easylife-transactions-${todayStr}.csv`);
}

const accountNames = computed(
  () => new Map(data.value?.accounts.map((item) => [item.id, item.name])),
);
const categoryNames = computed(
  () => new Map(data.value?.categories.map((item) => [item.id, item.name])),
);
const transactions = computed(
  () =>
    data.value?.transactions.filter((item) => {
      if (filters.type && item.transaction_type !== filters.type) return false;
      if (
        filters.account &&
        item.account_id !== filters.account &&
        item.destination_account_id !== filters.account
      )
        return false;
      if (filters.category && item.category_id !== filters.category)
        return false;
      const bangkokDate = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Bangkok",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(item.occurred_at));
      if (filters.from && bangkokDate < filters.from) return false;
      if (filters.to && bangkokDate > filters.to) return false;
      const search = filters.q.trim().toLocaleLowerCase("th");
      if (!search) return true;
      return [
        item.note,
        accountNames.value.get(item.account_id),
        accountNames.value.get(item.destination_account_id ?? ""),
        categoryNames.value.get(item.category_id ?? ""),
      ].some((value) => value?.toLocaleLowerCase("th").includes(search));
    }) ?? [],
);

function title(item: Transaction) {
  const type = item.transaction_type as TransactionType;
  return type === "transfer"
    ? `${accountNames.value.get(item.account_id) ?? "บัญชี"} → ${accountNames.value.get(item.destination_account_id ?? "") ?? "บัญชี"}`
    : (categoryNames.value.get(item.category_id ?? "") ??
        transactionTypeLabels[type]);
}
function resetFilters() {
  Object.assign(filters, {
    q: "",
    type: "",
    account: "",
    category: "",
    from: "",
    to: "",
  });
}
</script>

<template>
  <PageState :loading="loading" :error="error" skeleton-type="list" @retry="loadData">
    <div v-if="data" class="transactions-page">
      <div class="d-flex flex-wrap align-center justify-space-between ga-4 mb-6">
        <div>
          <p class="text-caption font-weight-medium text-disabled mb-1">การเงินของคุณ</p>
          <h1 class="page-title mb-0">รายการทั้งหมด</h1>
        </div>
        <div class="d-flex ga-3">
          <VBtn
            variant="outlined"
            color="secondary"
            prepend-icon="mdi-download-outline"
            class="text-none font-weight-medium border-opacity-75 rounded-lg"
            @click="handleExportCsv"
          >
            ส่งออก CSV
          </VBtn>
          <VBtn to="/transactions/new" color="primary" prepend-icon="mdi-plus" class="text-none font-weight-medium rounded-lg px-4">
            เพิ่มรายการ
          </VBtn>
        </div>
      </div>

      <!-- FILTER BAR -->
      <VCard class="materio-card pa-5 rounded-xl mb-6">
        <VRow dense class="ga-y-3">
          <VCol cols="12" md="4">
            <VTextField
              v-model="filters.q"
              placeholder="ค้นหาโน้ต บัญชี หมวดหมู่..."
              prepend-inner-icon="mdi-magnify"
              clearable
              hide-details
              rounded="lg"
            />
          </VCol>
          <VCol cols="6" md="2">
            <VSelect
              v-model="filters.type"
              label="ประเภท"
              :items="typeItems"
              hide-details
              rounded="lg"
            />
          </VCol>
          <VCol cols="6" md="2">
            <VSelect
              v-model="filters.account"
              label="บัญชี"
              :items="[
                { title: 'ทุกบัญชี', value: '' },
                ...data.accounts.map((a) => ({ title: a.name, value: a.id })),
              ]"
              hide-details
              rounded="lg"
            />
          </VCol>
          <VCol cols="6" md="2">
            <VSelect
              v-model="filters.category"
              label="หมวดหมู่"
              :items="[
                { title: 'ทุกหมวดหมู่', value: '' },
                ...data.categories.map((c) => ({ title: c.name, value: c.id })),
              ]"
              hide-details
              rounded="lg"
            />
          </VCol>
          <VCol cols="6" md="2" class="d-flex align-center">
            <VBtn
              block
              variant="text"
              color="secondary"
              prepend-icon="mdi-filter-off-outline"
              class="text-none rounded-lg"
              @click="resetFilters"
            >
              ล้างตัวกรอง
            </VBtn>
          </VCol>
          <VCol cols="6" md="2">
            <VTextField
              v-model="filters.from"
              label="ตั้งแต่วันที่"
              type="date"
              hide-details
              rounded="lg"
            />
          </VCol>
          <VCol cols="6" md="2">
            <VTextField
              v-model="filters.to"
              label="ถึงวันที่"
              type="date"
              hide-details
              rounded="lg"
            />
          </VCol>
        </VRow>
      </VCard>

      <!-- TRANSACTIONS LIST CONTAINER -->
      <VCard class="materio-card rounded-xl">
        <VList v-if="transactions.length" lines="two" class="py-2">
          <template v-for="(item, index) in transactions" :key="item.id">
            <VListItem
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
                  <VIcon
                    :icon="
                      item.transaction_type === 'expense'
                        ? 'mdi-arrow-up-right'
                        : item.transaction_type === 'income'
                          ? 'mdi-arrow-down-left'
                          : 'mdi-swap-horizontal'
                    "
                    size="20"
                  />
                </VAvatar>
              </template>
              <VListItemTitle class="font-weight-semibold text-body-2">{{
                title(item)
              }}</VListItemTitle>
              <VListItemSubtitle class="text-caption text-medium-emphasis mt-1">
                {{ item.note || accountNames.get(item.account_id) }} · {{ formatBangkokDateTime(item.occurred_at) }}
              </VListItemSubtitle>
              <template #append>
                <span
                  class="font-weight-bold text-body-2 ml-2"
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
            <VDivider v-if="index < transactions.length - 1" class="border-opacity-40 ml-16" />
          </template>
        </VList>

        <EmptyState
          v-else
          title="ไม่พบรายการการเงิน"
          description="ไม่พบรายการที่ตรงกับเงื่อนไขการกรองของคุณ ลองเปลี่ยนตัวกรองหรือเพิ่มรายการแรก"
          action-text="เพิ่มรายการใหม่"
          action-icon="mdi-plus"
          to="/transactions/new"
        />
      </VCard>
    </div>
  </PageState>
</template>
