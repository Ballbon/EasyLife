import { describe, expect, it } from "vitest";

import {
  addCalendarDays,
  calculateQuestStreak,
  currentBangkokDate,
  datesForMonth,
  isTaskScheduled,
  occurrencesOnDate,
  totalQuestPoints,
} from "@/lib/quest-calculations";
import type { Task, TaskCompletion, TaskSchedule } from "@/types/finance";

const task = {
  id: "task-1",
  is_active: true,
  start_date: "2026-08-03",
  end_date: "2026-08-31",
  points: 10,
} as Task;

function schedule(
  frequency: "once" | "daily" | "weekly",
  days: number[] | null = null,
) {
  return {
    task_id: task.id,
    frequency,
    days_of_week: days,
  } as TaskSchedule;
}

function completion(date: string, points = 10) {
  return { scheduled_date: date, earned_points: points } as TaskCompletion;
}

describe("quest occurrences", () => {
  it("handles leap day and year boundaries with calendar arithmetic", () => {
    expect(addCalendarDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addCalendarDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(datesForMonth("2028-02")).toHaveLength(29);
    expect(datesForMonth("2027-02")).toHaveLength(28);
  });

  it("uses the Bangkok date when UTC is still on the previous day", () => {
    expect(currentBangkokDate(new Date("2026-08-05T17:00:00.000Z"))).toBe(
      "2026-08-06",
    );
  });

  it("shows a one-time quest only on its start date", () => {
    expect(isTaskScheduled(task, schedule("once"), "2026-08-03")).toBe(true);
    expect(isTaskScheduled(task, schedule("once"), "2026-08-04")).toBe(false);
  });

  it("respects daily start and end dates", () => {
    expect(isTaskScheduled(task, schedule("daily"), "2026-08-02")).toBe(false);
    expect(isTaskScheduled(task, schedule("daily"), "2026-08-31")).toBe(true);
    expect(isTaskScheduled(task, schedule("daily"), "2026-09-01")).toBe(false);
  });

  it("matches selected weekdays using Sunday as zero", () => {
    const mondayAndFriday = schedule("weekly", [1, 5]);
    expect(isTaskScheduled(task, mondayAndFriday, "2026-08-03")).toBe(true);
    expect(isTaskScheduled(task, mondayAndFriday, "2026-08-07")).toBe(true);
    expect(isTaskScheduled(task, mondayAndFriday, "2026-08-08")).toBe(false);
  });

  it("returns one occurrence with its completion", () => {
    const done = {
      ...completion("2026-08-03"),
      task_id: task.id,
    } as TaskCompletion;
    const result = occurrencesOnDate(
      [task],
      [schedule("daily")],
      [done],
      "2026-08-03",
    );
    expect(result).toHaveLength(1);
    expect(result[0].completion).toBe(done);
  });
});

describe("quest motivation totals", () => {
  it("sums earned points from immutable completion values", () => {
    expect(
      totalQuestPoints([
        completion("2026-08-01", 5),
        completion("2026-08-02", 10),
      ]),
    ).toBe(15);
  });

  it("counts consecutive completed calendar dates through today", () => {
    expect(
      calculateQuestStreak(
        [
          completion("2026-08-03"),
          completion("2026-08-04"),
          completion("2026-08-05"),
        ],
        "2026-08-05",
      ),
    ).toBe(3);
  });

  it("keeps the current streak through yesterday before today is complete", () => {
    expect(
      calculateQuestStreak(
        [completion("2026-08-03"), completion("2026-08-04")],
        "2026-08-05",
      ),
    ).toBe(2);
  });

  it("returns zero after a missed day", () => {
    expect(calculateQuestStreak([completion("2026-08-03")], "2026-08-05")).toBe(
      0,
    );
  });
});
