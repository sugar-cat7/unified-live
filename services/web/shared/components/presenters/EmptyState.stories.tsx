import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EmptyState } from "./EmptyState";

const meta = {
  title: "Presenters/EmptyState",
  component: EmptyState,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

const InboxIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </svg>
);

const MicIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" x2="12" y1="19" y2="22" />
  </svg>
);

const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

export const Default: Story = {
  args: {
    title: "No data available",
  },
};

export const WithDescription: Story = {
  args: {
    title: "No data yet",
    description: "Please create new data",
  },
};

export const WithIcon: Story = {
  args: {
    icon: <InboxIcon />,
    title: "No history",
    description: "History will appear here once you perform actions",
  },
};

export const WithAction: Story = {
  args: {
    icon: <MicIcon />,
    title: "Let's get started",
    description: "You can create a new task",
    actionLabel: "Get Started",
    actionHref: "/",
  },
};

export const WithButtonAction: Story = {
  args: {
    icon: <SearchIcon />,
    title: "No search results",
    description: "Try changing your search criteria",
    actionLabel: "Clear Criteria",
    onAction: () => alert("Criteria cleared"),
  },
};

export const NoData: Story = {
  args: {
    icon: <InboxIcon />,
    title: "No data yet",
    description: "Please create new data",
    actionLabel: "Get Started",
    actionHref: "/",
  },
};
