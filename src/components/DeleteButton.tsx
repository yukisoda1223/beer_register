"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { errorMessage } from "@/lib/drinks-db";
import type { Kind } from "@/lib/kinds";
import { deleteTasting } from "@/lib/save-drink";
import { createClient } from "@/lib/supabase/client";

// 「Delete」ボタン。押すと確認ダイアログを出し、Delete を押したときだけ記録と写真を消す
export function DeleteButton({
  kind,
  id,
  productId,
  name,
  imagePath,
}: {
  kind: Kind;
  id: string;
  productId: string;
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
      await deleteTasting(createClient(), { tastingId: id, productId, imagePath });
      router.push(`/${kind}/list?done=deleted`);
      router.refresh();
    } catch {
      setError(errorMessage("Couldn't delete. Please try again."));
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        disabled={deleting}
        onClick={() => setOpen(true)}
        className="min-h-10 rounded-full border border-(--color-border) px-5 text-[13px] text-(--color-danger) disabled:opacity-50"
      >
        {deleting ? "Deleting…" : "Delete"}
      </button>
      {error && (
        <p role="alert" className="text-[12px] text-(--color-danger)">
          {error}
        </p>
      )}
      <ConfirmDialog
        open={open}
        title="Delete this entry?"
        message={`“${name}” and its photo will be deleted. This can't be undone.`}
        onClose={() => setOpen(false)}
        actions={[
          { label: "Delete", variant: "danger", onClick: handleDelete },
          { label: "Cancel", onClick: () => setOpen(false) },
        ]}
      />
    </>
  );
}
