import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon-192.png", "icon-512.png"],
      manifest: {
        name: "طلبك — دليفري عقربا",
        short_name: "طلبك",
        description: "طلبك... لباب بيتك — تطبيق توصيل محلي لقرية عقربا",
        lang: "ar",
        dir: "rtl",
        theme_color: "#4B6B33",
        background_color: "#FBF8F1",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // يخزّن الواجهة (الشكل والتصميم) للعمل حتى مع ضعف الإنترنت
        // بيانات المحلات/الطلبات نفسها تبقى تُجلب من الخادم دائمًا لضمان دقتها
        globPatterns: ["**/*.{js,css,html,png,svg}"],
      },
    }),
  ],
  server: { port: 5173 },
});
