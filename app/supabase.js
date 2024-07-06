import { createClient } from "@supabase/supabase-js";

const supabaseURL = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// export default createClient(supabaseURL, supabaseAnonKey);
const supabase = createClient(supabaseURL, supabaseAnonKey);
export default supabase;
