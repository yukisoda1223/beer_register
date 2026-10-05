import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 同じ Wi-Fi のスマホから開発中の画面を開けるようにする(http://192.168.x.x:3000 など)
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*"],
};

export default nextConfig;
