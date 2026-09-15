"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Award,
  BookOpenCheck,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { fetchJson } from "@/lib/client-api";

const navigation = [
  { href: "/dashboard", label: "Command hall", icon: LayoutDashboard },
  { href: "/quests", label: "Quest journal", icon: BookOpenCheck },
  { href: "/certifications", label: "Trials", icon: GraduationCap },
  { href: "/mentor", label: "The Guide", icon: MessageCircle },
];

export function AppShell({
  displayName,
  role,
  children,
}: {
  displayName: string;
  role: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetchJson("/api/auth/logout", {
      method: "POST",
      body: JSON.stringify({}),
    });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="rpg-shell min-h-screen lg:grid lg:grid-cols-[280px_1fr]">
      <aside
        className="rpg-sidebar border-b p-4 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r lg:p-6"
      >
        <div className="flex items-center justify-between lg:block">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span
              className="rpg-brand-mark grid h-12 w-12 place-items-center"
            >
              <ShieldCheck aria-hidden="true" size={24} />
            </span>
            <span>
              <span className="rpg-brand-title block leading-tight">LevelUp</span>
              <span className="muted block text-[0.68rem] font-bold uppercase tracking-[0.24em]">
                Architect
              </span>
            </span>
          </Link>
          <span
            className="rounded-full px-2.5 py-1 text-xs font-semibold capitalize lg:hidden"
            style={{
              background: "var(--cp-accent-soft)",
              color: "var(--cp-accent)",
            }}
          >
            {role.replace("_", " ")}
          </span>
        </div>

        <p className="rpg-side-label mt-10">Adventurer&apos;s menu</p>
        <nav
          className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-2"
          aria-label="Primary navigation"
        >
          {navigation.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="rpg-nav-item flex min-w-max items-center gap-3 px-3 py-3 text-xs font-bold uppercase tracking-[0.09em] transition"
                style={
                  active
                    ? {
                        background: "var(--cp-accent-soft)",
                        color: "var(--cp-accent)",
                      }
                    : { color: "var(--cp-text-muted)" }
                }
                aria-current={active ? "page" : undefined}
              >
                <Icon size={18} aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 hidden border-t pt-5 lg:block">
          <p className="rpg-side-label mb-3">Character profile</p>
          <div className="rpg-player-card">
          <div className="flex items-center gap-3">
            <span
              className="rpg-player-avatar grid h-10 w-10 place-items-center font-black"
            >
              {displayName.slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{displayName}</p>
              <p className="muted truncate text-[0.65rem] font-bold uppercase tracking-wider">
                {role.replace("_", " ")}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="mt-4 flex w-full items-center gap-2 border-t px-1 pt-3 text-xs font-bold uppercase tracking-wider"
            style={{ color: "var(--cp-text-muted)" }}
            onClick={logout}
          >
            <LogOut size={17} aria-hidden="true" />
            Sign out
          </button>
          </div>
        </div>
      </aside>

      <main className="min-w-0">
        <div className="mx-auto max-w-[1480px] p-4 sm:p-6 lg:p-8">{children}</div>
        <footer className="mx-auto flex max-w-[1480px] items-center gap-2 px-4 pb-8 text-xs sm:px-6 lg:px-8">
          <Award size={14} aria-hidden="true" />
          <span className="muted font-semibold uppercase tracking-wider">
            Campaign progress saved locally · External verification not enabled
          </span>
        </footer>
      </main>
    </div>
  );
}
