import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TagPill } from "./TagPill";

const meta = {
  title: "Presenters/TagPill",
  component: TagPill,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    tone: {
      control: "select",
      options: ["coral", "beige", "amber", "ink"],
    },
  },
} satisfies Meta<typeof TagPill>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Tag",
  },
};

export const Coral: Story = {
  args: {
    children: "Recommended",
    tone: "coral",
  },
};

export const Beige: Story = {
  args: {
    children: "Info",
    tone: "beige",
  },
};

export const Amber: Story = {
  args: {
    children: "Warning",
    tone: "amber",
  },
};

export const Ink: Story = {
  args: {
    children: "New Feature",
    tone: "ink",
  },
};

export const AllTones: Story = {
  args: {
    children: "Tag",
  },
  render: () => (
    <div className="flex flex-wrap gap-2">
      <TagPill tone="coral">Recommended</TagPill>
      <TagPill tone="beige">Info</TagPill>
      <TagPill tone="amber">Warning</TagPill>
      <TagPill tone="ink">New Feature</TagPill>
    </div>
  ),
};

export const Categories: Story = {
  args: {
    children: "Category",
  },
  render: () => (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm">Category List</h3>
      <div className="flex flex-wrap gap-2">
        <TagPill tone="coral">Important</TagPill>
        <TagPill tone="beige">Normal</TagPill>
        <TagPill tone="amber">Caution</TagPill>
        <TagPill tone="ink">Done</TagPill>
      </div>
    </div>
  ),
};
