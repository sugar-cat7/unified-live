import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Badge } from "./badge";

const meta = {
  title: "UI/Badge",
  component: Badge,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    tone: {
      control: "select",
      options: ["coral", "beige", "amber", "ink", "mint", "sky", "lilac"],
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Coral: Story = {
  args: {
    children: "Label",
    tone: "coral",
  },
};

export const Beige: Story = {
  args: {
    children: "Label",
    tone: "beige",
  },
};

export const Amber: Story = {
  args: {
    children: "Label",
    tone: "amber",
  },
};

export const Ink: Story = {
  args: {
    children: "Label",
    tone: "ink",
  },
};

export const Mint: Story = {
  args: {
    children: "Label",
    tone: "mint",
  },
};

export const Sky: Story = {
  args: {
    children: "Label",
    tone: "sky",
  },
};

export const Lilac: Story = {
  args: {
    children: "Label",
    tone: "lilac",
  },
};

export const AllTones: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge tone="coral">Coral</Badge>
      <Badge tone="beige">Beige</Badge>
      <Badge tone="amber">Amber</Badge>
      <Badge tone="ink">Ink</Badge>
      <Badge tone="mint">Mint</Badge>
      <Badge tone="sky">Sky</Badge>
      <Badge tone="lilac">Lilac</Badge>
    </div>
  ),
};
