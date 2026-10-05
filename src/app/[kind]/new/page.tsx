import { DrinkForm } from "@/components/DrinkForm";
import type { Kind } from "@/lib/kinds";

// 記録(新規)
export default async function NewDrinkPage({ params }: PageProps<"/[kind]/new">) {
  const kind = (await params).kind as Kind;
  return <DrinkForm kind={kind} />;
}
