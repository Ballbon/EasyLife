<script setup lang="ts">
import { computed, ref } from "vue";

import { formatSatang } from "@/lib/money";
import type {
  AllocationOverviewData,
  AllocationOverviewItem,
} from "@/lib/plan-calculations";
import { formatReportMonth } from "@/lib/reports";

const props = defineProps<{
  overview: AllocationOverviewData;
  month: string;
}>();

const hoveredIndex = ref<number | null>(null);

// Calculate SVG Pie/Donut Slices
const slices = computed(() => {
  const items = props.overview.items;
  const total = props.overview.expectedIncomeSatang;

  if (!items.length || total <= 0) return [];

  let cumulativeAngle = 0;
  const result = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const value = item.plannedSatang;
    const ratio = value / total;
    const angle = ratio * 360;

    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle = endAngle;

    result.push({
      item,
      index: i,
      startAngle,
      endAngle,
      percentage: ratio * 100,
      color: item.color,
    });
  }

  // Add unallocated slice if remaining income > 0
  if (props.overview.unallocatedSatang > 0) {
    const ratio = props.overview.unallocatedSatang / total;
    const angle = ratio * 360;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;

    result.push({
      item: {
        id: "unallocated",
        name: "ยังไม่จัดสรร",
        type: "fixed" as const,
        percentageOfIncome: ratio * 100,
        plannedSatang: props.overview.unallocatedSatang,
        actualSatang: 0,
        remainingSatang: props.overview.unallocatedSatang,
        spendingPercentage: 0,
        status: "unspent" as const,
        categoryId: null,
        color: "rgba(148, 163, 184, 0.4)",
      },
      index: items.length,
      startAngle,
      endAngle,
      percentage: ratio * 100,
      color: "rgba(148, 163, 184, 0.35)",
      isUnallocated: true,
    });
  }

  return result;
});

// Helper for SVG Arc Path (Donut Slice)
function getArcPath(
  startAngle: number,
  endAngle: number,
  outerRadius = 88,
  innerRadius = 60,
): string {
  if (endAngle - startAngle >= 359.99) {
    endAngle = startAngle + 359.99;
  }

  const startRad = ((startAngle - 90) * Math.PI) / 180;
  const endRad = ((endAngle - 90) * Math.PI) / 180;

  const x1 = 100 + outerRadius * Math.cos(startRad);
  const y1 = 100 + outerRadius * Math.sin(startRad);
  const x2 = 100 + outerRadius * Math.cos(endRad);
  const y2 = 100 + outerRadius * Math.sin(endRad);

  const x3 = 100 + innerRadius * Math.cos(endRad);
  const y3 = 100 + innerRadius * Math.sin(endRad);
  const x4 = 100 + innerRadius * Math.cos(startRad);
  const y4 = 100 + innerRadius * Math.sin(startRad);

  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    `M ${x1} ${y1}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
    `L ${x3} ${y3}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
    "Z",
  ].join(" ");
}

const activeSlice = computed(() => {
  if (hoveredIndex.value !== null && slices.value[hoveredIndex.value]) {
    return slices.value[hoveredIndex.value];
  }
  return null;
});

function statusChipProps(status: AllocationOverviewItem["status"]) {
  switch (status) {
    case "over":
      return { color: "error", label: "เกินงบ" };
    case "near":
      return { color: "warning", label: "ใกล้เต็ม" };
    case "safe":
      return { color: "success", label: "ตามแผน" };
    default:
      return { color: "secondary", label: "ยังไม่ใช้" };
  }
}

function progressColor(item: AllocationOverviewItem) {
  if (item.status === "over") return "error";
  if (item.status === "near") return "warning";
  return "primary";
}
</script>

