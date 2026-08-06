<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";

import PageState from "@/components/PageState.vue";
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

onMounted(async () => {
  try {
    data.value = await loadFinanceData();
  } catch {
    error.value = "โหลดรายการไม่สำเร็จ กรุณาลองใหม่";
  } finally {
    loading.value = false;
  }
});

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
  <PageState :loading="loading" :error="error">
    <div v-if="data">
      <div class="d-flex flex-wrap align-end justify-space-between ga-4 mb-6">
        <div>
          <p class="text-body-2 text-medium-emphasis">การเงินของคุณ</p>
          <h1 class="page-title">รายการทั้งหมด</h1>
        </div>
        <VBtn to="/transactions/new" color="primary" prepend-icon="mdi-plus"
          >เพิ่มรายการ</VBtn
        >
      </div>

      <VCard class="materio-card pa-4 pa-md-5 mb-6">
        <VRow dense>
          <VCol cols="12" md="4"
            ><VTextField
              v-model="filters.q"
              label="ค้นหาโน้ต บัญชี หมวดหมู่"
              prepend-inner-icon="mdi-magnify"
              clearable
              hide-details
          /></VCol>
          <VCol cols="6" md="2"
            ><VSelect
              v-model="filters.type"
              label="ประเภท"
              :items="typeItems"
              hide-details
          /></VCol>
          <VCol cols="6" md="2"
            ><VSelect
              v-model="filters.account"
              label="บัญชี"
              :items="[
                { title: 'ทุกบัญชี', value: '' },
                ...data.accounts.map((a) => ({ title: a.name, value: a.id })),
              ]"
              hide-details
          /></VCol>
          <VCol cols="6" md="2"
            ><VSelect
              v-model="filters.category"
              label="หมวดหมู่"
              :items="[
                { title: 'ทุกหมวดหมู่', value: '' },
                ...data.categories.map((c) => ({ title: c.name, value: c.id })),
              ]"
              hide-details
          /></VCol>
          <VCol cols="6" md="2" class="d-flex align-center"
            ><VBtn
              block
              variant="text"
              color="secondary"
              prepend-icon="mdi-filter-off-outline"
              @click="resetFilters"
              >ล้างตัวกรอง</VBtn
            ></VCol
          >
          <VCol cols="6" md="2"
            ><VTextField
              v-model="filters.from"
              label="ตั้งแต่วันที่"
              type="date"
              hide-details
          /></VCol>
          <VCol cols="6" md="2"
            ><VTextField
              v-model="filters.to"
              label="ถึงวันที่"
              type="date"
              hide-details
          /></VCol>
        </VRow>
      </VCard>

      <VCard class="materio-card">
        <VList v-if="transactions.length" lines="two" class="py-2">
          <template v-for="(item, index) in transactions" :key="item.id">
            <VListItem
              :to="`/transactions/${item.id}/edit`"
              class="px-4 px-md-6 py-3"
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
                  ><VIcon
                    :icon="
                      item.transaction_type === 'expense'
                        ? 'mdi-arrow-up-right'
                        : item.transaction_type === 'income'
                          ? 'mdi-arrow-down-left'
                          : 'mdi-swap-horizontal'
                    " /></VAvatar
              ></template>
              <VListItemTitle class="font-weight-medium">{{
                title(item)
              }}</VListItemTitle>
              <VListItemSubtitle
                >{{ item.note || accountNames.get(item.account_id) }} ·
                {{ formatBangkokDateTime(item.occurred_at) }}</VListItemSubtitle
              >
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
            <VDivider v-if="index < transactions.length - 1" inset />
          </template>
        </VList>
        <div v-else class="pa-12 text-center text-medium-emphasis">
          <VIcon icon="mdi-text-box-search-outline" size="48" class="mb-3" />
          <p>ยังไม่พบรายการ ลองเปลี่ยนตัวกรองหรือเพิ่มรายการแรก</p>
        </div>
      </VCard>
    </div>
  </PageState>
</template>
