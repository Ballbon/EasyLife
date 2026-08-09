<script setup lang="ts">
import { formatSatang } from "@/lib/money";
import type { CategoryTotal } from "@/lib/reports";

defineProps<{
  title?: string;
  items?: CategoryTotal[];
  totalSatang?: number;
  emptyText?: string;
  categories?: CategoryTotal[];
}>();
</script>

<template>
  <VCard class="materio-card pa-6 rounded-xl">
    <h2 v-if="title" class="text-subtitle-1 font-weight-bold mb-4">{{ title }}</h2>

    <div v-if="(items || categories || []).length" class="category-list">
      <div v-for="category in (items || categories || [])" :key="category.id" class="category-row">
        <div class="d-flex align-center ga-3 min-width-0">
          <span
            class="category-mark"
            :style="{ backgroundColor: category.color }"
          ></span>
          <div class="min-width-0">
            <p class="font-weight-medium text-truncate mb-0">{{ category.name }}</p>
            <div class="progress-track mt-2">
              <span
                :style="{
                  width: `${Math.max(category.percentage, 2)}%`,
                  backgroundColor: category.color,
                }"
              ></span>
            </div>
          </div>
        </div>
        <div class="text-right">
          <p class="font-weight-semibold mb-0">{{ formatSatang(category.amount) }}</p>
          <p class="text-caption text-medium-emphasis mb-0">
            {{ category.percentage.toFixed(1) }}%
          </p>
        </div>
      </div>
    </div>
    <div v-else class="empty-breakdown text-center text-medium-emphasis py-8">
      <VIcon icon="mdi-chart-donut-variant" size="38" class="mb-2" />
      <p class="mb-0">{{ emptyText ? $t(emptyText) : $t("reports.breakdown.emptyExpense") }}</p>
    </div>
  </VCard>
</template>

<style scoped>
.category-list {
  display: grid;
  gap: 1.15rem;
}
.category-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 1rem;
}
.category-mark {
  width: 0.7rem;
  height: 2.5rem;
  flex: 0 0 auto;
  border-radius: 999px;
}
.min-width-0 {
  min-width: 0;
}
.progress-track {
  width: 100%;
  height: 4px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(var(--v-border-color), 0.08);
}
.progress-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
}
.empty-breakdown {
  padding: 2.5rem 1rem;
}
</style>
