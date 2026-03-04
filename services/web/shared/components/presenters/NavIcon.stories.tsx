import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { type IconName, NavIcon } from "./NavIcon";

const allIcons: IconName[] = [
  "home",
  "play",
  "clock",
  "credit-card",
  "settings",
  "file-text",
];

const meta = {
  title: "Presenters/NavIcon",
  component: NavIcon,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    name: {
      control: "select",
      options: allIcons,
    },
  },
} satisfies Meta<typeof NavIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Home: Story = {
  args: {
    name: "home",
  },
};

export const Play: Story = {
  args: {
    name: "play",
  },
};

export const Clock: Story = {
  args: {
    name: "clock",
  },
};

export const CreditCard: Story = {
  args: {
    name: "credit-card",
  },
};

export const Settings: Story = {
  args: {
    name: "settings",
  },
};

export const FileText: Story = {
  args: {
    name: "file-text",
  },
};

export const AllIcons: StoryObj = {
  render: () => (
    <div className="flex flex-wrap gap-6">
      {allIcons.map((name) => (
        <div key={name} className="flex flex-col items-center gap-2">
          <NavIcon name={name} className="h-6 w-6" />
          <span className="text-muted-foreground text-xs">{name}</span>
        </div>
      ))}
    </div>
  ),
};

export const Sizes: StoryObj = {
  render: () => (
    <div className="flex items-end gap-4">
      <div className="flex flex-col items-center gap-2">
        <NavIcon name="home" className="h-4 w-4" />
        <span className="text-muted-foreground text-xs">16px</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <NavIcon name="home" className="h-5 w-5" />
        <span className="text-muted-foreground text-xs">20px</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <NavIcon name="home" className="h-6 w-6" />
        <span className="text-muted-foreground text-xs">24px</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <NavIcon name="home" className="h-8 w-8" />
        <span className="text-muted-foreground text-xs">32px</span>
      </div>
    </div>
  ),
};

export const Colors: StoryObj = {
  render: () => (
    <div className="flex gap-4">
      <NavIcon name="home" className="h-6 w-6 text-foreground" />
      <NavIcon name="home" className="h-6 w-6 text-primary" />
      <NavIcon name="home" className="h-6 w-6 text-muted-foreground" />
      <NavIcon name="home" className="h-6 w-6 text-accent" />
    </div>
  ),
};
