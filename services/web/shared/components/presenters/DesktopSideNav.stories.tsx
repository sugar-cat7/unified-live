import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DesktopSideNav } from "./DesktopSideNav";

const meta = {
  title: "Presenters/DesktopSideNav",
  component: DesktopSideNav,
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
        <div className="pl-56">
          <div className="p-6">
            <h1 className="font-semibold text-xl">Main Content Area</h1>
            <p className="mt-2 text-muted-foreground">
              The desktop side nav is displayed on the left
            </p>
          </div>
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof DesktopSideNav>;

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
