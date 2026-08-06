create or replace function public.save_quest(
  task_id_input uuid,
  title_input text,
  description_input text,
  priority_input text,
  points_input smallint,
  start_date_input date,
  end_date_input date,
  frequency_input text,
  days_of_week_input smallint[],
  scheduled_time_input time
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  saved_task_id uuid;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if task_id_input is null then
    insert into public.tasks
      (user_id, title, description, priority, points, start_date, end_date)
    values
      (current_user_id, title_input, nullif(trim(description_input), ''), priority_input,
       points_input, start_date_input, end_date_input)
    returning id into saved_task_id;
  else
    update public.tasks set
      title = title_input,
      description = nullif(trim(description_input), ''),
      priority = priority_input,
      points = points_input,
      start_date = start_date_input,
      end_date = end_date_input
    where id = task_id_input and user_id = current_user_id
    returning id into saved_task_id;
    if saved_task_id is null then raise exception 'Quest not found'; end if;
  end if;

  insert into public.task_schedules
    (user_id, task_id, frequency, days_of_week, scheduled_time)
  values
    (current_user_id, saved_task_id, frequency_input,
     case when frequency_input = 'weekly' then days_of_week_input else null end,
     scheduled_time_input)
  on conflict (task_id) do update set
    frequency = excluded.frequency,
    days_of_week = excluded.days_of_week,
    scheduled_time = excluded.scheduled_time;
  return saved_task_id;
end;
$$;

create or replace function public.set_quest_completion(
  task_id_input uuid,
  scheduled_date_input date,
  completed_input boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  selected_task public.tasks;
  selected_schedule public.task_schedules;
  weekday smallint := extract(dow from scheduled_date_input)::smallint;
  is_scheduled boolean;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  select * into selected_task from public.tasks
    where id = task_id_input and user_id = current_user_id;
  select * into selected_schedule from public.task_schedules
    where task_id = task_id_input and user_id = current_user_id;
  if selected_task.id is null or selected_schedule.id is null then
    raise exception 'Quest not found';
  end if;

  is_scheduled := selected_task.is_active
    and scheduled_date_input >= selected_task.start_date
    and (selected_task.end_date is null or scheduled_date_input <= selected_task.end_date)
    and (
      (selected_schedule.frequency = 'once' and scheduled_date_input = selected_task.start_date)
      or selected_schedule.frequency = 'daily'
      or (selected_schedule.frequency = 'weekly' and weekday = any(selected_schedule.days_of_week))
    );
  if not is_scheduled then raise exception 'Quest is not scheduled for this date'; end if;

  if completed_input then
    insert into public.task_completions
      (user_id, task_id, scheduled_date, earned_points)
    values
      (current_user_id, task_id_input, scheduled_date_input, selected_task.points)
    on conflict (user_id, task_id, scheduled_date) do nothing;
  else
    delete from public.task_completions
      where user_id = current_user_id
        and task_id = task_id_input
        and scheduled_date = scheduled_date_input;
  end if;
end;
$$;

grant execute on function public.save_quest(uuid, text, text, text, smallint, date, date, text, smallint[], time) to authenticated;
grant execute on function public.set_quest_completion(uuid, date, boolean) to authenticated;
revoke all on function public.save_quest(uuid, text, text, text, smallint, date, date, text, smallint[], time) from anon;
revoke all on function public.set_quest_completion(uuid, date, boolean) from anon;
