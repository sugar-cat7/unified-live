import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  site: "https://sugar-cat7.github.io",
  base: "/unified-live",
  integrations: [
    starlight({
      title: "unified-live",
      defaultLocale: "en",
      locales: {
        en: { label: "English" },
        ja: { label: "日本語" },
      },
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/sugar-cat7/unified-live",
        },
      ],
      sidebar: [
        {
          label: "Tutorial",
          translations: { ja: "チュートリアル" },
          autogenerate: { directory: "." },
        },
      ],
    }),
  ],
});
