import { DrinkForm } from "@/components/DrinkForm";
import { loadDrinkOr404 } from "@/lib/drinks-server";

// 記録(編集)。新規と同じフォーム
export default async function EditDrinkPage({ params }: PageProps<"/[kind]/[id]/edit">) {
  const { kind, id } = await params;
  const { drink, imageUrl } = await loadDrinkOr404(kind, id);
  return <DrinkForm kind={drink.kind} drink={drink} imageUrl={imageUrl} />;
}
