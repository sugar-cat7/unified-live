import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Card } from "./card";

const meta = {
  title: "UI/Card",
  component: Card,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <div className="p-6">
        <h3 className="font-semibold text-lg">Card Title</h3>
        <p className="mt-2 text-muted-foreground text-sm">
          Card content goes here.
        </p>
      </div>
    ),
  },
};

export const WithPadding: Story = {
  args: {
    className: "p-6",
    children: (
      <>
        <h3 className="font-semibold text-lg">Card with Padding</h3>
        <p className="mt-2 text-muted-foreground text-sm">
          Padding can be added via className.
        </p>
      </>
    ),
  },
};

export const Interactive: Story = {
  args: {
    className: "p-6 cursor-pointer hover:shadow-card transition-shadow",
    children: (
      <>
        <h3 className="font-semibold text-lg">Interactive Card</h3>
        <p className="mt-2 text-muted-foreground text-sm">
          Shadow changes on hover.
        </p>
      </>
    ),
  },
};
