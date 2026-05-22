import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://gickpnyixefuzunqxelt.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpY2twbnlpeGVmdXp1bnF4ZWx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwMTMzNDUsImV4cCI6MjA5MTU4OTM0NX0.D-r3IBkFIOMeaqk5j-8mnhTHfgZM4Yp1av4E7x2t-Wo";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});