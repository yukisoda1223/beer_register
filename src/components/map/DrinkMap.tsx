"use client";

// Leaflet の地図(ブラウザでだけ動く。next/dynamic の ssr:false で読み込むこと)
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import { useEffect, useRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DrinkIcon } from "@/components/DrinkIcon";
import { iconOf } from "@/lib/drink";
import type { MapDrink } from "@/lib/map-data";

const JAPAN: L.LatLngTuple = [36.5, 137.5];

function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

// 1件ずつのピン: 写真(なければカテゴリのアイコン)と、その下に小さく商品名
function drinkIcon(drink: MapDrink, imageUrl: string | undefined) {
  const picture = imageUrl
    ? `<img src="${escapeHtml(imageUrl)}" alt="" />`
    : renderToStaticMarkup(<DrinkIcon {...iconOf(drink)} size={40} />);
  return L.divIcon({
    className: "drink-pin",
    html: `<div class="drink-pin__inner"><div class="drink-pin__photo">${picture}</div><div class="drink-pin__name">${escapeHtml(drink.name)}</div></div>`,
    iconSize: [96, 72],
    iconAnchor: [48, 24],
  });
}

// 近いピンをまとめた数字付きの丸
function clusterIcon(cluster: L.MarkerCluster) {
  const count = cluster.getChildCount();
  const size = count < 10 ? 40 : count < 100 ? 48 : 56;
  return L.divIcon({
    className: "drink-cluster",
    html: `<div class="drink-cluster__inner">${count}</div>`,
    iconSize: [size, size],
  });
}

export type DrinkMapProps = {
  drinks: MapDrink[];
  imageUrls: Record<string, string>;
  // mini: レポートの小さな窓(操作できない・小さな点で表示)
  variant: "full" | "mini";
  onSelect?: (drink: MapDrink) => void;
  // 数字が変わるたびに「全体を表示」する
  fitSignal?: number;
};

export default function DrinkMap({ drinks, imageUrls, variant, onSelect, fitSignal = 0 }: DrinkMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  });

  const mini = variant === "mini";

  // 地図を作る
  useEffect(() => {
    if (!containerRef.current) return;
    const map = L.map(containerRef.current, {
      center: JAPAN,
      zoom: 4,
      zoomControl: false,
      dragging: !mini,
      touchZoom: !mini,
      scrollWheelZoom: !mini,
      doubleClickZoom: !mini,
      boxZoom: !mini,
      keyboard: !mini,
      attributionControl: true,
    });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    // 拡大・縮小ボタンは上の案内と重ならないよう左下に置く
    if (!mini) L.control.zoom({ position: "bottomleft" }).addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [mini]);

  // ピンを置く
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    let cancelled = false;

    (async () => {
      let group: L.LayerGroup;
      if (mini) {
        // SVG の色には CSS 変数が使えないので、今のテーマ色を読んで渡す
        const primary = getComputedStyle(containerRef.current!).getPropertyValue("--color-primary").trim() || "#F28C28";
        group = L.layerGroup();
        drinks.forEach((d) =>
          L.circleMarker([d.lat, d.lng], {
            radius: 6,
            color: "#ffffff",
            weight: 2,
            fillColor: primary,
            fillOpacity: 1,
          }).addTo(group),
        );
      } else {
        // leaflet.markercluster はグローバルの L に機能を足すしくみなので、読み込む前に L を置く
        (window as unknown as { L: typeof L }).L = L;
        await import("leaflet.markercluster");
        if (cancelled) return;
        const cluster = L.markerClusterGroup({
          iconCreateFunction: clusterIcon,
          showCoverageOnHover: false,
          maxClusterRadius: 60,
          spiderfyOnMaxZoom: true,
        });
        drinks.forEach((d) => {
          const marker = L.marker([d.lat, d.lng], {
            icon: drinkIcon(d, d.image_path ? imageUrls[d.image_path] : undefined),
            title: d.name,
            keyboard: true,
          });
          marker.on("click", () => onSelectRef.current?.(d));
          cluster.addLayer(marker);
        });
        group = cluster;
      }
      layerRef.current?.remove();
      group.addTo(map);
      layerRef.current = group;
      fit(map, drinks, mini);
    })();

    return () => {
      cancelled = true;
    };
  }, [drinks, imageUrls, mini]);

  // 「全体を表示」
  useEffect(() => {
    if (mapRef.current && fitSignal > 0) fit(mapRef.current, drinks, mini);
    // fitSignal が変わったときだけ動かす
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitSignal]);

  return <div ref={containerRef} className="size-full" aria-label="Map" role="region" />;
}

function fit(map: L.Map, drinks: MapDrink[], mini: boolean) {
  if (drinks.length === 0) {
    map.setView(JAPAN, 4);
  } else if (drinks.length === 1) {
    map.setView([drinks[0].lat, drinks[0].lng], mini ? 6 : 10);
  } else {
    map.fitBounds(L.latLngBounds(drinks.map((d) => [d.lat, d.lng])), { padding: [32, 32], maxZoom: 12 });
  }
}