<template>
  <VCard class="allocation-overview-card materio-card pa-5 pa-md-6 mb-6">
    <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-6">
      <div>
        <div class="d-flex align-center ga-2 mb-1">
          <p class="text-overline text-primary mb-0">Money Allocation Map</p>
          <VChip size="x-small" color="primary" variant="tonal">
            {{ formatReportMonth(month) }}
          </VChip>
        </div>
        <h2 class="text-h6 font-weight-semibold d-flex align-center ga-2">
          <VIcon icon="mdi-chart-donut" color="primary" size="24" />
          วางเงินก่อนใช้จริง
        </h2>
      </div>

      <VBtn
        to="/plans"
        variant="tonal"
        color="primary"
        size="small"
        append-icon="mdi-arrow-right"
      >
        {{ overview.hasPlan ? "ปรับแผนจัดสรรเงิน" : "ตั้งงบวางเงิน" }}
      </VBtn>
    </div>

    <!-- MAIN CONTENT WHEN PLAN / BUDGET EXISTS -->
    <div v-if="overview.items.length" class="allocation-content-grid">
      <!-- CIRCULAR DONUT CHART COLUMN -->
      <div class="donut-section">
        <div class="donut-chart-wrapper">
          <svg viewBox="0 0 200 200" class="donut-svg" aria-label="แผนภาพวงกลมจัดสรรเงิน">
            <g v-for="slice in slices" :key="slice.index">
              <path
                :d="getArcPath(slice.startAngle, slice.endAngle, hoveredIndex === slice.index ? 93 : 88)"
                :fill="slice.color"
                class="donut-slice"
                :class="{ active: hoveredIndex === slice.index }"
                @mouseenter="hoveredIndex = slice.index"
                @mouseleave="hoveredIndex = null"
              />
            </g>

            <!-- CENTER TEXT -->
            <g class="donut-center-text">
              <text x="100" y="92" class="center-amount text-anchor-middle">
                {{ formatSatang(activeSlice ? activeSlice.item.plannedSatang : overview.expectedIncomeSatang) }}
              </text>
              <text x="100" y="112" class="center-label text-anchor-middle">
                {{
                  activeSlice
                    ? activeSlice.item.name
                    : overview.hasPlan
                      ? "รายได้คาดการณ์"
                      : "วงเงินรวม"
                }}
              </text>
              <text v-if="activeSlice" x="100" y="127" class="center-subtext text-anchor-middle">
                {{ activeSlice.percentage.toFixed(1) }}% ของรายได้
              </text>
            </g>
          </svg>
        </div>

        <!-- DONUT LEGEND LIST -->
        <div class="legend-list mt-4">
          <div
            v-for="(slice, i) in slices"
            :key="slice.index"
            class="legend-item"
            :class="{ active: hoveredIndex === i }"
            @mouseenter="hoveredIndex = i"
            @mouseleave="hoveredIndex = null"
          >
            <span class="legend-dot" :style="{ backgroundColor: slice.color }" />
            <span class="legend-name text-truncate">{{ slice.item.name }}</span>
            <span class="legend-percent">{{ slice.percentage.toFixed(1) }}%</span>
          </div>
        </div>
      </div>

      <!-- BREAKDOWN DIAGRAM & PROGRESS LIST COLUMN -->
      <div class="diagram-section">
        <!-- STATS SUMMARY HEADER -->
        <div class="allocation-stats-bar pa-4 mb-4 rounded-lg">
          <div class="d-flex justify-space-between align-center text-body-2 mb-2">
            <span class="text-medium-emphasis">สัดส่วนเงินจัดสรรแล้ว</span>
            <strong class="text-primary font-weight-semibold">
              {{ overview.allocatedRatio.toFixed(1) }}%
            </strong>
          </div>
          <VProgressLinear
            :model-value="overview.allocatedRatio"
            color="primary"
            bg-color="grey-lighten-3"
            height="8"
            rounded
          />

          <div class="d-flex justify-space-between mt-3 text-caption text-medium-emphasis">
            <span>
              จัดสรรแล้ว:
              <strong class="text-high-emphasis">
                {{ formatSatang(overview.totalAllocatedSatang) }}
              </strong>
            </span>
            <span v-if="overview.unallocatedSatang > 0">
              ยังไม่จัดสรร:
              <strong class="text-warning">
                {{ formatSatang(overview.unallocatedSatang) }}
              </strong>
            </span>
          </div>
        </div>

        <!-- DIAGRAM ITEMS LIST -->
        <div class="diagram-items-list">
          <div
            v-for="item in overview.items"
            :key="item.id"
            class="diagram-item-card pa-3 mb-3 rounded-lg"
          >
            <div class="d-flex align-center justify-space-between ga-2 mb-2">
              <div class="d-flex align-center ga-2 min-width-0">
                <span class="item-color-bar" :style="{ backgroundColor: item.color }" />
                <span class="font-weight-medium text-truncate">{{ item.name }}</span>
                <span v-if="item.categoryName" class="text-caption text-medium-emphasis text-truncate">
                  ({{ item.categoryName }})
                </span>
              </div>
              <VChip
                :color="statusChipProps(item.status).color"
                size="x-small"
                variant="tonal"
              >
                {{ statusChipProps(item.status).label }}
              </VChip>
            </div>

            <VProgressLinear
              :model-value="Math.min(item.spendingPercentage, 100)"
              :color="progressColor(item)"
              bg-color="grey-lighten-3"
              height="6"
              rounded
              class="mb-2"
            />

            <div class="d-flex justify-space-between align-center text-caption text-medium-emphasis">
              <span>
                ใช้ไป {{ formatSatang(item.actualSatang) }} / ตั้งไว้ {{ formatSatang(item.plannedSatang) }}
              </span>
              <strong :class="item.status === 'over' ? 'text-error' : 'text-high-emphasis'">
                {{ item.spendingPercentage.toFixed(0) }}%
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- EMPTY STATE CARD WHEN NO PLAN OR BUDGET EXISTS -->
    <div v-else class="empty-allocation-card pa-6 text-center">
      <div class="empty-illustration-ring mb-4">
        <svg viewBox="0 0 100 100" class="empty-svg-donut">
          <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(var(--v-theme-primary), 0.12)" stroke-width="12" />
          <circle
            cx="50"
            cy="50"
            r="38"
            fill="none"
            stroke="rgb(var(--v-theme-primary))"
            stroke-width="12"
            stroke-dasharray="75 160"
            stroke-linecap="round"
          />
          <circle
            cx="50"
            cy="50"
            r="38"
            fill="none"
            stroke="#10B981"
            stroke-width="12"
            stroke-dasharray="40 160"
            stroke-dashoffset="-75"
            stroke-linecap="round"
          />
        </svg>
      </div>

      <h3 class="text-h6 font-weight-semibold mb-2">
        ยังไม่ได้วางเงินก่อนใช้จริงในเดือนนี้
      </h3>
      <p class="text-body-2 text-medium-emphasis mx-auto mb-5 max-w-md">
        การแบ่งรายได้ตามเจตนา (Needs, Savings, Wants) ช่วยให้คุณรู้ขอบเขตการใช้เงินล่วงหน้าก่อนที่เงินจะถูกจ่ายออกไป
      </p>

      <div class="d-flex flex-wrap justify-center ga-3">
        <VBtn to="/plans" color="primary" prepend-icon="mdi-plus">
          เริ่มวางแผนแบ่งรายได้
        </VBtn>
        <VBtn to="/plans" variant="outlined" color="primary" prepend-icon="mdi-wallet-plus-outline">
          ตั้งงบรายหมวด
        </VBtn>
      </div>
    </div>
  </VCard>
