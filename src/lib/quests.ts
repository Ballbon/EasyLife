import { currentUserId } from "@/lib/finance";
import { supabase } from "@/lib/supabase";
import type { Task, TaskCompletion, TaskSchedule } from "@/types/finance";

export type QuestsData = {
  tasks: Task[];
  schedules: TaskSchedule[];
  completions: TaskCompletion[];
};

export type QuestDraft = {
  id?: string;
  title: string;
  description: string;
  priority: "low" | "normal" | "high";
  points: number;
  startDate: string;
  endDate: string;
  frequency: "once" | "daily" | "weekly";
  daysOfWeek: number[];
  scheduledTime: string;
};

export async function loadQuestsData(): Promise<QuestsData> {
  const userId = await currentUserId();
  const [tasks, schedules, completions] = await Promise.all([
    supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at"),
    supabase
      .from("task_schedules")
      .select("*")
      .eq("user_id", userId)
      .order("scheduled_time"),
    supabase
      .from("task_completions")
      .select("*")
      .eq("user_id", userId)
      .order("scheduled_date", { ascending: false }),
  ]);
  const error = tasks.error ?? schedules.error ?? completions.error;
  if (error) throw error;
  return {
    tasks: tasks.data ?? [],
    schedules: schedules.data ?? [],
    completions: completions.data ?? [],
  };
}

export async function saveQuest(draft: QuestDraft): Promise<void> {
  if (!draft.title.trim()) throw new Error("กรุณากรอกชื่อ Quest");
  if (!draft.startDate) throw new Error("กรุณาเลือกวันเริ่ม");
  if (draft.endDate && draft.endDate < draft.startDate)
    throw new Error("วันสิ้นสุดต้องไม่มาก่อนวันเริ่ม");
  if (draft.frequency === "weekly" && draft.daysOfWeek.length === 0)
    throw new Error("กรุณาเลือกอย่างน้อย 1 วันในสัปดาห์");
  if (!Number.isInteger(draft.points) || draft.points < 1 || draft.points > 100)
    throw new Error("คะแนนต้องเป็นจำนวนเต็ม 1–100");

  const { error } = await supabase.rpc("save_quest", {
    task_id_input: draft.id ?? null,
    title_input: draft.title.trim(),
    description_input: draft.description.trim(),
    priority_input: draft.priority,
    points_input: draft.points,
    start_date_input: draft.startDate,
    end_date_input:
      draft.frequency === "once" ? draft.startDate : draft.endDate || null,
    frequency_input: draft.frequency,
    days_of_week_input:
      draft.frequency === "weekly" ? [...draft.daysOfWeek].sort() : null,
    scheduled_time_input: draft.scheduledTime || null,
  });
  if (error) throw error;
}

export async function deleteQuest(id: string): Promise<void> {
  const userId = await currentUserId();
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function setQuestCompletion(
  taskId: string,
  date: string,
  completed: boolean,
): Promise<void> {
  const { error } = await supabase.rpc("set_quest_completion", {
    task_id_input: taskId,
    scheduled_date_input: date,
    completed_input: completed,
  });
  if (error) throw error;
}
