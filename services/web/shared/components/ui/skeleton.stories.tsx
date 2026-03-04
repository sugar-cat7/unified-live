import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Skeleton, SkeletonText } from "./skeleton";

const meta = {
  title: "UI/Skeleton",
  component: Skeleton,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    className: "h-10 w-40",
  },
};

export const Circle: Story = {
  args: {
    className: "h-12 w-12 rounded-full",
  },
};

export const Card: Story = {
  args: {
    className: "h-32 w-64 rounded-xl",
  },
};

export const Text: Story = {
  render: () => <SkeletonText lines={3} />,
};

export const TextSingleLine: Story = {
  render: () => <SkeletonText lines={1} />,
};

export const TextFiveLines: Story = {
  render: () => <SkeletonText lines={5} />,
};

export const CardWithContent: Story = {
  render: () => (
    <div className="w-72 rounded-xl border border-border p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <div className="mt-4">
        <SkeletonText lines={2} />
      </div>
    </div>
  ),
};

export const ListItems: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  ),
};
