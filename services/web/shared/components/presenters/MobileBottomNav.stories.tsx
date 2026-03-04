import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MobileBottomNav } from "./MobileBottomNav";

const meta = {
  title: "Presenters/MobileBottomNav",
  component: MobileBottomNav,
  parameters: {
    layout: "fullscreen",
    viewport: {
      defaultViewport: "mobile1",
    },
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
      <div className="relative min-h-screen bg-background pb-16 md:hidden">
        <div className="p-4">
          <h1 className="font-semibold text-lg">Main Content Area</h1>
          <p className="mt-2 text-muted-foreground text-sm">
            The mobile bottom nav is displayed at the bottom of the screen
          </p>
        </div>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MobileBottomNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const HomeActive: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/",
      },
    },
  },
};

export const DashboardActive: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/dashboard",
      },
    },
  },
};

export const ItemsActive: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/items",
      },
    },
  },
};

export const SettingsActive: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/settings",
      },
    },
  },
};
