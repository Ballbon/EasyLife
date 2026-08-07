<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";

import PageState from "@/components/PageState.vue";
import {
  addCalendarDays,
  calculateQuestStreak,
  currentBangkokDate,
  datesForMonth,
  occurrencesOnDate,
  totalQuestPoints,
  type QuestOccurrence,
} from "@/lib/quest-calculations";
import {
  deleteQuest,
  loadQuestsData,
  saveQuest,
  setQuestCompletion,
  type QuestDraft,
  type QuestsData,
} from "@/lib/quests";
import { nextMonth, previousMonth } from "@/lib/reports";

const today = currentBangkokDate();
const loading = ref(true);
const pending = ref(false);
const togglingId = ref("");
const error = ref("");
const success = ref("");
const data = ref<QuestsData>();
const tab = ref<"today" | "calendar" | "history">("today");
const dialog = ref(false);
const selectedDate = ref(today);
const selectedMonth = ref(today.slice(0, 7));

const weekdays = [
  { value: 1, label: "จ" },
  { value: 2, label: "อ" },
  { value: 3, label: "พ" },
  { value: 4, label: "พฤ" },
  { value: 5, label: "ศ" },
  { value: 6, label: "ส" },
  { value: 0, label: "อา" },
];
const form = reactive<QuestDraft>(emptyForm());

const todayQuests = computed(() => occurrences(today));
const selectedQuests = computed(() => occurrences(selectedDate.value));
const completedToday = computed(
  () => todayQuests.value.filter((item) => item.completion).length,
);
const points = computed(() => totalQuestPoints(data.value?.completions ?? []));
const streak = computed(() =>
  calculateQuestStreak(data.value?.completions ?? [], today),
);
const weekTrail = computed(() =>
  Array.from({ length: 7 }, (_, index) => {
    const date = addCalendarDays(today, index - 3);
    const quests = occurrences(date);
    return {
      date,
      quests: quests.length,
      completed: quests.filter((item) => item.completion).length,
    };
  }),
);
const calendarCells = computed(() => {
  const dates = datesForMonth(selectedMonth.value);
  const firstDay = new Date(`${dates[0]}T12:00:00Z`).getUTCDay();
  const mondayOffset = (firstDay + 6) % 7;
  return [
    ...Array.from({ length: mondayOffset }, () => null),
    ...dates.map((date) => {
      const quests = occurrences(date);
      return {
        date,
        quests: quests.length,
        completed: quests.filter((item) => item.completion).length,
      };
    }),
  ];
});
const history = computed(() => {
  const taskById = new Map(
    (data.value?.tasks ?? []).map((task) => [task.id, task]),
  );
  return (data.value?.completions ?? [])
    .map((completion) => ({
      completion,
      task: taskById.get(completion.task_id),
    }))
    .filter((item) => item.task)
    .slice(0, 60);
});

function emptyForm(): QuestDraft {
  return {
    id: undefined,
    title: "",
    description: "",
    priority: "normal",
    points: 5,
    startDate: selectedDate.value || today,
    endDate: "",
    frequency: "once",
    daysOfWeek: [],
    scheduledTime: "",
  };
}

function occurrences(date: string) {
  return occurrencesOnDate(
    data.value?.tasks ?? [],
    data.value?.schedules ?? [],
    data.value?.completions ?? [],
    date,
  );
}

async function refresh() {
  data.value = await loadQuestsData();
}

async function loadData() {
  loading.value = true;
  error.value = "";
  try {
    await refresh();
  } catch {
    error.value = "โหลดภารกิจไม่สำเร็จ กรุณาลองใหม่";
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadData();
});

function openNew(date = selectedDate.value) {
  form.id = undefined;
  Object.assign(form, emptyForm(), { startDate: date });
  dialog.value = true;
}

function openEdit(occurrence: QuestOccurrence) {
  const { task, schedule } = occurrence;
  Object.assign(form, emptyForm(), {
    id: task.id,
    title: task.title,
    description: task.description ?? "",
    priority: task.priority as QuestDraft["priority"],
    points: task.points,
    startDate: task.start_date,
    endDate: task.end_date ?? "",
    frequency: schedule.frequency as QuestDraft["frequency"],
    daysOfWeek: [...(schedule.days_of_week ?? [])],
    scheduledTime: schedule.scheduled_time?.slice(0, 5) ?? "",
  });
  dialog.value = true;
}

