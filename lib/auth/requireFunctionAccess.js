import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Ensures the current user has access to the given function_id.
 * Uses the same userfunctions table that controls menu visibility.
 * Call at the top of protected page components.
 * Redirects to /menu if the user lacks permission.
 *
 * @param {number} functionId - The function_id from public.functions
 */
export async function requireFunctionAccess(functionId) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { data: uf, error } = await supabase
    .from("userfunctions")
    .select("id")
    .eq("user_id", user.id)
    .eq("function_id", Number(functionId))
    .maybeSingle();

  if (error || !uf) {
    redirect("/menu");
  }
}
