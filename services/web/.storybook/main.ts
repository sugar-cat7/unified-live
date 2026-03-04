import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/nextjs-vite";
import tailwindcss from "@tailwindcss/vite";

function getAbsolutePath(value: string): string {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}

const config: StorybookConfig = {
  stories: [
    "../shared/components/**/*.stories.@(ts|tsx)",
    "../features/**/components/**/*.stories.@(ts|tsx)",
  ],
  addons: [
    getAbsolutePath("@chromatic-com/storybook"),
    getAbsolutePath("@storybook/addon-a11y"),
    getAbsolutePath("@storybook/addon-docs"),
  ],
  framework: getAbsolutePath("@storybook/nextjs-vite"),
  staticDirs: ["../public"],
  async viteFinal(config) {
    config.plugins = config.plugins || [];
    config.plugins.push(tailwindcss());

    // Allow access from any host (needed for Tailscale/network access)
    config.server = {
      ...config.server,
      host: true,
      allowedHosts: "all",
    };

    return config;
  },
};

export default config;
