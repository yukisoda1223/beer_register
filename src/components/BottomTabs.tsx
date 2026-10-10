"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Kind } from "@/lib/kinds";

const TABS = [
  { screen: "report", label: "Report", icon: ReportIcon },
  { screen: "list", label: "List", icon: ListIcon },
  { screen: "learn", label: "Learn", icon: LearnIcon },
] as const;

// 下タブ。レポート・一覧の画面だけに出す(記録・下書き・地図の画面では隠す)
export function BottomTabs({ kind }: { kind: Kind }) {
  const pathname = usePathname();
  const screen = pathname.split("/")[2];
  if (!TABS.some((t) => t.screen === screen)) return null;

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-[480px] border-t border-(--color-border) bg-(--color-surface) pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid grid-cols-3">
        {TABS.map(({ screen: s, label, icon: Icon }) => {
          const active = s === screen;
          return (
            <li key={s}>
              <Link
                href={`/${kind}/${s}`}
                aria-current={active ? "page" : undefined}
                className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] tracking-wide ${
                  active ? "font-medium text-(--color-text)" : "text-(--color-text-sub)"
                }`}
              >
                {active && (
                  <span className="absolute inset-x-8 top-0 h-0.5 rounded-b-full bg-(--color-primary)" />
                )}
                <Icon active={active} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function ReportIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="12" width="4" height="8" rx="1" fill={active ? "var(--color-primary)" : "currentColor"} />
      <rect x="10" y="7" width="4" height="13" rx="1" fill={active ? "var(--color-secondary)" : "currentColor"} />
      <rect x="16" y="4" width="4" height="16" rx="1" fill={active ? "var(--color-primary)" : "currentColor"} />
    </svg>
  );
}

function ListIcon({ active }: { active: boolean }) {
  const c = active ? "var(--color-primary)" : "currentColor";
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      {[6, 12, 18].map((y) => (
        <g key={y}>
          <circle cx="5" cy={y} r="1.6" fill={c} />
          <rect x="9" y={y - 1.2} width="11" height="2.4" rx="1.2" fill="currentColor" />
        </g>
      ))}
    </svg>
  );
}

function LearnIcon({ active }: { active: boolean }) {
  const c = active ? "var(--color-primary)" : "currentColor";
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 5.5C6.5 4.5 9.5 4.5 12 6c2.5-1.5 5.5-1.5 8-.5V19c-2.5-1-5.5-1-8 .5C9.5 18 6.5 18 4 19z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M12 6v13.5" stroke={c} strokeWidth="1.6" />
    </svg>
  );
}
