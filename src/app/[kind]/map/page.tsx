import { MapScreen } from "@/components/map/MapScreen";
import type { Kind } from "@/lib/kinds";

// 全画面マップ(仕様書 §7.2)
export default async function MapPage({ params }: PageProps<"/[kind]/map">) {
  const kind = (await params).kind as Kind;
  return <MapScreen kind={kind} />;
}
