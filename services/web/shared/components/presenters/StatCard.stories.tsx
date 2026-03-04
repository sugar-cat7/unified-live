import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { StatCard } from "./StatCard";

const meta = {
  title: "Presenters/StatCard",
  component: StatCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof StatCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const PlayIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const TrendingUpIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const ClockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export const Default: Story = {
  args: {
    label: "Count",
    value: 12,
  },
};

export const WithIcon: Story = {
  args: {
    label: "Count",
    value: 12,
    icon: <PlayIcon />,
  },
};

export const WithDescription: Story = {
  args: {
    label: "Count",
    value: 12,
    icon: <PlayIcon />,
    description: "Cumulative",
  },
};

export const StringValue: Story = {
  args: {
    label: "Average",
    value: "85 pts",
    icon: <TrendingUpIcon />,
    description: "Average of last 10",
  },
};

export const TimeValue: Story = {
  args: {
    label: "Processing Time",
    value: "2h 30m",
    icon: <ClockIcon />,
    description: "This month total",
  },
};

export const Grid: Story = {
  args: {
    label: "Count",
    value: 12,
  },
  render: () => (
    <div className="grid w-[600px] gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard
        label="Count"
        value={12}
        icon={<PlayIcon />}
        description="Cumulative"
      />
      <StatCard
        label="Average"
        value="85 pts"
        icon={<TrendingUpIcon />}
        description="Last 10"
      />
      <StatCard
        label="Processing Time"
        value="2h 30m"
        icon={<ClockIcon />}
        description="This month"
      />
    </div>
  ),
};
