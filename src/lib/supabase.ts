import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

const url = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !publishableKey) {
  throw new Error(
    "กรุณากำหนด VITE_SUPABASE_URL และ VITE_SUPABASE_PUBLISHABLE_KEY",
  );
}

export const supabase = createClient<Database>(url, publishableKey);