</template>

<style scoped>
.allocation-overview-card {
  position: relative;
  overflow: hidden;
}

.allocation-content-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 960px) {
  .allocation-content-grid {
    grid-template-columns: 280px 1fr;
    gap: 2rem;
  }
}

.donut-section {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.donut-chart-wrapper {
  position: relative;
  width: 100%;
  max-width: 220px;
  aspect-ratio: 1;
}

.donut-svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}

.donut-slice {
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease;
  transform-origin: center;
}

.donut-slice:hover,
.donut-slice.active {
  opacity: 0.92;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.15));
}

.donut-center-text {
  pointer-events: none;
}

.text-anchor-middle {
  text-anchor: middle;
}

.center-amount {
  font-size: 15px;
  font-weight: 700;
  fill: currentColor;
}

.center-label {
  font-size: 10px;
  font-weight: 500;
  fill: rgba(var(--v-theme-on-surface), 0.65);
}

.center-subtext {
  font-size: 9px;
  font-weight: 600;
  fill: rgb(var(--v-theme-primary));
}

.legend-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.legend-item {
  display: grid;
  grid-template-columns: 10px 1fr auto;
  align-items: center;
  gap: 0.6rem;
  padding: 0.3rem 0.5rem;
  border-radius: 6px;
  font-size: 0.825rem;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.legend-item:hover,
.legend-item.active {
  background-color: rgba(var(--v-theme-primary), 0.08);
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.legend-name {
  color: rgba(var(--v-theme-on-surface), 0.87);
}

.legend-percent {
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.allocation-stats-bar {
  background: rgba(var(--v-theme-primary), 0.04);
  border: 1px solid rgba(var(--v-border-color), 0.08);
}

.diagram-item-card {
  background: rgba(var(--v-theme-surface), 0.8);
  border: 1px solid rgba(var(--v-border-color), 0.12);
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.diagram-item-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.3);
  transform: translateY(-1px);
}

.item-color-bar {
  width: 4px;
  height: 14px;
  border-radius: 2px;
  flex: 0 0 auto;
}

.empty-illustration-ring {
  width: 90px;
  height: 90px;
  margin: 0 auto;
}

.empty-svg-donut {
  width: 100%;
  height: 100%;
}

.max-w-md {
  max-width: 28rem;
}

.min-width-0 {
  min-width: 0;
}
</style>
