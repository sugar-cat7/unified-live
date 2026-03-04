import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { GlobalNav } from "./GlobalNav";

const meta = {
  title: "Presenters/GlobalNav",
  component: GlobalNav,
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/",
      },
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="relative min-h-screen bg-background">
        <Story />
        <div className="pb-16 md:pb-0 md:pl-56">
          <div className="p-6">
            <h1 className="font-semibold text-xl">Main Content Area</h1>
            <p className="mt-2 text-muted-foreground">
              GlobalNav includes DesktopSideNav and MobileBottomNav.
              <br />
              Displayed on the left side on desktop and at the bottom on mobile.
            </p>
          </div>
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof GlobalNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Desktop: Story = {
  parameters: {
    viewport: {
      defaultViewport: "desktop",
    },
    nextjs: {
      navigation: {
        pathname: "/",
      },
    },
  },
};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
    nextjs: {
      navigation: {
        pathname: "/",
      },
    },
  },
};

export const Tablet: Story = {
  parameters: {
    viewport: {
      defaultViewport: "tablet",
    },
    nextjs: {
      navigation: {
        pathname: "/",
      },
    },
  },
};
