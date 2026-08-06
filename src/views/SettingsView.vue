<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";

import PageState from "@/components/PageState.vue";
import {
  currentUserId,
  loadFinanceData,
  type FinanceData,
} from "@/lib/finance";
import {
  calculateAccountBalance,
  formatSatang,
  parseMoneyToSatang,
} from "@/lib/money";
import { supabase } from "@/lib/supabase";
import { accountTypeLabels } from "@/lib/transactions";

const route = useRoute();
const tab = computed(() => route.meta.settingsTab as "accounts" | "categories");
const loading = ref(true);
const pending = ref(false);
const error = ref("");
const success = ref("");
const data = ref<FinanceData>();
const accountForm = reactive({
  name: "",
  accountType: "cash",
  initialBalance: "0.00",
});
const categoryForm = reactive({
  name: "",
  transactionType: "expense",
  icon: "circle",
  color: "#9155FD",
});
const accountTypes = Object.entries(accountTypeLabels).map(
  ([value, title]) => ({ value, title }),
);
const iconItems = [
  { title: "ทั่วไป", value: "circle" },
  { title: "อาหาร", value: "utensils" },
  { title: "เดินทาง", value: "car" },
  { title: "บ้าน", value: "home" },
  { title: "งาน", value: "briefcase" },
  { title: "สุขภาพ", value: "heart" },
];
const usage = computed(() => {
  const counts = new Map<string, number>();
  data.value?.transactions.forEach((item) => {
    if (item.category_id)
      counts.set(item.category_id, (counts.get(item.category_id) ?? 0) + 1);
  });
  return counts;
});

async function refresh() {
  try {
    data.value = await loadFinanceData();
  } catch {
    error.value = "โหลดการตั้งค่าไม่สำเร็จ กรุณาลองใหม่";
  }
}
onMounted(async () => {
  await refresh();
  loading.value = false;
});

async function addAccount() {
  error.value = "";
  success.value = "";
  const amount = parseMoneyToSatang(accountForm.initialBalance);
  if (!accountForm.name.trim())
    return void (error.value = "กรุณากรอกชื่อบัญชี");
  if (amount === null) return void (error.value = "ยอดตั้งต้นไม่ถูกต้อง");
  pending.value = true;
  const userId = await currentUserId();
  const { error: insertError } = await supabase
    .from("accounts")
    .insert({
      user_id: userId,
      name: accountForm.name.trim(),
      account_type: accountForm.accountType,
      initial_balance_satang: amount,
    });
  pending.value = false;
  if (insertError) error.value = "เพิ่มบัญชีไม่สำเร็จ";
  else {
    Object.assign(accountForm, {
      name: "",
      accountType: "cash",
      initialBalance: "0.00",
    });
    success.value = "เพิ่มบัญชีแล้ว";
    await refresh();
  }
}

async function toggleAccount(id: string, active: boolean) {
  const userId = await currentUserId();
  const { error: updateError } = await supabase
    .from("accounts")
    .update({ is_active: active })
    .eq("id", id)
    .eq("user_id", userId);
  if (updateError) error.value = "เปลี่ยนสถานะบัญชีไม่สำเร็จ";
  else await refresh();
}

async function addCategory() {
  error.value = "";
  success.value = "";
  if (!categoryForm.name.trim())
    return void (error.value = "กรุณากรอกชื่อหมวดหมู่");
  pending.value = true;
  const userId = await currentUserId();
  const { error: insertError } = await supabase
    .from("categories")
    .insert({
      user_id: userId,
      name: categoryForm.name.trim(),
      transaction_type: categoryForm.transactionType,
      color: categoryForm.color,
      icon: categoryForm.icon,
    });
  pending.value = false;
  if (insertError)
    error.value =
      insertError.code === "23505"
        ? "มีชื่อหมวดหมู่นี้แล้ว"
        : "เพิ่มหมวดหมู่ไม่สำเร็จ";
  else {
    Object.assign(categoryForm, {
      name: "",
      transactionType: "expense",
      icon: "circle",
      color: "#9155FD",
    });
    success.value = "เพิ่มหมวดหมู่แล้ว";
    await refresh();
  }
}

async function removeCategory(id: string) {
  if (!window.confirm("ยืนยันการลบหมวดหมู่นี้?")) return;
  const userId = await currentUserId();
  const { error: deleteError } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .eq("is_default", false);
  if (deleteError) error.value = "ลบหมวดหมู่ไม่สำเร็จ";
  else await refresh();
}

function categoryIcon(icon: string) {
  return (
    (
      {
        utensils: "mdi-silverware-fork-knife",
        car: "mdi-car-outline",
        home: "mdi-home-outline",
        briefcase: "mdi-briefcase-outline",
        heart: "mdi-heart-outline",
      } as Record<string, string>
    )[icon] ?? "mdi-circle-outline"
  );
}
</script>

