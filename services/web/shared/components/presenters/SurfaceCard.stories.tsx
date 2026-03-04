import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SurfaceCard } from "./SurfaceCard";

const meta = {
  title: "Presenters/SurfaceCard",
  component: SurfaceCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    tone: {
      control: "select",
      options: ["glass", "soft", "ink"],
    },
  },
} satisfies Meta<typeof SurfaceCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Glass: Story = {
  args: {
    tone: "glass",
    children: (
      <>
        <h3 className="font-semibold text-lg">Glass Card</h3>
        <p className="mt-2 text-muted-foreground text-sm">
          A card with a translucent background and blur effect.
        </p>
      </>
    ),
  },
};

export const Soft: Story = {
  args: {
    tone: "soft",
    children: (
      <>
        <h3 className="font-semibold text-lg">Soft Card</h3>
        <p className="mt-2 text-muted-foreground text-sm">
          A card with a soft background color.
        </p>
      </>
    ),
  },
};

export const Ink: Story = {
  args: {
    tone: "ink",
    children: (
      <>
        <h3 className="font-semibold text-lg">Ink Card</h3>
        <p className="mt-2 text-sm opacity-80">
          A card with a dark background and white text.
        </p>
      </>
    ),
  },
};

export const AllTones: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <SurfaceCard tone="glass" className="w-80">
        <h3 className="font-semibold">Glass</h3>
        <p className="mt-1 text-muted-foreground text-sm">
          Translucent design
        </p>
      </SurfaceCard>
      <SurfaceCard tone="soft" className="w-80">
        <h3 className="font-semibold">Soft</h3>
        <p className="mt-1 text-muted-foreground text-sm">
          Gentle impression design
        </p>
      </SurfaceCard>
      <SurfaceCard tone="ink" className="w-80">
        <h3 className="font-semibold">Ink</h3>
        <p className="mt-1 text-sm opacity-80">For emphasized information</p>
      </SurfaceCard>
    </div>
  ),
};

export const WithContent: Story = {
  args: {
    tone: "glass",
    className: "w-80",
    children: (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-mint px-2 py-0.5 font-semibold text-2xs text-foreground-soft">
            Self-Introduction
          </span>
          <span className="text-muted-foreground text-xs">2024/01/10</span>
        </div>
        <div>
          <p className="font-medium text-primary text-xs">Strengths</p>
          <p className="text-sm">Clear self-presentation was demonstrated</p>
        </div>
        <div>
          <p className="font-medium text-amber-600 text-xs">Areas for Improvement</p>
          <p className="text-sm">Include more specific examples</p>
        </div>
      </div>
    ),
  },
};
