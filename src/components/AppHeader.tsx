import { KindToggle } from "@/components/KindToggle";
import type { Kind } from "@/lib/kinds";

export function AppHeader({ kind }: { kind: Kind }) {
  return (
    <header className="sticky top-0 z-10 flex justify-center bg-(--color-bg)/95 px-4 pt-[max(env(safe-area-inset-top),12px)] pb-3 backdrop-blur">
      <KindToggle kind={kind} />
    </header>
  );
}
