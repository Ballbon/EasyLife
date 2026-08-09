<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";

import PageState from "@/components/PageState.vue";
import { categoryIcon, categoryIconItems } from "@/lib/categoryIcons";
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

const { t } = useI18n();
const route = useRoute();
const tab = computed(() => route.meta.settingsTab as "accounts" | "categories");
const loading = ref(true);
const pending = ref(false);
const error = ref("");
const success = ref("");
const data = ref<FinanceData>();
const editingCategoryId = ref("");
const accountForm = reactive({
  name: "",
  accountType: "cash",
  initialBalance: "0.00",
});
const categoryForm = reactive({
  name: "",
  transactionType: "expense",
  icon: "circle",
  color: "#7C3AED",
});
const accountTypes = computed(() =>
  Object.keys(accountTypeLabels).map((value) => ({
    value,
    title: t(`settings.accounts.types.${value}`),
  })),
);
const usage = computed(() => {
  const counts = new Map<string, number>();
  data.value?.transactions.forEach((item) => {
    if (item.category_id)
      counts.set(item.category_id, (counts.get(item.category_id) ?? 0) + 1);
  });
  return counts;
});

function resetCategoryForm() {
  editingCategoryId.value = "";
  Object.assign(categoryForm, {
    name: "",
    transactionType: "expense",
    icon: "circle",
    color: "#7C3AED",
  });
}

function editCategory(category: FinanceData["categories"][number]) {
  error.value = "";
  success.value = "";
  editingCategoryId.value = category.id;
  Object.assign(categoryForm, {
    name: category.name,
    transactionType: category.transaction_type,
    icon: category.icon,
    color: category.color,
  });
}

