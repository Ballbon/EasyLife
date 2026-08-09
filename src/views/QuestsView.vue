<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";

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

const { t, locale } = useI18n();
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

const weekdays = computed(() => [
  { value: 1, label: t("quests.weekdays.mon") },
  { value: 2, label: t("quests.weekdays.tue") },
  { value: 3, label: t("quests.weekdays.wed") },
  { value: 4, label: t("quests.weekdays.thu") },
  { value: 5, label: t("quests.weekdays.fri") },
  { value: 6, label: t("quests.weekdays.sat") },
  { value: 0, label: t("quests.weekdays.sun") },
]);
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
    error.value = t("quests.messages.loadError");
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
    success.value = form.id ? t("quests.messages.questUpdated") : t("quests.messages.questCreated");
  });
}

async function removeQuest() {
  if (!form.id || !window.confirm(t("quests.messages.confirmDelete"))) return;
  await runAction(async () => {
    await deleteQuest(form.id!);
    dialog.value = false;
    success.value = t("quests.messages.questDeleted");
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
    error.value = t("quests.messages.toggleError");
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
      caught instanceof Error ? caught.message : t("quests.messages.saveError");
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
  const loc = locale.value === "th" ? "th-TH" : "en-US";
  return new Intl.DateTimeFormat(loc, {
    timeZone: "UTC",
    ...options,
  }).format(new Date(`${date}T12:00:00Z`));
}

function frequencyLabel(occurrence: QuestOccurrence) {
  if (occurrence.schedule.frequency === "once") return t("quests.frequencies.once");
  if (occurrence.schedule.frequency === "daily") return t("quests.frequencies.daily");
  return t("quests.frequencies.weekly");
}
</script>

<template>
  <PageState :loading="loading" :error="error && !data ? error : ''" skeleton-type="list" @retry="loadData">
    <div v-if="data" class="quests-page">
      <header class="d-flex flex-wrap align-center justify-space-between ga-4 mb-6">
        <div>
          <p class="text-caption font-weight-medium text-disabled mb-1">{{ $t('quests.tagline') }}</p>
          <h1 class="page-title mb-0">{{ $t('quests.title') }}</h1>
          <p class="text-body-2 text-medium-emphasis mt-1 mb-0">
            {{ $t('quests.subtitle') }}
          </p>
        </div>
        <VBtn color="primary" prepend-icon="mdi-plus" class="text-none font-weight-medium rounded-lg px-4" @click="openNew(today)">
          {{ $t('quests.createQuest') }}
        </VBtn>
      </header>

      <VAlert
        v-if="error"
        type="error"
        variant="tonal"
        closable
        class="mb-4 rounded-lg"
        @click:close="error = ''"
        >{{ error }}</VAlert
      >
      <VAlert
        v-if="success"
        type="success"
        variant="tonal"
        closable
        class="mb-4 rounded-lg"
        @click:close="success = ''"
        >{{ success }}</VAlert
      >

      <!-- RHYTHM HERO BOARD -->
      <section class="rhythm-board mb-6 rounded-xl pa-6" :aria-label="$t('quests.hero.title')">
        <div class="score-block">
          <span class="score-kicker mb-1">{{ $t('quests.hero.streak') }}</span>
          <div class="d-flex align-baseline ga-1">
            <strong class="text-h3 font-weight-bold">{{ streak }}</strong>
            <span class="text-caption">{{ $t('quests.hero.days') }}</span>
          </div>
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
            <strong class="text-subtitle-1 font-weight-bold">{{ points }}</strong>
            <span class="text-caption"> {{ $t('quests.hero.points') }}</span>
          </div>
        </div>
      </section>

      <VTabs v-model="tab" color="primary" class="quest-tabs mb-6" grow>
        <VTab value="today" class="text-none font-weight-semibold">{{ $t('quests.tabs.today') }}</VTab>
        <VTab value="calendar" class="text-none font-weight-semibold">{{ $t('quests.tabs.calendar') }}</VTab>
        <VTab value="history" class="text-none font-weight-semibold">{{ $t('quests.tabs.history') }}</VTab>
      </VTabs>

      <VWindow v-model="tab">
        <VWindowItem value="today">
          <section class="quest-panel materio-card rounded-xl pa-6">
            <div class="d-flex align-center justify-space-between mb-4">
              <div>
                <p class="text-caption text-medium-emphasis mb-1">
                  {{
                    formatDate(today, {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })
                  }}
                </p>
                <h2 class="text-subtitle-1 font-weight-bold mb-0">{{ $t('quests.todayTitle') }}</h2>
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
                      ? $t('quests.cancelTask', { title: occurrence.task.title })
                      : $t('quests.completeTask', { title: occurrence.task.title })
                  "
                  @update:model-value="toggle(occurrence)"
                />
                <div class="quest-copy">
                  <strong class="font-weight-semibold text-body-2">{{ occurrence.task.title }}</strong>
                  <span class="text-caption text-medium-emphasis">
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
                  :aria-label="$t('quests.editTask', { title: occurrence.task.title })"
                  @click="openEdit(occurrence)"
                />
              </article>
            </div>
            <div v-else class="empty-quest py-10">
              <VIcon icon="mdi-weather-sunset" size="44" color="primary" class="mb-2" />
              <h3 class="text-h6 font-weight-bold">{{ $t('quests.emptyTodayTitle') }}</h3>
              <p class="text-body-2 text-medium-emphasis">{{ $t('quests.emptyTodaySubtitle') }}</p>
              <VBtn color="primary" variant="tonal" class="text-none font-weight-medium rounded-lg mt-2" @click="openNew(today)"
                >{{ $t('quests.addTodayQuest') }}</VBtn
              >
            </div>
          </section>
        </VWindowItem>

        <VWindowItem value="calendar">
          <div class="calendar-layout">
            <section class="quest-panel calendar-panel materio-card rounded-xl pa-6">
              <div class="calendar-header mb-4">
                <VBtn
                  icon="mdi-chevron-left"
                  variant="text"
                  :aria-label="$t('quests.prevMonth')"
                  @click="moveMonth(-1)"
                />
                <h2 class="text-subtitle-1 font-weight-bold mb-0">
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
                  :aria-label="$t('quests.nextMonth')"
                  @click="moveMonth(1)"
                />
              </div>
              <div class="calendar-grid calendar-weekdays mb-2">
                <span v-for="day in weekdays" :key="day.value" class="text-caption text-disabled font-weight-bold">{{
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

            <aside class="quest-panel day-agenda materio-card rounded-xl pa-6">
              <div class="d-flex align-center justify-space-between mb-4">
                <div>
                  <p class="text-caption text-medium-emphasis mb-1">{{ $t('quests.dayPlan') }}</p>
                  <h2 class="text-subtitle-1 font-weight-bold mb-0">
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
                  :aria-label="$t('quests.addSelectedDateQuest')"
                  class="rounded-lg"
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
                    size="20"
                  />
                  <span class="text-body-2 font-weight-medium ml-2">{{ occurrence.task.title }}</span>
                  <small class="text-caption font-weight-bold ml-auto">+{{ occurrence.task.points }}</small>
                </button>
              </div>
              <p
                v-else
                class="text-body-2 text-medium-emphasis py-8 text-center"
              >
                {{ $t('quests.noQuestToday') }}
              </p>
            </aside>
          </div>
        </VWindowItem>

        <VWindowItem value="history">
          <section class="quest-panel materio-card rounded-xl pa-6">
            <div class="d-flex align-center justify-space-between mb-4">
              <div>
                <p class="text-caption text-medium-emphasis mb-1">{{ $t('quests.recentItems') }}</p>
                <h2 class="text-subtitle-1 font-weight-bold mb-0">{{ $t('quests.completedTitle') }}</h2>
              </div>
              <span class="completion-count">{{ $t('quests.timesCount', { count: history.length }) }}</span>
            </div>
            <div v-if="history.length" class="history-list">
              <article
                v-for="item in history"
                :key="item.completion.id"
                class="history-row py-3"
              >
                <VAvatar color="success" variant="tonal" size="36" rounded="lg" class="mr-3"
                  ><VIcon icon="mdi-check" size="18"
                /></VAvatar>
                <div>
                  <strong class="font-weight-semibold text-body-2">{{ item.task?.title }}</strong
                  ><span class="text-caption text-medium-emphasis">{{
                    formatDate(item.completion.scheduled_date, {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  }}</span>
                </div>
                <b class="text-body-2 font-weight-bold text-success ml-auto">+{{ item.completion.earned_points }}</b>
              </article>
            </div>
            <div v-else class="empty-quest py-10">
              <VIcon icon="mdi-history" size="44" color="primary" class="mb-2" />
              <h3 class="text-h6 font-weight-bold">{{ $t('quests.noHistoryTitle') }}</h3>
              <p class="text-body-2 text-medium-emphasis">{{ $t('quests.noHistorySubtitle') }}</p>
            </div>
          </section>
        </VWindowItem>
      </VWindow>
    </div>
  </PageState>

  <VDialog v-model="dialog" max-width="620" persistent>
    <VCard class="rounded-xl pa-6">
      <VCardTitle class="d-flex align-center justify-space-between px-0 pt-0 pb-4">
        <span class="text-h6 font-weight-bold">{{ form.id ? $t('quests.dialogEditTitle') : $t('quests.dialogCreateTitle') }}</span>
        <VBtn
          icon="mdi-close"
          variant="text"
          :aria-label="$t('common.cancel')"
          @click="dialog = false"
        />
      </VCardTitle>
      <VCardText class="px-0 py-2">
        <VTextField
          v-model="form.title"
          :label="$t('quests.form.titleLabel')"
          maxlength="120"
          autofocus
          class="mb-3"
          rounded="lg"
        />
        <VTextarea
          v-model="form.description"
          :label="$t('quests.form.descLabel')"
          rows="2"
          maxlength="1000"
          class="mb-3"
          rounded="lg"
        />
        <div class="form-grid">
          <VSelect
            v-model="form.frequency"
            :label="$t('quests.form.frequencyLabel')"
            :items="[
              { title: $t('quests.frequencies.once'), value: 'once' },
              { title: $t('quests.frequencies.daily'), value: 'daily' },
              { title: $t('quests.frequencies.weekly'), value: 'weekly' },
            ]"
            rounded="lg"
          />
          <VTextField
            v-model="form.scheduledTime"
            type="time"
            :label="$t('quests.form.timeLabel')"
            rounded="lg"
          />
          <VTextField
            v-model="form.startDate"
            type="date"
            :label="form.frequency === 'once' ? $t('quests.form.dateDo') : $t('quests.form.dateStart')"
            rounded="lg"
          />
          <VTextField
            v-if="form.frequency !== 'once'"
            v-model="form.endDate"
            type="date"
            :label="$t('quests.form.dateEnd')"
            :min="form.startDate"
            rounded="lg"
          />
        </div>
        <div v-if="form.frequency === 'weekly'" class="mb-4">
          <p class="text-body-2 font-weight-medium mb-2">{{ $t('quests.form.daysLabel') }}</p>
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
              class="rounded-lg"
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
            :label="$t('quests.form.priorityLabel')"
            :items="[
              { title: $t('quests.priorities.low'), value: 'low' },
              { title: $t('quests.priorities.normal'), value: 'normal' },
              { title: $t('quests.priorities.high'), value: 'high' },
            ]"
            rounded="lg"
          />
          <VTextField
            v-model.number="form.points"
            type="number"
            min="1"
            max="100"
            step="1"
            :label="$t('quests.form.pointsLabel')"
            :suffix="$t('quests.form.pointsSuffix')"
            rounded="lg"
          />
        </div>
      </VCardText>
      <VCardActions class="px-0 pb-0 pt-4">
        <VBtn
          v-if="form.id"
          color="error"
          variant="text"
          class="text-none font-weight-medium rounded-lg"
          :disabled="pending"
          @click="removeQuest"
          >{{ $t('common.delete') }}</VBtn
        >
        <VSpacer />
        <VBtn variant="text" class="text-none rounded-lg" :disabled="pending" @click="dialog = false"
          >{{ $t('common.cancel') }}</VBtn
        >
        <VBtn color="primary" class="text-none font-weight-medium rounded-lg px-5" :loading="pending" @click="submitQuest">{{
          form.id ? $t('quests.saveEdit') : $t('quests.createQuest')
        }}</VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped>
.rhythm-board {
  display: grid;
  grid-template-columns: 150px 1fr 170px;
  align-items: center;
  gap: 24px;
  color: white;
  background: linear-gradient(135deg, #5b21b6 0%, #7c3aed 50%, #8b5cf6 100%);
  box-shadow: 0 10px 25px -5px rgba(124, 58, 237, 0.3) !important;
}
.score-block {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: baseline;
  column-gap: 6px;
}
.score-block .score-kicker {
  grid-column: 1 / -1;
  font-size: 0.75rem;
  opacity: 0.8;
}
.week-trail {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}
.trail-day {
  padding: 6px 3px;
  color: inherit;
  border: 1px solid transparent;
  border-radius: 12px;
  background: transparent;
  cursor: pointer;
}
.trail-day:hover,
.trail-day:focus-visible {
  background: rgba(255, 255, 255, 0.15);
}
.trail-day.today {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
}
.trail-day span,
.trail-day b {
  display: block;
  font-style: normal;
}
.trail-day span {
  font-size: 0.7rem;
  opacity: 0.8;
}
.trail-day b {
  font-size: 0.95rem;
  margin: 2px 0 6px;
}
.trail-day i {
  display: block;
  height: 3px;
  border-radius: 2px;
  background: linear-gradient(
    to right,
    #34d399 var(--progress),
    rgba(255, 255, 255, 0.2) var(--progress)
  );
}
.points-block {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}
.quest-tabs {
  border-bottom: 1px solid rgba(var(--v-border-color), 0.15);
}
.completion-count {
  padding: 4px 12px;
  color: rgb(var(--v-theme-primary));
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: 999px;
  background: rgba(var(--v-theme-primary), 0.1);
}
.quest-row {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  gap: 10px;
  min-height: 64px;
  padding: 6px 0;
  border-top: 1px solid rgba(var(--v-border-color), 0.15);
}
.quest-row:first-child {
  border-top: 0;
}
.quest-row.done .quest-copy strong {
  text-decoration: line-through;
  opacity: 0.5;
}
.quest-points {
  color: rgb(var(--v-theme-primary));
  font-size: 0.78rem;
  font-weight: 700;
}
.calendar-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.65fr) minmax(270px, 0.75fr);
  gap: 18px;
}
.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}
.calendar-day {
  aspect-ratio: 1;
  padding: 6px;
  border: 1px solid transparent;
  border-radius: 12px;
  color: inherit;
  background: rgba(var(--v-theme-primary), 0.03);
  cursor: pointer;
}
.calendar-day:hover,
.calendar-day:focus-visible {
  border-color: rgba(var(--v-theme-primary), 0.4);
}
.calendar-day.selected {
  color: white;
  background: rgb(var(--v-theme-primary));
}
.calendar-day.today:not(.selected) {
  border-color: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-primary));
}
.agenda-row {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 10px 0;
  border: 0;
  border-top: 1px solid rgba(var(--v-border-color), 0.15);
  color: inherit;
  text-align: left;
  background: none;
  cursor: pointer;
}
.history-row {
  display: flex;
  align-items: center;
  border-top: 1px solid rgba(var(--v-border-color), 0.15);
}
.history-row:first-child {
  border-top: 0;
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.weekday-picker {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}
</style>