async function submitQuest() {
  await runAction(async () => {
    await saveQuest(form);
    dialog.value = false;
    success.value = form.id ? "อัปเดต Quest แล้ว" : "สร้าง Quest แล้ว";
  });
}

async function removeQuest() {
  if (!form.id || !window.confirm("ลบ Quest นี้รวมถึงประวัติทั้งหมด?")) return;
  await runAction(async () => {
    await deleteQuest(form.id!);
    dialog.value = false;
    success.value = "ลบ Quest แล้ว";
  });
}

async function toggle(occurrence: QuestOccurrence) {
  if (togglingId.value) return;
  togglingId.value = `${occurrence.task.id}:${occurrence.date}`;
  error.value = "";
  try {
    await setQuestCompletion(
      occurrence.task.id,
      occurrence.date,
      !occurrence.completion,
    );
    await refresh();
  } catch {
    error.value = "บันทึกสถานะไม่สำเร็จ กรุณาลองใหม่";
  } finally {
    togglingId.value = "";
  }
}

async function runAction(action: () => Promise<void>) {
  if (pending.value) return;
  pending.value = true;
  error.value = "";
  success.value = "";
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

function selectCalendarDate(date: string) {
  selectedDate.value = date;
}

function moveMonth(direction: -1 | 1) {
  selectedMonth.value =
    direction === -1
      ? previousMonth(selectedMonth.value)
      : nextMonth(selectedMonth.value);
  selectedDate.value = `${selectedMonth.value}-01`;
}

function formatDate(date: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: "UTC",
    ...options,
  }).format(new Date(`${date}T12:00:00Z`));
}

function frequencyLabel(occurrence: QuestOccurrence) {
  if (occurrence.schedule.frequency === "once") return "ครั้งเดียว";
  if (occurrence.schedule.frequency === "daily") return "ทุกวัน";
  return "รายสัปดาห์";
}
</script>

