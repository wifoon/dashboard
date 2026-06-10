import { supabase } from "./supabase";

const getCurrentUser = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Brak autoryzacji");
  return user;
};

// ==========================================
// TODOS API (Zadania)
// ==========================================
export const todosApi = {
  fetchTodos: async (dateStr) => {
    const user = await getCurrentUser();
    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", dateStr)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data;
  },

  createTodo: async ({ text, date, isRollover = false }) => {
    const user = await getCurrentUser();
    const { data, error } = await supabase
      .from("todos")
      .insert([
        {
          user_id: user.id,
          text,
          date,
          is_rollover: isRollover,
          done: false,
          queued: false,
        },
      ])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateTodo: async ({ id, updates }) => {
    const { data, error } = await supabase
      .from("todos")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteTodo: async (id) => {
    const { error } = await supabase.from("todos").delete().eq("id", id);
    if (error) throw error;
    return id;
  },

  runRollover: async (activeDate) => {
    const user = await getCurrentUser();
    const { data: undoneTodos, error: fetchError } = await supabase
      .from("todos")
      .select("*")
      .lt("date", activeDate)
      .eq("done", false)
      .eq("user_id", user.id);

    if (fetchError) throw fetchError;
    if (!undoneTodos || undoneTodos.length === 0) return;

    const oldIds = undoneTodos.map((t) => t.id);
    const { error: updateError } = await supabase
      .from("todos")
      .update({ date: activeDate, is_rollover: true })
      .in("id", oldIds);

    if (updateError) throw updateError;
  },
};

// ==========================================
// NOTES API (Notatki)
// ==========================================
export const notesApi = {
  fetchNotes: async () => {
    const user = await getCurrentUser();
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", user.id)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  createNote: async (noteData) => {
    const user = await getCurrentUser();
    const { data, error } = await supabase
      .from("notes")
      .insert([{ user_id: user.id, ...noteData }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateNote: async ({ id, updates }) => {
    const { data, error } = await supabase
      .from("notes")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteNote: async (id) => {
    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (error) throw error;
    return id;
  },
};

// ==========================================
// CALENDAR API (Kalendarz)
// ==========================================
export const calendarApi = {
  fetchTags: async () => {
    const user = await getCurrentUser();
    const { data, error } = await supabase
      .from("calendar_tags")
      .select("*")
      .eq("user_id", user.id);
    if (error) throw error;
    return data;
  },

  createTag: async (tagData) => {
    const user = await getCurrentUser();
    const { data, error } = await supabase
      .from("calendar_tags")
      .insert([{ user_id: user.id, ...tagData }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteTag: async (id) => {
    const { error } = await supabase
      .from("calendar_tags")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return id;
  },

  fetchEvents: async () => {
    const user = await getCurrentUser();
    const { data, error } = await supabase
      .from("calendar_events")
      .select("*")
      .eq("user_id", user.id);
    if (error) throw error;
    return data;
  },

  createEvent: async (eventData) => {
    const user = await getCurrentUser();
    const { data, error } = await supabase
      .from("calendar_events")
      .insert([{ user_id: user.id, ...eventData }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateEvent: async ({ id, updates }) => {
    const { data, error } = await supabase
      .from("calendar_events")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteEvent: async (id) => {
    const { error } = await supabase
      .from("calendar_events")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return id;
  },
};

// ==========================================
// GYM API (Trening) - Aktualizacja
// ==========================================
export const gymApi = {
  fetchGymState: async () => {
    const user = await getCurrentUser();

    const [daysRes, exercisesRes, logsRes, weightsRes, settingsRes] =
      await Promise.all([
        supabase
          .from("gym_days")
          .select("*")
          .eq("user_id", user.id)
          .order("order_index"),
        supabase.from("gym_exercises").select("*").eq("user_id", user.id),
        supabase
          .from("gym_logs")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: true }),
        supabase
          .from("gym_weight_history")
          .select("*")
          .eq("user_id", user.id)
          .order("date_key", { ascending: true }),
        supabase
          .from("user_settings")
          .select("gym_units")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

    const logsGrouped = {};
    if (logsRes.data) {
      logsRes.data.forEach((log) => {
        if (!logsGrouped[log.exercise_id]) logsGrouped[log.exercise_id] = [];
        logsGrouped[log.exercise_id].push({
          id: log.id,
          weight: Number(log.weight),
          reps: log.reps,
          date: log.date,
        });
      });
    }

    if (
      (daysRes.data?.length || 0) === 0 &&
      (exercisesRes.data?.length || 0) === 0
    ) {
      return {
        isNewUser: true,
        units: "kg",
        days: [],
        exercises: [],
        logs: {},
        weightEntries: [],
      };
    }

    return {
      units: settingsRes.data?.gym_units || "kg",
      days: daysRes.data || [],
      exercises: exercisesRes.data || [],
      logs: logsGrouped,
      weightEntries: weightsRes.data || [],
    };
  },

  seedDefaultPlan: async (defaultDays, defaultExercises) => {
    const user = await getCurrentUser();
    const daysToInsert = defaultDays.map((d, i) => ({
      user_id: user.id,
      name: d.name,
      order_index: i,
    }));
    const { data: insertedDays, error: dErr } = await supabase
      .from("gym_days")
      .insert(daysToInsert)
      .select();
    if (dErr) throw dErr;

    const exercisesToInsert = defaultExercises.map((ex) => {
      const targetDay = insertedDays.find(
        (d) => d.name.toLowerCase() === ex.day.toLowerCase(),
      );
      return {
        user_id: user.id,
        day_id: targetDay ? targetDay.id : null,
        name: ex.name,
        rep_min: ex.repMin,
        rep_max: ex.repMax,
        step: ex.step,
        start_weight: ex.startWeight,
        bw: ex.bw,
      };
    });

    const { error: exErr } = await supabase
      .from("gym_exercises")
      .insert(exercisesToInsert);
    if (exErr) throw exErr;
  },

  saveWeight: async ({ dateKey, weight }) => {
    const user = await getCurrentUser();
    const { data, error } = await supabase
      .from("gym_weight_history")
      .upsert(
        { user_id: user.id, date_key: dateKey, weight },
        { onConflict: "user_id, date_key" },
      )
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  logSet: async ({ exerciseId, weight, reps }) => {
    const user = await getCurrentUser();
    const { data, error } = await supabase
      .from("gym_logs")
      .insert([
        {
          user_id: user.id,
          exercise_id: exerciseId,
          weight,
          reps,
          date: new Date().toISOString(),
        },
      ])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateSet: async ({ id, weight, reps }) => {
    const { data, error } = await supabase
      .from("gym_logs")
      .update({ weight, reps })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteSet: async (id) => {
    const { error } = await supabase.from("gym_logs").delete().eq("id", id);
    if (error) throw error;
    return id;
  },

  createExercise: async (payload) => {
    const user = await getCurrentUser();
    const { data, error } = await supabase
      .from("gym_exercises")
      .insert([{ user_id: user.id, ...payload }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateExercise: async ({ id, updates }) => {
    const { data, error } = await supabase
      .from("gym_exercises")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteExercise: async (id) => {
    const { error } = await supabase
      .from("gym_exercises")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return id;
  },

  updateSettings: async ({ days, units }) => {
    const user = await getCurrentUser();
    for (const d of days) {
      if (d.id.startsWith("ex_") || d.id.length < 10) {
        await supabase
          .from("gym_days")
          .insert({ user_id: user.id, name: d.name });
      } else {
        await supabase.from("gym_days").update({ name: d.name }).eq("id", d.id);
      }
    }
    await supabase
      .from("user_settings")
      .upsert({ user_id: user.id, gym_units: units });
  },
};
