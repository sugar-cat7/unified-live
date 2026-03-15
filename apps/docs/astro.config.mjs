import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import starlightTypeDoc, { typeDocSidebarGroup } from "starlight-typedoc";

export default defineConfig({
  site: "https://sugar-cat7.github.io",
  base: "/unified-live",
  integrations: [
    starlight({
      title: "unified-live",
      defaultLocale: "root",
      locales: {
        root: { label: "English", lang: "en" },
        ja: { label: "日本語" },
      },
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/sugar-cat7/unified-live",
        },
      ],
      plugins: [
        starlightTypeDoc({
          entryPoints: ["../../packages/core/src/index.ts"],
          tsconfig: "../../packages/core/tsconfig.typedoc.json",
          sidebar: {
            label: "API Reference",
            collapsed: true,
          },
          typeDoc: {
            skipErrorChecking: true,
            excludeInternal: true,
            categorizeByGroup: true,
            categoryOrder: [
              "Client",
              "Types",
              "Errors",
              "Plugins",
              "Plugin Development",
              "Observability",
              "*",
            ],
          },
        }),
      ],
      sidebar: [
        {
          label: "Introduction",
          translations: { ja: "はじめに" },
          items: [{ slug: "overview" }, { slug: "getting-started" }],
        },
        {
          label: "Guides",
          translations: { ja: "ガイド" },
          items: [
            { slug: "core-concepts" },
            { slug: "platform-plugins" },
            { slug: "error-handling" },
            { slug: "pagination" },
            { slug: "advanced" },
          ],
        },
        {
          label: "Cookbook",
          translations: { ja: "クックブック" },
          items: [{ slug: "examples" }, { slug: "creating-a-plugin" }],
        },
        typeDocSidebarGroup,
      ],
    }),
  ],
});
