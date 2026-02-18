import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PermissionsContent } from "./PermissionsContent";

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

async function getAllUsers() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("users")
      .select("id, email")
      .order("email", { ascending: true });
    if (error) throw error;
    return { data: data ?? [], error: null };
  } catch (err) {
    return { data: null, error: err?.message ?? String(err) };
  }
}

async function getFunctions() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("functions")
      .select("id, descr")
      .order("descr", { ascending: true });
    if (error) throw error;
    return { data: data ?? [], error: null };
  } catch (err) {
    return { data: null, error: err?.message ?? String(err) };
  }
}

async function getUserFunctions(userId) {
  "use server";
  try {
    if (userId == null || userId === "") {
      return { data: [], error: null };
    }
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_permissions_by_user", {
      p_user_id: String(userId),
    });
    if (error) throw error;
    const rows = Array.isArray(data) ? data : [];
    const ids = rows.map((row) => row.id != null ? row.id : row.function_id).filter((id) => id != null);
    return { data: ids, error: null };
  } catch (err) {
    return { data: null, error: err?.message ?? String(err) };
  }
}

async function setUserFunction(userId, functionId, add) {
  "use server";
  try {
    if (userId == null || userId === "" || functionId == null) {
      return { error: "Invalid user or function." };
    }
    const supabase = await createClient();
    if (add) {
      const { error } = await supabase.from("userfunctions").insert({
        user_id: userId,
        function_id: functionId,
      });
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("userfunctions")
        .delete()
        .eq("user_id", userId)
        .eq("function_id", functionId);
      if (error) throw error;
    }
    return { error: null };
  } catch (err) {
    return { error: err?.message ?? String(err) };
  }
}

async function saveUserPermissions(userId, functionIds) {
  "use server";
  try {
    if (userId == null || userId === "") {
      return { error: "Please select a user." };
    }
    const supabase = await createClient();
    const { error: deleteError } = await supabase
      .from("userfunctions")
      .delete()
      .eq("user_id", userId);
    if (deleteError) throw deleteError;
    const ids = Array.isArray(functionIds) ? functionIds : [];
    if (ids.length > 0) {
      const rows = ids.map((function_id) => ({
        user_id: userId,
        function_id: Number(function_id) || function_id,
      }));
      const { error: insertError } = await supabase.from("userfunctions").insert(rows);
      if (insertError) throw insertError;
    }
    return { error: null };
  } catch (err) {
    return { error: err?.message ?? String(err) };
  }
}

export default async function PermissionsPage() {
  const { data: users, error: usersError } = await getAllUsers();
  const { data: functionsList, error: functionsError } = await getFunctions();
  const usersList = users ?? [];
  const functions = functionsList ?? [];

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-zinc-950">
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <Link
          href="/menu"
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← Menu
        </Link>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Permissions
        </h1>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            Sign out
          </button>
        </form>
      </header>
      <main className="flex-1 overflow-auto p-6">
        {usersError && (
          <p className="mb-4 text-sm text-amber-600 dark:text-amber-400">
            {usersError}
          </p>
        )}
        {functionsError && (
          <p className="mb-4 text-sm text-amber-600 dark:text-amber-400">
            {functionsError}
          </p>
        )}
        <PermissionsContent
          users={usersList}
          functions={functions}
          getUserFunctions={getUserFunctions}
          setUserFunction={setUserFunction}
          saveUserPermissions={saveUserPermissions}
        />
      </main>
    </div>
  );
}
