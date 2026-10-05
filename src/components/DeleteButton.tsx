"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { deleteDrink, errorMessage } from "@/lib/drinks-db";
import type { Kind } from "@/lib/kinds";
import { createClient } from "@/lib/supabase/client";

// 「削除」ボタン。押すと確認ダイアログを出し、「削除する」を押したときだけ記録と写真を消す
export function DeleteButton({
  kind,
  id,
  name,
  imagePath,
}: {
  kind: Kind;
  id: string;
  name: string;
  imagePath: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setOpen(false);
    setDeleting(true);
    try {
      await deleteDrink(createClient(), id, imagePath);
      router.push(`/${kind}/list?done=deleted`);
      router.refresh();
    } catch {
      setError(errorMessage("削除できませんでした。もう一度お試しください。"));
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        disabled={deleting}
        onClick={() => setOpen(true)}
        className="min-h-11 flex-1 rounded-xl border-2 border-red-700 bg-(--color-surface) font-bold text-red-700 disabled:opacity-60"
      >
        {deleting ? "削除しています…" : "削除"}
      </button>
      {error && (
        <p role="alert" className="text-[13px] text-red-700">
          {error}
        </p>
      )}
      <ConfirmDialog
        open={open}
        title="この記録を削除しますか?"
        message={`「${name}」を削除します。写真も一緒に消え、元に戻せません。`}
        onClose={() => setOpen(false)}
        actions={[
          { label: "削除する", variant: "danger", onClick: handleDelete },
          { label: "キャンセル", onClick: () => setOpen(false) },
        ]}
      />
    </>
  );
}
