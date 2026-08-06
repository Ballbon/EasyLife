import type { Task, TaskCompletion, TaskSchedule } from "@/types/finance";

export type QuestOccurrence = {
  task: Task;
  schedule: TaskSchedule;
  date: string;
  completion?: TaskCompletion;
};

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function dateAtUtcNoon(date: string): Date {
  if (!DATE_PATTERN.test(date)) throw new Error("Invalid date");
  return new Date(`${date}T12:00:00.000Z`);
}

export function currentBangkokDate(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function addCalendarDays(date: string, amount: number): string {
  const value = dateAtUtcNoon(date);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}

export function isTaskScheduled(
  task: Task,
  schedule: TaskSchedule,
  date: string,
): boolean {
  if (!task.is_active || date < task.start_date) return false;
  if (task.end_date && date > task.end_date) return false;
  if (schedule.frequency === "once") return date === task.start_date;
  if (schedule.frequency === "daily") return true;
  if (schedule.frequency === "weekly") {
    return (schedule.days_of_week ?? []).includes(
      dateAtUtcNoon(date).getUTCDay(),
    );
  }
  return false;
}

export function occurrencesOnDate(
  tasks: Task[],
  schedules: TaskSchedule[],
  completions: TaskCompletion[],
  date: string,
): QuestOccurrence[] {
  const scheduleByTask = new Map(schedules.map((item) => [item.task_id, item]));
  const completionByTask = new Map(
    completions
      .filter((item) => item.scheduled_date === date)
      .map((item) => [item.task_id, item]),
  );

  return tasks
    .flatMap((task) => {
      const schedule = scheduleByTask.get(task.id);
      return schedule && isTaskScheduled(task, schedule, date)
        ? [{ task, schedule, date, completion: completionByTask.get(task.id) }]
        : [];
    })
    .sort(
      (a, b) =>
        Number(Boolean(a.completion)) - Number(Boolean(b.completion)) ||
        (a.schedule.scheduled_time ?? "99:99").localeCompare(
          b.schedule.scheduled_time ?? "99:99",
        ) ||
        b.task.points - a.task.points,
    );
}

export function totalQuestPoints(completions: TaskCompletion[]): number {
  return completions.reduce((sum, item) => sum + item.earned_points, 0);
}

export function calculateQuestStreak(
  completions: TaskCompletion[],
  today: string,
): number {
  const completedDates = new Set(
    completions.map((item) => item.scheduled_date),
  );
  let cursor = completedDates.has(today) ? today : addCalendarDays(today, -1);
  let streak = 0;
  while (completedDates.has(cursor)) {
    streak += 1;
    cursor = addCalendarDays(cursor, -1);
  }
  return streak;
}

export function datesForMonth(month: string): string[] {
  if (!/^\d{4}-\d{2}$/.test(month)) throw new Error("Invalid month");
  const [year, monthNumber] = month.split("-").map(Number);
  const days = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return Array.from(
    { length: days },
    (_, index) => `${month}-${String(index + 1).padStart(2, "0")}`,
  );
}