<template>
  <PageState :loading="loading" :error="error && !data ? error : ''" skeleton-type="list" @retry="loadData">
    <div v-if="data" class="quests-page">
      <header class="quest-header mb-5">
        <div>
          <p class="text-overline text-primary">Daily rhythm</p>
          <h1 class="page-title">วันนี้ เอาให้จบทีละอย่าง</h1>
          <p class="text-body-2 text-medium-emphasis mt-1">
            วางจังหวะเล็ก ๆ ให้ทุกวันขยับไปข้างหน้า
          </p>
        </div>
        <VBtn color="primary" prepend-icon="mdi-plus" @click="openNew(today)">
          สร้าง Quest
        </VBtn>
      </header>

      <VAlert
        v-if="error"
        type="error"
        variant="tonal"
        closable
        class="mb-4"
        @click:close="error = ''"
        >{{ error }}</VAlert
      >
      <VAlert
        v-if="success"
        type="success"
        variant="tonal"
        closable
        class="mb-4"
        @click:close="success = ''"
        >{{ success }}</VAlert
      >

      <section class="rhythm-board mb-5" aria-label="สรุป Daily Quest">
        <div class="score-block">
          <span class="score-kicker">จังหวะต่อเนื่อง</span>
          <strong>{{ streak }}</strong>
          <span>วัน</span>
        </div>
        <div class="week-trail">
          <button
            v-for="day in weekTrail"
            :key="day.date"
            type="button"
            class="trail-day"
            :class="{
              today: day.date === today,
              complete: day.quests > 0 && day.completed === day.quests,
            }"
            @click="
              selectedDate = day.date;
              tab = 'calendar';
            "
          >
            <span>{{ formatDate(day.date, { weekday: "short" }) }}</span>
            <b>{{ formatDate(day.date, { day: "numeric" }) }}</b>
            <i
              :style="{
                '--progress': day.quests
                  ? `${(day.completed / day.quests) * 100}%`
                  : '0%',
              }"
            />
          </button>
        </div>
        <div class="points-block">
          <VIcon icon="mdi-star-four-points" color="warning" size="22" />
          <div>
            <strong>{{ points }}</strong
            ><span> คะแนนสะสม</span>
          </div>
        </div>
      </section>

      <VTabs v-model="tab" color="primary" class="quest-tabs mb-5" grow>
        <VTab value="today">วันนี้</VTab>
        <VTab value="calendar">ปฏิทิน</VTab>
        <VTab value="history">ประวัติ</VTab>
      </VTabs>

      <VWindow v-model="tab">
        <VWindowItem value="today">
          <section class="quest-panel">
            <div class="section-heading">
              <div>
                <p class="text-caption text-medium-emphasis">
                  {{
                    formatDate(today, {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })
                  }}
                </p>
                <h2>Quest วันนี้</h2>
              </div>
              <span class="completion-count"
                >{{ completedToday }} / {{ todayQuests.length }}</span
              >
            </div>
            <div v-if="todayQuests.length" class="quest-list">
              <article
                v-for="occurrence in todayQuests"
                :key="occurrence.task.id"
                class="quest-row"
                :class="{ done: occurrence.completion }"
              >
                <VCheckboxBtn
                  :model-value="Boolean(occurrence.completion)"
                  color="success"
                  :loading="
                    togglingId === `${occurrence.task.id}:${occurrence.date}`
                  "
                  :aria-label="
                    occurrence.completion
                      ? `ยกเลิก ${occurrence.task.title}`
                      : `ทำ ${occurrence.task.title} เสร็จแล้ว`
                  "
                  @update:model-value="toggle(occurrence)"
                />
                <div class="quest-copy">
                  <strong>{{ occurrence.task.title }}</strong>
                  <span>
                    <template v-if="occurrence.schedule.scheduled_time">
                      {{ occurrence.schedule.scheduled_time.slice(0, 5) }} ·
                    </template>
                    {{ frequencyLabel(occurrence) }}
                  </span>
                </div>
                <span class="quest-points">+{{ occurrence.task.points }}</span>
                <VBtn
                  icon="mdi-dots-horizontal"
                  variant="text"
                  size="small"
                  :aria-label="`แก้ไข ${occurrence.task.title}`"
                  @click="openEdit(occurrence)"
                />
              </article>
            </div>
            <div v-else class="empty-quest">
              <VIcon icon="mdi-weather-sunset" size="44" color="primary" />
              <h3>วันนี้ยังโล่งอยู่</h3>
              <p>เพิ่มหนึ่งสิ่งสำคัญที่อยากทำให้จบ</p>
              <VBtn color="primary" variant="tonal" @click="openNew(today)"
                >เพิ่ม Quest วันนี้</VBtn
              >
            </div>
          </section>
        </VWindowItem>

        <VWindowItem value="calendar">
          <div class="calendar-layout">
            <section class="quest-panel calendar-panel">
              <div class="calendar-header">
                <VBtn
                  icon="mdi-chevron-left"
                  variant="text"
                  aria-label="เดือนก่อน"
                  @click="moveMonth(-1)"
                />
                <h2>
                  {{
                    formatDate(`${selectedMonth}-01`, {
                      month: "long",
                      year: "numeric",
                    })
                  }}
                </h2>
                <VBtn
                  icon="mdi-chevron-right"
                  variant="text"
                  aria-label="เดือนถัดไป"
                  @click="moveMonth(1)"
                />
              </div>
              <div class="calendar-grid calendar-weekdays">
                <span v-for="day in weekdays" :key="day.value">{{
                  day.label
                }}</span>
              </div>
              <div class="calendar-grid">
                <template
                  v-for="(cell, index) in calendarCells"
                  :key="cell?.date ?? `blank-${index}`"
                >
                  <span v-if="!cell" />
                  <button
                    v-else
                    type="button"
                    class="calendar-day"
                    :class="{
                      selected: cell.date === selectedDate,
                      today: cell.date === today,
                    }"
                    @click="selectCalendarDate(cell.date)"
                  >
                    <b>{{ Number(cell.date.slice(-2)) }}</b>
                    <span v-if="cell.quests"
                      >{{ cell.completed }}/{{ cell.quests }}</span
                    >
                  </button>
                </template>
              </div>
            </section>

            <aside class="quest-panel day-agenda">
              <div class="section-heading">
                <div>
                  <p class="text-caption text-medium-emphasis">แผนของวันที่</p>
                  <h2>
                    {{
                      formatDate(selectedDate, {
                        day: "numeric",
                        month: "short",
                      })
                    }}
                  </h2>
                </div>
                <VBtn
                  icon="mdi-plus"
                  color="primary"
                  size="small"
                  aria-label="เพิ่ม Quest วันที่เลือก"
                  @click="openNew(selectedDate)"
                />
              </div>
              <div v-if="selectedQuests.length" class="agenda-list">
                <button
                  v-for="occurrence in selectedQuests"
                  :key="occurrence.task.id"
                  type="button"
                  class="agenda-row"
                  @click="openEdit(occurrence)"
                >
                  <VIcon
                    :icon="
                      occurrence.completion
                        ? 'mdi-check-circle'
                        : 'mdi-circle-outline'
                    "
                    :color="occurrence.completion ? 'success' : 'secondary'"
                  />
                  <span>{{ occurrence.task.title }}</span>
                  <small>+{{ occurrence.task.points }}</small>
                </button>
              </div>
              <p
                v-else
                class="text-body-2 text-medium-emphasis py-8 text-center"
              >
                ไม่มี Quest ในวันนี้
              </p>
            </aside>
          </div>
        </VWindowItem>

        <VWindowItem value="history">
          <section class="quest-panel">
            <div class="section-heading">
              <div>
                <p class="text-caption text-medium-emphasis">60 รายการล่าสุด</p>
                <h2>สิ่งที่ทำสำเร็จ</h2>
              </div>
              <span class="completion-count">{{ history.length }} ครั้ง</span>
            </div>
            <div v-if="history.length" class="history-list">
              <article
                v-for="item in history"
                :key="item.completion.id"
                class="history-row"
              >
                <VAvatar color="success" variant="tonal" size="38"
                  ><VIcon icon="mdi-check" size="20"
                /></VAvatar>
                <div>
                  <strong>{{ item.task?.title }}</strong
                  ><span>{{
                    formatDate(item.completion.scheduled_date, {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  }}</span>
                </div>
                <b>+{{ item.completion.earned_points }}</b>
              </article>
            </div>
            <div v-else class="empty-quest">
              <VIcon icon="mdi-history" size="44" color="primary" />
              <h3>ยังไม่มีประวัติ</h3>
              <p>Quest ที่ทำเสร็จจะเรียงอยู่ที่นี่</p>
            </div>
          </section>
        </VWindowItem>
      </VWindow>
    </div>
  </PageState>

  <VDialog v-model="dialog" max-width="620" persistent>
    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between px-5 pt-5">
        <span>{{ form.id ? "แก้ไข Quest" : "สร้าง Quest" }}</span>
        <VBtn
          icon="mdi-close"
          variant="text"
          aria-label="ปิด"
          @click="dialog = false"
        />
      </VCardTitle>
      <VCardText class="px-5">
        <VTextField
          v-model="form.title"
          label="ชื่อ Quest"
          maxlength="120"
          autofocus
        />
        <VTextarea
          v-model="form.description"
          label="รายละเอียด (ไม่บังคับ)"
          rows="2"
          maxlength="1000"
        />
        <div class="form-grid">
          <VSelect
            v-model="form.frequency"
            label="ทำซ้ำ"
            :items="[
              { title: 'ครั้งเดียว', value: 'once' },
              { title: 'ทุกวัน', value: 'daily' },
              { title: 'เลือกวันในสัปดาห์', value: 'weekly' },
            ]"
          />
          <VTextField
            v-model="form.scheduledTime"
            type="time"
            label="เวลา (ไม่บังคับ)"
          />
          <VTextField
            v-model="form.startDate"
            type="date"
            :label="form.frequency === 'once' ? 'วันที่ทำ' : 'วันเริ่ม'"
          />
          <VTextField
            v-if="form.frequency !== 'once'"
            v-model="form.endDate"
            type="date"
            label="วันสิ้นสุด (ไม่บังคับ)"
            :min="form.startDate"
          />
        </div>
        <div v-if="form.frequency === 'weekly'" class="mb-5">
          <p class="text-body-2 font-weight-medium mb-2">ทำในวัน</p>
          <div class="weekday-picker">
            <VBtn
              v-for="day in weekdays"
              :key="day.value"
              :variant="
                form.daysOfWeek.includes(day.value) ? 'flat' : 'outlined'
              "
              :color="
                form.daysOfWeek.includes(day.value) ? 'primary' : 'secondary'
              "
              size="small"
              @click="
                form.daysOfWeek = form.daysOfWeek.includes(day.value)
                  ? form.daysOfWeek.filter((value) => value !== day.value)
                  : [...form.daysOfWeek, day.value]
              "
              >{{ day.label }}</VBtn
            >
          </div>
        </div>
        <div class="form-grid">
          <VSelect
            v-model="form.priority"
            label="ความสำคัญ"
            :items="[
              { title: 'เบา', value: 'low' },
              { title: 'ปกติ', value: 'normal' },
              { title: 'สำคัญ', value: 'high' },
            ]"
          />
          <VTextField
            v-model.number="form.points"
            type="number"
            min="1"
            max="100"
            step="1"
            label="คะแนน"
            suffix="แต้ม"
          />
        </div>
      </VCardText>
      <VCardActions class="px-5 pb-5">
        <VBtn
          v-if="form.id"
          color="error"
          variant="text"
          :disabled="pending"
          @click="removeQuest"
          >ลบ</VBtn
        >
        <VSpacer />
        <VBtn variant="text" :disabled="pending" @click="dialog = false"
          >ยกเลิก</VBtn
        >
        <VBtn color="primary" :loading="pending" @click="submitQuest">{{
          form.id ? "บันทึกการแก้ไข" : "สร้าง Quest"
        }}</VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped>
