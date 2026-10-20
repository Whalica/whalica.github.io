import { defineConfig } from "astro/config";
import { unified } from "@astrojs/markdown-remark";
import sitemap from "@astrojs/sitemap";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
const site = process.env.SITE_URL || "https://whalica.github.io";
export default defineConfig({
  site,
  base: process.env.BASE_PATH || "/",
  output: "static",
  vite: { resolve: { preserveSymlinks: true } },
  integrations: site
    ? [
        sitemap({
          filter: (url) =>
            !["/demo/", "/search/", "/404"].some((path) =>
              new URL(url).pathname.includes(path),
            ),
        }),
      ]
    : [],
  markdown: {
    shikiConfig: {
      themes: { light: "github-light", dark: "github-dark" },
      wrap: false,
    },
    processor: unified({
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex],
    }),
  },
});
