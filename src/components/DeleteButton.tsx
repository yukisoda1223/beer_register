"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";

// 「削除」ボタン。押すと確認ダイアログを出し、「削除する」を押したときだけ消す
export function DeleteButton({ name, listHref }: { name: string; listHref: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  function handleDelete() {
    // TODO(M3): データベースから記録と写真を消す。いまはサンプルなので一覧へ戻るだけ
    dialogRef.current?.close();
    router.push(listHref);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="min-h-11 flex-1 rounded-xl border-2 border-red-700 bg-(--color-surface) font-bold text-red-700"
      >
        削除
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="delete-title"
        className="m-auto w-[min(90vw,360px)] rounded-xl bg-(--color-surface) p-5 text-(--color-text) shadow-xl backdrop:bg-black/40"
      >
        <h2 id="delete-title" className="text-lg font-bold">
          この記録を削除しますか?
        </h2>
        <p className="mt-2 text-(--color-text-sub)">
          「{name}」を削除します。写真も一緒に消え、元に戻せません。
        </p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            autoFocus
            onClick={() => dialogRef.current?.close()}
            className="min-h-11 flex-1 rounded-xl border border-(--color-border) font-bold"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="min-h-11 flex-1 rounded-xl bg-red-700 font-bold text-white"
          >
            削除する
          </button>
        </div>
      </dialog>
    </>
  );
}
