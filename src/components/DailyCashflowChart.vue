<script setup lang="ts">
import { computed } from "vue";

import { formatSatang } from "@/lib/money";
import type { DailyTotal } from "@/lib/reports";

const props = defineProps<{ data: DailyTotal[] }>();

const maximum = computed(() =>
  Math.max(1, ...props.data.flatMap((item) => [item.income, item.expense])),
);

function height(value: number) {
  if (value === 0) return "2px";
  return `${Math.max(8, (value / maximum.value) * 152)}px`;
}
</script>

<template>
  <div>
    <div class="chart-legend d-flex align-center ga-5 mb-5" aria-hidden="true">
      <span><i class="legend-dot income"></i>รายรับ</span>
      <span><i class="legend-dot expense"></i>รายจ่าย</span>
    </div>
    <div class="chart-scroll">
      <div
        class="cashflow-chart"
        role="img"
        aria-label="กราฟรายรับและรายจ่ายรายวัน"
        :style="{
          gridTemplateColumns: `repeat(${data.length || 31}, minmax(14px, 1fr))`,
        }"
      >
        <div v-for="item in data" :key="item.day" class="chart-day">
          <div class="bars">
            <div
              class="bar income"
              :class="{ empty: item.income === 0 }"
              :style="{ height: height(item.income) }"
              :title="`วันที่ ${item.day} รายรับ ${formatSatang(item.income)}`"
            ></div>
            <div
              class="bar expense"
              :class="{ empty: item.expense === 0 }"
              :style="{ height: height(item.expense) }"
              :title="`วันที่ ${item.day} รายจ่าย ${formatSatang(item.expense)}`"
            ></div>
          </div>
          <span>{{ item.day }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chart-legend {
  color: rgba(var(--v-theme-on-surface), 0.68);
  font-size: 0.75rem;
}
.chart-legend span {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}
.legend-dot {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
}
.legend-dot.income,
.bar.income {
  background: #56ca00;
}
.legend-dot.expense,
.bar.expense {
  background: #ff6b6f;
}
.chart-scroll {
  overflow-x: auto;
  padding: 0.25rem 0 0.3rem;
  scrollbar-width: thin;
}
.cashflow-chart {
  min-width: 660px;
  height: 190px;
  display: grid;
  grid-template-columns: repeat(31, minmax(14px, 1fr));
  align-items: end;
  gap: 0.3rem;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.12);
  background: repeating-linear-gradient(
    to bottom,
    transparent 0,
    transparent 49px,
    rgba(var(--v-border-color), 0.07) 50px
  );
}
.chart-day {
  display: flex;
  min-width: 0;
  height: 100%;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  gap: 0.5rem;
  color: rgba(var(--v-theme-on-surface), 0.55);
  font:
    500 0.64rem/1 Inter,
    sans-serif;
}
.bars {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 2px;
  height: 154px;
  width: 100%;
}
.bar {
  width: min(6px, 42%);
  min-width: 3px;
  border-radius: 4px 4px 1px 1px;
  transition:
    filter 160ms ease,
    transform 160ms ease;
}
.bar:hover {
  filter: saturate(1.2);
  transform: scaleX(1.35);
}
.bar.empty {
  background: rgba(var(--v-border-color), 0.1);
}
@media (prefers-reduced-motion: reduce) {
  .bar {
    transition: none;
  }
}
</style>
