import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Input } from "./input";

const meta = {
  title: "UI/Input",
  component: Input,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "error"],
    },
    disabled: {
      control: "boolean",
    },
    type: {
      control: "select",
      options: ["text", "email", "password", "number", "tel"],
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: "Enter text...",
  },
};

export const WithValue: Story = {
  args: {
    value: "Entered text",
    onChange: () => {},
  },
};

export const ErrorState: Story = {
  args: {
    variant: "error",
    placeholder: "Error state input",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: "Disabled input",
  },
};

export const Email: Story = {
  args: {
    type: "email",
    placeholder: "example@email.com",
  },
};

export const Password: Story = {
  args: {
    type: "password",
    placeholder: "Enter password",
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="w-72">
      <label
        htmlFor="name-input"
        className="mb-2 block font-medium text-foreground-soft text-sm"
      >
        Name
      </label>
      <Input id="name-input" placeholder="John Doe" />
    </div>
  ),
};

export const ErrorWithMessage: Story = {
  render: () => (
    <div className="w-72">
      <label
        htmlFor="email-input"
        className="mb-2 block font-medium text-foreground-soft text-sm"
      >
        Email Address
      </label>
      <Input
        id="email-input"
        variant="error"
        placeholder="example@email.com"
        aria-describedby="email-error"
      />
      <p id="email-error" className="mt-1 text-rose-500 text-xs">
        Please enter a valid email address
      </p>
    </div>
  ),
};
