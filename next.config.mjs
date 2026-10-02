/** @type {import('next').NextConfig} */
/* Статична збірка для звичайного хостингу (lh.pl):
   `next build` створює папку out/ з готовими HTML/CSS/JS — її і заливаємо на сервер. */
const nextConfig = {
  output: "export",
  trailingSlash: true,          // /blog/stattia/ → /blog/stattia/index.html (так розуміє Apache)
  images: { unoptimized: true },
};
export default nextConfig;