.quests-page {
  max-width: 1120px;
  margin: 0 auto;
}
.quest-header,
.section-heading,
.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.rhythm-board {
  display: grid;
  grid-template-columns: 150px 1fr 170px;
  align-items: center;
  gap: 24px;
  padding: 22px 26px;
  color: white;
  border-radius: 24px;
  background: linear-gradient(115deg, #5d35b1, #7c4de2 58%, #9155fd);
  box-shadow: 0 14px 32px rgba(93, 53, 177, 0.24);
}
.score-block {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: baseline;
  column-gap: 6px;
}
.score-block .score-kicker {
  grid-column: 1 / -1;
  font-size: 0.72rem;
  opacity: 0.78;
}
.score-block strong {
  font-size: 3rem;
  line-height: 1;
}
.week-trail {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}
.trail-day {
  min-width: 0;
  padding: 7px 3px;
  color: inherit;
  border: 1px solid transparent;
  border-radius: 14px;
  background: transparent;
  cursor: pointer;
}
.trail-day:hover,
.trail-day:focus-visible {
  background: rgba(255, 255, 255, 0.1);
  outline: 2px solid rgba(255, 255, 255, 0.7);
}
.trail-day.today {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.32);
}
.trail-day span,
.trail-day b {
  display: block;
  font-style: normal;
}
.trail-day span {
  font-size: 0.68rem;
  opacity: 0.72;
}
.trail-day b {
  font-size: 1rem;
  margin: 3px 0 7px;
}
.trail-day i {
  display: block;
  height: 3px;
  border-radius: 2px;
  background: linear-gradient(
    to right,
    #c9ff8f var(--progress),
    rgba(255, 255, 255, 0.18) var(--progress)
  );
}
.trail-day.complete i {
  box-shadow: 0 0 8px rgba(201, 255, 143, 0.6);
}
.points-block {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 9px;
}
.points-block strong {
  font-size: 1.35rem;
}
.points-block span {
  display: block;
  font-size: 0.72rem;
  opacity: 0.72;
}
.quest-tabs {
  border-bottom: 1px solid rgba(var(--v-border-color), 0.12);
}
.quest-panel {
  padding: 24px;
  border: 1px solid rgba(var(--v-border-color), 0.12);
  border-radius: 20px;
  background: rgb(var(--v-theme-surface));
  box-shadow: 0 3px 14px rgba(58, 53, 65, 0.06);
}
.section-heading h2,
.calendar-header h2 {
  font-size: 1.15rem;
}
.completion-count {
  padding: 6px 11px;
  color: rgb(var(--v-theme-primary));
  font-size: 0.78rem;
  font-weight: 700;
  border-radius: 999px;
  background: rgba(var(--v-theme-primary), 0.09);
}
.quest-list,
.history-list {
  margin-top: 16px;
}
.quest-row {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  gap: 10px;
  min-height: 68px;
  padding: 7px 10px 7px 4px;
  border-top: 1px solid rgba(var(--v-border-color), 0.09);
}
.quest-row:first-child {
  border-top: 0;
}
.quest-row.done .quest-copy strong {
  text-decoration: line-through;
  opacity: 0.55;
}
.quest-copy {
  min-width: 0;
}
.quest-copy strong,
.quest-copy span {
  display: block;
}
.quest-copy strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.quest-copy span {
  margin-top: 3px;
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-size: 0.75rem;
}
.quest-points {
  color: rgb(var(--v-theme-primary));
  font-size: 0.78rem;
  font-weight: 700;
}
.empty-quest {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 52px 16px 40px;
  text-align: center;
}
.empty-quest h3 {
  margin-top: 4px;
}
.empty-quest p {
  margin-bottom: 8px;
  color: rgba(var(--v-theme-on-surface), 0.62);
  font-size: 0.88rem;
}
.calendar-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.65fr) minmax(270px, 0.75fr);
  gap: 18px;
}
.calendar-header {
  margin-bottom: 16px;
}
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}
.calendar-weekdays {
  margin-bottom: 6px;
  text-align: center;
  color: rgba(var(--v-theme-on-surface), 0.55);
  font-size: 0.72rem;
}
.calendar-day {
  aspect-ratio: 1;
  min-width: 0;
  padding: 6px;
  border: 1px solid transparent;
  border-radius: 14px;
  color: inherit;
  background: rgba(var(--v-theme-primary), 0.025);
  cursor: pointer;
}
.calendar-day:hover,
.calendar-day:focus-visible {
  border-color: rgba(var(--v-theme-primary), 0.45);
  outline: none;
}
.calendar-day.selected {
  color: white;
  background: rgb(var(--v-theme-primary));
}
.calendar-day.today:not(.selected) {
  border-color: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-primary));
}
.calendar-day b,
.calendar-day span {
  display: block;
}
.calendar-day span {
  margin-top: 4px;
  font-size: 0.62rem;
  opacity: 0.72;
}
.agenda-list {
  margin-top: 14px;
}
.agenda-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 11px 2px;
  border: 0;
  border-top: 1px solid rgba(var(--v-border-color), 0.09);
  color: inherit;
  text-align: left;
  background: none;
  cursor: pointer;
}
.agenda-row:hover span,
.agenda-row:focus-visible span {
  color: rgb(var(--v-theme-primary));
}
.agenda-row small {
  color: rgb(var(--v-theme-primary));
  font-weight: 700;
}
.history-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-top: 1px solid rgba(var(--v-border-color), 0.09);
}
.history-row:first-child {
  border-top: 0;
}
.history-row strong,
.history-row span {
  display: block;
}
.history-row span {
  margin-top: 2px;
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-size: 0.75rem;
}
.history-row > b {
  color: rgb(var(--v-theme-success));
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.weekday-picker {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 7px;
}
@media (max-width: 760px) {
  .quest-header {
    align-items: flex-end;
  }
  .rhythm-board {
    grid-template-columns: 1fr auto;
    padding: 20px 16px;
  }
  .week-trail {
    grid-column: 1 / -1;
    grid-row: 2;
  }
  .points-block {
    align-self: center;
  }
  .calendar-layout {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 460px) {
  .quest-header {
    align-items: stretch;
    flex-direction: column;
  }
  .quest-header .v-btn {
    align-self: flex-start;
  }
  .rhythm-board {
    gap: 14px;
    border-radius: 18px;
  }
  .score-block strong {
    font-size: 2.45rem;
  }
  .points-block strong {
    font-size: 1.1rem;
  }
  .trail-day {
    padding-inline: 1px;
  }
  .quest-panel {
    padding: 18px 14px;
    border-radius: 16px;
  }
  .form-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }
  .weekday-picker {
    gap: 4px;
  }
  .weekday-picker .v-btn {
    min-width: 0;
    padding: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    transition: none !important;
  }
}
</style>
