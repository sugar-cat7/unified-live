import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Select } from "./select";

const meta = {
  title: "UI/Select",
  component: Select,
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
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <>
        <option value="">Please select</option>
        <option value="option1">Option 1</option>
        <option value="option2">Option 2</option>
        <option value="option3">Option 3</option>
      </>
    ),
  },
};

export const WithSelected: Story = {
  args: {
    defaultValue: "option2",
    children: (
      <>
        <option value="option1">Option 1</option>
        <option value="option2">Option 2</option>
        <option value="option3">Option 3</option>
      </>
    ),
  },
};

export const ErrorState: Story = {
  args: {
    variant: "error",
    children: (
      <>
        <option value="">Please select</option>
        <option value="option1">Option 1</option>
        <option value="option2">Option 2</option>
      </>
    ),
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: (
      <>
        <option value="">Please select</option>
        <option value="option1">Option 1</option>
      </>
    ),
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="w-72">
      <label
        htmlFor="prefecture-select"
        className="mb-2 block font-medium text-foreground-soft text-sm"
      >
        Prefecture
      </label>
      <Select id="prefecture-select">
        <option value="">Please select</option>
        <option value="tokyo">Tokyo</option>
        <option value="osaka">Osaka</option>
        <option value="kyoto">Kyoto</option>
        <option value="fukuoka">Fukuoka</option>
      </Select>
    </div>
  ),
};

export const ErrorWithMessage: Story = {
  render: () => (
    <div className="w-72">
      <label
        htmlFor="category-select"
        className="mb-2 block font-medium text-foreground-soft text-sm"
      >
        Category
      </label>
      <Select
        id="category-select"
        variant="error"
        aria-describedby="category-error"
      >
        <option value="">Please select</option>
        <option value="cat1">Category 1</option>
        <option value="cat2">Category 2</option>
      </Select>
      <p id="category-error" className="mt-1 text-rose-500 text-xs">
        Please select a category
      </p>
    </div>
  ),
};
