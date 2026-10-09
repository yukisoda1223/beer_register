import { DrinkIcon } from "@/components/DrinkIcon";
import { LOGIN_ERRORS } from "@/lib/auth";
import { LoginButton } from "./LoginButton";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  const message = typeof error === "string" ? LOGIN_ERRORS[error] : undefined;

  return (
    <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col items-center justify-center gap-8 px-6">
      <div className="flex flex-col items-center gap-3">
        <div className="flex gap-2">
          <DrinkIcon type="lager" color="#E7B447" size={52} />
          <DrinkIcon type="sake" color="#829DA5" size={52} />
        </div>
        <h1 className="text-[24px] font-medium tracking-tight">Nomikurabe</h1>
        <p className="text-[13px] text-(--color-text-sub)">Your beer &amp; sake journal</p>
      </div>

      {message && (
        <p role="alert" className="w-full rounded-xl bg-red-50 px-4 py-3 text-[13px] text-(--color-danger)">
          {message}
        </p>
      )}

      <LoginButton />
    </main>
  );
}
