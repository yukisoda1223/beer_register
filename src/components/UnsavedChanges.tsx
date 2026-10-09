"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";

// 入力中のフォームが登録する「まだ保存していない変更があるか」「保存する方法」
export type LeaveGuard = {
  isDirty: () => boolean;
  // 保存できたら true。保存した後の画面移動はしない(移動先は呼び出し側が決める)
  save: () => Promise<boolean>;
  // 下書きなら "Save draft"、保存済みの記録なら "Save"
  saveLabel: string;
  title: string;
};

type Ctx = {
  setGuard: (guard: LeaveGuard | null) => void;
  // 画面を離れるとき(戻る・種類の切替)に呼ぶ。変更があれば確認してから go を実行する
  requestLeave: (go: () => void) => void;
};

const UnsavedChangesContext = createContext<Ctx>({ setGuard: () => {}, requestLeave: (go) => go() });

export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const guardRef = useRef<LeaveGuard | null>(null);
  const [pending, setPending] = useState<{ go: () => void; guard: LeaveGuard } | null>(null);
  const [saving, setSaving] = useState(false);

  const setGuard = useCallback((guard: LeaveGuard | null) => {
    guardRef.current = guard;
  }, []);

  const requestLeave = useCallback((go: () => void) => {
    const guard = guardRef.current;
    if (guard?.isDirty()) setPending({ go, guard });
    else go();
  }, []);

  function leave() {
    const go = pending?.go;
    guardRef.current = null;
    setPending(null);
    go?.();
  }

  return (
    <UnsavedChangesContext.Provider value={{ setGuard, requestLeave }}>
      {children}
      <ConfirmDialog
        open={pending != null}
        title={pending?.guard.title ?? ""}
        onClose={() => !saving && setPending(null)}
        actions={[
          {
            label: saving ? "Saving…" : (pending?.guard.saveLabel ?? "Save"),
            variant: "primary",
            onClick: async () => {
              if (!pending || saving) return;
              setSaving(true);
              const ok = await pending.guard.save();
              setSaving(false);
              if (ok) leave();
              else setPending(null);
            },
          },
          { label: "Discard", variant: "danger", onClick: leave },
          { label: "Cancel", onClick: () => setPending(null) },
        ]}
      />
    </UnsavedChangesContext.Provider>
  );
}

export function useLeaveGuard() {
  return useContext(UnsavedChangesContext);
}

// フォーム側で使う: 変更があるあいだ、画面を離れるときに確認を出す
export function useRegisterLeaveGuard(guard: LeaveGuard, dirty: boolean) {
  const { setGuard } = useLeaveGuard();
  const latest = useRef(guard);
  useEffect(() => {
    latest.current = guard;
  });

  useEffect(() => {
    setGuard({
      isDirty: () => latest.current.isDirty(),
      save: () => latest.current.save(),
      get saveLabel() {
        return latest.current.saveLabel;
      },
      get title() {
        return latest.current.title;
      },
    });
    return () => setGuard(null);
  }, [setGuard]);

  // タブを閉じる・再読み込みするときはブラウザの確認を出す
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);
}
