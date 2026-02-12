import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MenuTree } from "./MenuTree";

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export default function MenuPage() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-zinc-950">
      <header className="relative flex shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Menu
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
      <div className="flex flex-1">
      <aside
        className="flex w-56 shrink-0 flex-col border-r border-zinc-200 bg-[#00008B] dark:border-zinc-700 dark:bg-[#00008B]"
        aria-label="Navigation"
      >
        <div className="p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-blue-200">
            Navigation
          </h2>
        </div>
        <MenuTree />
      </aside>
      <main className="relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden px-8">
        <div className="relative h-full w-full">
          <Image
            src="/MT%20Menu.png"
            alt="MT Menu"
            fill
            className="object-contain"
            sizes="100vw"
            priority
          />
        </div>
      </main>
      </div>
    </div>
  );
}
