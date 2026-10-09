import { KindSettingsList } from "@/components/KindSettingsList";
import { loadKindSettings } from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";

// ヘッダーの「+」から開く、表示するお酒の種類と並び順の設定
export default async function KindSettingsPage() {
  const settings = await loadKindSettings(await createClient());
  return (
    <div className="flex flex-col gap-3">
      <div>
        <h1 className="text-[20px] font-medium tracking-tight">Drink types</h1>
        <p className="mt-1 text-[13px] text-(--color-text-sub)">Checked types appear in the header. Drag ≡ to change the order.</p>
      </div>
      <KindSettingsList initial={settings} />
    </div>
  );
}
