import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ActionButton } from "./ActionButton";

const meta = {
  title: "Presenters/ActionButton",
  component: ActionButton,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "ghost", "destructive"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    disabled: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof ActionButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AsButton: Story = {
  args: {
    children: "Click",
    variant: "primary",
  },
};

export const AsLink: Story = {
  args: {
    children: "Go to Page",
    href: "/example",
    variant: "primary",
  },
};

export const SecondaryButton: Story = {
  args: {
    children: "Cancel",
    variant: "secondary",
  },
};

export const GhostLink: Story = {
  args: {
    children: "View Details",
    href: "/details",
    variant: "ghost",
  },
};

export const SmallButton: Story = {
  args: {
    children: "Small Button",
    size: "sm",
  },
};

export const LargeLink: Story = {
  args: {
    children: "Large Link",
    href: "/large",
    size: "lg",
  },
};

export const DisabledButton: Story = {
  args: {
    children: "Disabled Button",
    disabled: true,
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        <ActionButton variant="primary">Primary</ActionButton>
        <ActionButton variant="secondary">Secondary</ActionButton>
        <ActionButton variant="ghost">Ghost</ActionButton>
        <ActionButton variant="destructive">Destructive</ActionButton>
      </div>
      <div className="flex gap-4">
        <ActionButton href="/link1" variant="primary">
          Link Primary
        </ActionButton>
        <ActionButton href="/link2" variant="secondary">
          Link Secondary
        </ActionButton>
      </div>
    </div>
  ),
};
