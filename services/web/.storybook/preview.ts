import type { Preview } from "@storybook/nextjs-vite";
import { initialize, mswLoader } from "msw-storybook-addon";
import "../app/globals.css";
import { handlers } from "./mocks/handlers";

// MSW initialization
initialize({
  onUnhandledRequest: "bypass",
});

const preview: Preview = {
  parameters: {
    nextjs: {
      appDirectory: true,
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "cream",
      values: [
        { name: "cream", value: "oklch(0.96 0.02 85)" },
        { name: "white", value: "#ffffff" },
        { name: "dark", value: "oklch(0.18 0.03 280)" },
      ],
    },
    msw: {
      handlers,
    },
  },
  loaders: [mswLoader],
};

export default preview;
