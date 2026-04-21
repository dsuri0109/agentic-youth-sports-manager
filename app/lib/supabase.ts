import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Use in client components */
export function createBrowserSupabase() {
  return createBrowserClient(URL, ANON);
}

/** Use in API routes and server components (no cookie auth) */
export function createServerSupabase() {
  return createClient(URL, ANON);
}