<template>
  <PageState :loading="loading" :error="error && !data ? error : ''">
    <div v-if="data">
      <div class="mb-6">
        <p class="text-body-2 text-medium-emphasis">ปรับแต่งพื้นที่การเงิน</p>
        <h1 class="page-title">ตั้งค่าการเงิน</h1>
      </div>
      <VTabs :model-value="tab" color="primary" class="mb-6">
        <VTab
          value="accounts"
          to="/settings/accounts"
          prepend-icon="mdi-wallet-outline"
          >บัญชี</VTab
        >
        <VTab
          value="categories"
          to="/settings/categories"
          prepend-icon="mdi-shape-outline"
          >หมวดหมู่</VTab
        >
      </VTabs>
      <VAlert
        v-if="error"
        type="error"
        variant="tonal"
        closable
        class="mb-5"
        @click:close="error = ''"
        >{{ error }}</VAlert
      >
      <VAlert
        v-if="success"
        type="success"
        variant="tonal"
        closable
        class="mb-5"
        @click:close="success = ''"
        >{{ success }}</VAlert
      >

      <VRow v-if="tab === 'accounts'">
        <VCol cols="12" lg="8">
          <div class="d-grid ga-4">
            <VCard
              v-for="account in data.accounts"
              :key="account.id"
              class="materio-card pa-5"
              :class="{ 'opacity-60': !account.is_active }"
            >
              <div class="d-flex align-center ga-4">
                <VAvatar color="primary" variant="tonal" rounded="lg"
                  ><VIcon icon="mdi-wallet-outline"
                /></VAvatar>
                <div class="flex-grow-1">
                  <p class="font-weight-semibold">{{ account.name }}</p>
                  <p class="text-caption text-medium-emphasis">
                    {{ accountTypeLabels[account.account_type] }} ·
                    {{ account.is_active ? "ใช้งาน" : "ซ่อนอยู่" }}
                  </p>
                </div>
                <div class="text-right">
                  <p class="font-weight-semibold">
                    {{
                      formatSatang(
                        calculateAccountBalance(
                          Number(account.initial_balance_satang),
                          account.id,
                          data.transactions,
                        ),
                      )
                    }}
                  </p>
                  <VBtn
                    size="small"
                    variant="text"
                    color="secondary"
                    :prepend-icon="
                      account.is_active
                        ? 'mdi-eye-off-outline'
                        : 'mdi-eye-outline'
                    "
                    @click="toggleAccount(account.id, !account.is_active)"
                    >{{ account.is_active ? "ซ่อน" : "เปิดใช้" }}</VBtn
                  >
                </div>
              </div>
            </VCard>
          </div>
        </VCol>
        <VCol cols="12" lg="4">
          <VCard class="materio-card pa-6"
            ><h2 class="text-h6 font-weight-semibold mb-5">เพิ่มบัญชี</h2>
            <VForm @submit.prevent="addAccount"
              ><VTextField
                v-model="accountForm.name"
                label="ชื่อบัญชี"
                class="mb-2"
              /><VSelect
                v-model="accountForm.accountType"
                label="ประเภท"
                :items="accountTypes"
                class="mb-2"
              /><VTextField
                v-model="accountForm.initialBalance"
                label="ยอดตั้งต้น (บาท)"
                prefix="฿"
                inputmode="decimal"
                class="mb-3"
              /><VBtn type="submit" color="primary" :loading="pending" block
                >เพิ่มบัญชี</VBtn
              ></VForm
            ></VCard
          >
        </VCol>
      </VRow>

      <VRow v-else>
        <VCol cols="12" lg="8"
          ><VRow dense
            ><VCol
              v-for="category in data.categories"
              :key="category.id"
              cols="12"
              sm="6"
              ><VCard class="materio-card pa-5 h-100"
                ><div class="d-flex align-center ga-3">
                  <VAvatar
                    :style="{
                      color: category.color,
                      backgroundColor: `${category.color}18`,
                    }"
                    ><VIcon :icon="categoryIcon(category.icon)"
                  /></VAvatar>
                  <div class="flex-grow-1">
                    <p class="font-weight-semibold">{{ category.name }}</p>
                    <p class="text-caption text-medium-emphasis">
                      {{
                        category.transaction_type === "expense"
                          ? "รายจ่าย"
                          : "รายรับ"
                      }}
                      · {{ usage.get(category.id) ?? 0 }} รายการ
                    </p>
                  </div>
                  <VBtn
                    v-if="!category.is_default && !usage.get(category.id)"
                    icon="mdi-delete-outline"
                    variant="text"
                    color="error"
                    size="small"
                    :aria-label="`ลบ ${category.name}`"
                    @click="removeCategory(category.id)"
                  /></div></VCard></VCol></VRow
        ></VCol>
        <VCol cols="12" lg="4"
          ><VCard class="materio-card pa-6"
            ><h2 class="text-h6 font-weight-semibold mb-5">เพิ่มหมวดหมู่</h2>
            <VForm @submit.prevent="addCategory"
              ><VTextField
                v-model="categoryForm.name"
                label="ชื่อหมวดหมู่"
                class="mb-2"
              /><VSelect
                v-model="categoryForm.transactionType"
                label="ประเภท"
                :items="[
                  { title: 'รายจ่าย', value: 'expense' },
                  { title: 'รายรับ', value: 'income' },
                ]"
                class="mb-2"
              /><VSelect
                v-model="categoryForm.icon"
                label="ไอคอน"
                :items="iconItems"
                class="mb-2"
              /><VTextField
                v-model="categoryForm.color"
                label="สี"
                type="color"
                class="mb-3"
              /><VBtn type="submit" color="primary" :loading="pending" block
                >เพิ่มหมวดหมู่</VBtn
              ></VForm
            ></VCard
          ></VCol
        >
      </VRow>
    </div>
  </PageState>
</template>

<style scoped>
.d-grid {
  display: grid;
}
</style>
