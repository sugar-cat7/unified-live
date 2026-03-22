import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import starlightTypeDoc, { typeDocSidebarGroup } from "starlight-typedoc";

const siteUrl = "https://sugar-cat7.github.io";
const basePath = "/unified-live";
const fullUrl = `${siteUrl}${basePath}`;

export default defineConfig({
  site: siteUrl,
  base: basePath,
  integrations: [
    starlight({
      title: "unified-live",
      lastUpdated: true,
      editLink: {
        baseUrl: "https://github.com/sugar-cat7/unified-live/edit/main/apps/docs/",
      },
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
      head: [
        // OG image
        {
          tag: "meta",
          attrs: {
            property: "og:image",
            content: `${fullUrl}/og-image.png`,
          },
        },
        {
          tag: "meta",
          attrs: { property: "og:image:width", content: "1200" },
        },
        {
          tag: "meta",
          attrs: { property: "og:image:height", content: "630" },
        },
        {
          tag: "meta",
          attrs: {
            property: "og:image:alt",
            content: "unified-live — Unified TypeScript SDK for Live Streaming APIs",
          },
        },
        // Twitter image
        {
          tag: "meta",
          attrs: {
            name: "twitter:image",
            content: `${fullUrl}/og-image.png`,
          },
        },
        {
          tag: "meta",
          attrs: {
            name: "twitter:image:alt",
            content: "unified-live — Unified TypeScript SDK for Live Streaming APIs",
          },
        },
        // JSON-LD: SoftwareApplication
        {
          tag: "script",
          attrs: { type: "application/ld+json" },
          content: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareSourceCode",
            name: "unified-live",
            description:
              "A TypeScript SDK providing a unified interface for YouTube, Twitch, and TwitCasting live streaming APIs",
            url: "https://github.com/sugar-cat7/unified-live",
            codeRepository: "https://github.com/sugar-cat7/unified-live",
            programmingLanguage: "TypeScript",
            runtimePlatform: "Node.js",
            license: "https://opensource.org/licenses/MIT",
            author: {
              "@type": "Person",
              name: "sugar-cat7",
              url: "https://github.com/sugar-cat7",
            },
          }),
        },
        // JSON-LD: WebSite
        {
          tag: "script",
          attrs: { type: "application/ld+json" },
          content: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "unified-live",
            url: fullUrl,
          }),
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
