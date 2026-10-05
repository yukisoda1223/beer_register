import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEFAULT_KIND, LAST_KIND_COOKIE, isKind } from "@/lib/kinds";

// 最後に見ていた種類のレポートへ移る(初回はビール)
export default async function Home() {
  const last = (await cookies()).get(LAST_KIND_COOKIE)?.value;
  redirect(`/${isKind(last) ? last : DEFAULT_KIND}/report`);
}
