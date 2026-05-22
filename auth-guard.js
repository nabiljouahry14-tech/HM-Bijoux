import { supabase } from "./supabase.js";

export async function checkUserSuspension() {
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  // Not logged in
  if (userError || !user) {
    return {
      authenticated: false,
      suspended: false,
      reason: null,
      user: null
    };
  }

  // Check suspension status from profiles table
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("suspended, reason")
    .eq("id", user.id)
    .maybeSingle();
  
  console.log("USER ID:", user.id);
  console.log("PROFILE:", profile);

  // Fail-safe: if query fails, block access
  if (profileError) {
    console.error("Failed to check suspension:", profileError);

    await supabase.auth.signOut();

    return {
      authenticated: false,
      suspended: true,
      reason: "Unable to verify account status.",
      user: null
    };
  }

  // Suspended user
  if (profile?.suspended) {
    await supabase.auth.signOut();

    return {
      authenticated: true,
      suspended: true,
      reason: profile.reason || null,
      user
    };
  }

  // Active user
  return {
    authenticated: true,
    suspended: false,
    reason: null,
    user
  };
}