async function refresh() {
  try {
    data.value = await loadFinanceData();
  } catch {
    error.value = t("settings.messages.loadError");
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
    return void (error.value = t("settings.messages.enterAccountName"));
  if (amount === null) return void (error.value = t("settings.messages.invalidInitialBalance"));
  pending.value = true;
  const userId = await currentUserId();
  const { error: insertError } = await supabase.from("accounts").insert({
    user_id: userId,
    name: accountForm.name.trim(),
    account_type: accountForm.accountType,
    initial_balance_satang: amount,
  });
  pending.value = false;
  if (insertError) error.value = t("settings.messages.addAccountError");
  else {
    Object.assign(accountForm, {
      name: "",
      accountType: "cash",
      initialBalance: "0.00",
    });
    success.value = t("settings.messages.accountAdded");
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
  if (updateError) error.value = t("settings.messages.toggleAccountError");
  else await refresh();
}

async function addCategory() {
  error.value = "";
  success.value = "";
  if (!categoryForm.name.trim())
    return void (error.value = t("settings.messages.enterCategoryName"));
  pending.value = true;
  const userId = await currentUserId();
  const { error: insertError } = await supabase.from("categories").insert({
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
        ? t("settings.messages.categoryExists")
        : t("settings.messages.addCategoryError");
  else {
    Object.assign(categoryForm, {
      name: "",
      transactionType: "expense",
      icon: "circle",
      color: "#7C3AED",
    });
    success.value = t("settings.messages.categoryAdded");
    await refresh();
  }
}

async function updateCategory() {
  error.value = "";
  success.value = "";
  if (!categoryForm.name.trim())
    return void (error.value = t("settings.messages.enterCategoryName"));

  const category = data.value?.categories.find(
    (item) => item.id === editingCategoryId.value,
  );
  if (!category) return;

  pending.value = true;
  const userId = await currentUserId();
  const { error: updateError } = await supabase
    .from("categories")
    .update({
      name: categoryForm.name.trim(),
      transaction_type: usage.value.get(category.id)
        ? category.transaction_type
        : categoryForm.transactionType,
      color: categoryForm.color,
      icon: categoryForm.icon,
    })
    .eq("id", category.id)
    .eq("user_id", userId);
  pending.value = false;

  if (updateError) {
    error.value =
      updateError.code === "23505"
        ? t("settings.messages.categoryExists")
        : t("settings.messages.updateCategoryError");
    return;
  }

  resetCategoryForm();
  success.value = t("settings.messages.categoryUpdated");
  await refresh();
}

function submitCategory() {
  return editingCategoryId.value ? updateCategory() : addCategory();
}

async function removeCategory(id: string) {
  if (!window.confirm(t("settings.messages.confirmDeleteCategory"))) return;
  const userId = await currentUserId();
  const { error: deleteError } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .eq("is_default", false);
  if (deleteError) error.value = t("settings.messages.deleteCategoryError");
  else await refresh();
}
</script>

<template>
  <PageState :loading="loading" :error="error && !data ? error : ''">
    <div v-if="data" class="settings-page">
      <div class="mb-6">
        <p class="text-caption font-weight-medium text-disabled mb-1">{{ $t('settings.tagline') }}</p>
        <h1 class="page-title mb-0">{{ $t('settings.title') }}</h1>
      </div>
      <VTabs :model-value="tab" color="primary" class="mb-6" show-arrows>
        <VTab
          value="accounts"
          to="/settings/accounts"
          prepend-icon="mdi-wallet-outline"
          class="text-none font-weight-semibold"
          >{{ $t('settings.tabs.accounts') }}</VTab
        >
        <VTab
          value="categories"
          to="/settings/categories"
          prepend-icon="mdi-shape-outline"
          class="text-none font-weight-semibold"
          >{{ $t('settings.tabs.categories') }}</VTab
        >
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

      <VRow v-if="tab === 'accounts'">
        <VCol cols="12" lg="8">
          <div class="d-grid ga-4">
            <VCard
              v-for="account in data.accounts"
              :key="account.id"
              class="materio-card pa-5 rounded-xl"
              :class="{ 'opacity-60': !account.is_active }"
            >
              <div class="d-flex align-center ga-4">
                <VAvatar color="primary" variant="tonal" rounded="lg" size="42"
                  ><VIcon icon="mdi-wallet-outline" size="20"
                /></VAvatar>
                <div class="flex-grow-1">
                  <p class="font-weight-bold text-body-2 mb-0">{{ account.name }}</p>
                  <p class="text-caption text-medium-emphasis mb-0 mt-1">
                    {{ $t(`settings.accounts.types.${account.account_type}`) }} ·
                    {{ account.is_active ? $t('settings.accounts.active') : $t('settings.accounts.hidden') }}
                  </p>
                </div>
                <div class="text-right">
                  <p class="font-weight-bold text-body-2 mb-1">
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
                    class="text-none rounded-lg"
                    :prepend-icon="
                      account.is_active
                        ? 'mdi-eye-off-outline'
                        : 'mdi-eye-outline'
                    "
                    @click="toggleAccount(account.id, !account.is_active)"
                    >{{ account.is_active ? $t('settings.accounts.hide') : $t('settings.accounts.show') }}</VBtn
                  >
                </div>
              </div>
            </VCard>
          </div>
        </VCol>
        <VCol cols="12" lg="4">
          <VCard class="materio-card pa-6 rounded-xl"
            ><h2 class="text-subtitle-1 font-weight-bold mb-5">{{ $t('settings.accounts.addTitle') }}</h2>
            <VForm @submit.prevent="addAccount"
              ><VTextField
                v-model="accountForm.name"
                :label="$t('settings.accounts.nameLabel')"
                class="mb-3"
                rounded="lg"
              /><VSelect
                v-model="accountForm.accountType"
                :label="$t('settings.accounts.typeLabel')"
                :items="accountTypes"
                class="mb-3"
                rounded="lg"
              /><VTextField
                v-model="accountForm.initialBalance"
                :label="$t('settings.accounts.initialBalanceLabel')"
                prefix="฿"
                inputmode="decimal"
                class="mb-4"
                rounded="lg"
              /><VBtn type="submit" color="primary" class="text-none font-weight-medium rounded-lg" :loading="pending" block
                >{{ $t('settings.accounts.addSubmit') }}</VBtn
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
              ><VCard
                class="materio-card pa-5 h-100 category-card rounded-xl"
                :class="{
                  'category-card--editing': editingCategoryId === category.id,
                }"
                ><div class="d-flex align-center ga-3">
                  <VAvatar
                    :style="{
                      color: category.color,
                      backgroundColor: `${category.color}18`,
                    }"
                    rounded="lg"
                    size="40"
                    ><VIcon :icon="categoryIcon(category.icon)" size="20"
                  /></VAvatar>
                  <div class="flex-grow-1">
                    <p class="font-weight-bold text-body-2 mb-0">{{ category.name }}</p>
                    <p class="text-caption text-medium-emphasis mb-0 mt-1">
                      {{
                        category.transaction_type === "expense"
                          ? $t('transactions.expense')
                          : $t('transactions.income')
                      }}
                      · {{ $t('settings.categories.itemsCount', { count: usage.get(category.id) ?? 0 }) }}
                    </p>
                  </div>
                  <div class="d-flex ga-1">
                    <VBtn
                      icon="mdi-pencil-outline"
                      variant="text"
                      color="primary"
                      size="small"
                      :aria-label="$t('settings.categories.editCategory', { name: category.name })"
                      @click="editCategory(category)"
                    />
                    <VBtn
                      v-if="!category.is_default && !usage.get(category.id)"
                      icon="mdi-delete-outline"
                      variant="text"
                      color="error"
                      size="small"
                      :aria-label="$t('settings.categories.deleteCategory', { name: category.name })"
                      @click="removeCategory(category.id)"
                    />
                  </div></div></VCard></VCol></VRow
        ></VCol>
        <VCol cols="12" lg="4"
          ><VCard class="materio-card pa-6 rounded-xl"
            ><div class="d-flex align-center justify-space-between mb-5">
              <h2 class="text-subtitle-1 font-weight-bold mb-0">
                {{ editingCategoryId ? $t('settings.categories.editTitle') : $t('settings.categories.addTitle') }}
              </h2>
              <VBtn
                v-if="editingCategoryId"
                variant="text"
                color="secondary"
                size="small"
                class="text-none rounded-lg"
                @click="resetCategoryForm"
                >{{ $t('common.cancel') }}</VBtn
              >
            </div>
            <VForm @submit.prevent="submitCategory"
              ><VTextField
                v-model="categoryForm.name"
                :label="$t('settings.categories.nameLabel')"
                class="mb-3"
                rounded="lg"
              /><VSelect
                v-model="categoryForm.transactionType"
                :label="$t('settings.categories.typeLabel')"
                :items="[
                  { title: $t('transactions.expense'), value: 'expense' },
                  { title: $t('transactions.income'), value: 'income' },
                ]"
                :disabled="
                  !!editingCategoryId && !!usage.get(editingCategoryId)
                "
                :hint="
                  editingCategoryId && usage.get(editingCategoryId)
                    ? $t('settings.categories.typeChangeDisabled')
                    : undefined
                "
                persistent-hint
                class="mb-3"
                rounded="lg"
              /><VSelect
                v-model="categoryForm.icon"
                :label="$t('settings.categories.iconLabel')"
                :items="categoryIconItems"
                class="mb-3"
                rounded="lg"
              /><VTextField
                v-model="categoryForm.color"
                :label="$t('settings.categories.colorLabel')"
                type="color"
                class="mb-4"
                rounded="lg"
              /><VBtn type="submit" color="primary" class="text-none font-weight-medium rounded-lg" :loading="pending" block>{{
                editingCategoryId ? $t('settings.categories.saveEdit') : $t('settings.categories.addSubmit')
              }}</VBtn></VForm
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

.category-card {
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.category-card--editing {
  border-color: rgb(var(--v-theme-primary)) !important;
  box-shadow: 0 0 0 1px rgb(var(--v-theme-primary)) !important;
}
</style>
