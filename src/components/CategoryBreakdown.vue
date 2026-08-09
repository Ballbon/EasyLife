<script setup lang="ts">
import { formatSatang } from "@/lib/money";
import type { CategoryTotal } from "@/lib/reports";

defineProps<{ categories: CategoryTotal[] }>();
</script>

<template>
  <div v-if="categories.length" class="category-list">
    <div v-for="category in categories" :key="category.id" class="category-row">
      <div class="d-flex align-center ga-3 min-width-0">
        <span
          class="category-mark"
          :style="{ backgroundColor: category.color }"
        ></span>
        <div class="min-width-0">
          <p class="font-weight-medium text-truncate">{{ category.name }}</p>
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
        <p class="font-weight-semibold">{{ formatSatang(category.amount) }}</p>
        <p class="text-caption text-medium-emphasis">
          {{ category.percentage.toFixed(1) }}%
        </p>
      </div>
    </div>
  </div>
  <div v-else class="empty-breakdown text-center text-medium-emphasis">
    <VIcon icon="mdi-chart-donut-variant" size="38" class="mb-2" />
    <p>ยังไม่มีรายจ่ายในเดือนนี้</p>
  </div>
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
