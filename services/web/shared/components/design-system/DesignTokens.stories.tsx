import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const ColorSwatch = ({
  name,
  variable,
  className,
}: {
  name: string;
  variable: string;
  className?: string;
}) => (
  <div className="flex flex-col gap-1">
    <div
      className={`h-16 w-24 rounded-lg border border-border ${className ?? ""}`}
      style={{ backgroundColor: `var(${variable})` }}
    />
    <p className="font-medium text-xs">{name}</p>
    <code className="text-2xs text-muted-foreground">{variable}</code>
  </div>
);

const DesignTokensShowcase = () => (
  <div className="flex flex-col gap-10 p-6">
    <section>
      <h2 className="mb-2 font-semibold text-xl">Color Tokens</h2>
      <p className="mb-4 text-muted-foreground text-sm">
        3-layer token architecture: Base Palette → Semantic → Component
      </p>

      <h3 className="mb-3 font-medium text-lg">Core Colors</h3>
      <div className="mb-6 flex flex-wrap gap-4">
        <ColorSwatch
          name="Background"
          variable="--color-background"
          className="bg-background"
        />
        <ColorSwatch
          name="Foreground"
          variable="--color-foreground"
          className="bg-foreground"
        />
        <ColorSwatch name="Card" variable="--color-card" className="bg-card" />
        <ColorSwatch
          name="Muted"
          variable="--color-muted"
          className="bg-muted"
        />
        <ColorSwatch
          name="Border"
          variable="--color-border"
          className="bg-border"
        />
      </div>

      <h3 className="mb-3 font-medium text-lg">Accent Palette (Warm)</h3>
      <div className="mb-6 flex flex-wrap gap-4">
        <ColorSwatch
          name="Coral"
          variable="--color-coral"
          className="bg-coral"
        />
        <ColorSwatch
          name="Beige"
          variable="--color-beige"
          className="bg-beige"
        />
        <ColorSwatch
          name="Amber"
          variable="--color-amber"
          className="bg-amber"
        />
        <ColorSwatch
          name="Beige"
          variable="--color-beige"
          className="bg-beige"
        />
      </div>

      <h3 className="mb-3 font-medium text-lg">Semantic Colors</h3>
      <div className="mb-6 flex flex-wrap gap-4">
        <ColorSwatch
          name="Primary"
          variable="--color-primary"
          className="bg-primary"
        />
        <ColorSwatch
          name="Secondary"
          variable="--color-secondary"
          className="bg-secondary"
        />
        <ColorSwatch
          name="Accent"
          variable="--color-accent"
          className="bg-accent"
        />
        <ColorSwatch name="Info" variable="--color-info" className="bg-info" />
        <ColorSwatch
          name="Warning"
          variable="--color-warning"
          className="bg-warning"
        />
        <ColorSwatch
          name="Success"
          variable="--color-success"
          className="bg-success"
        />
      </div>

      <h3 className="mb-3 font-medium text-lg">Phase Colors</h3>
      <div className="mb-6 flex flex-wrap gap-4">
        <ColorSwatch
          name="Start"
          variable="--color-phase-start"
          className="bg-phase-start"
        />
        <ColorSwatch
          name="Progress"
          variable="--color-phase-progress"
          className="bg-phase-progress"
        />
        <ColorSwatch
          name="Review"
          variable="--color-phase-review"
          className="bg-phase-review"
        />
        <ColorSwatch
          name="Pending"
          variable="--color-phase-pending"
          className="bg-phase-pending"
        />
        <ColorSwatch
          name="Complete"
          variable="--color-phase-complete"
          className="bg-phase-complete"
        />
      </div>

      <h3 className="mb-3 font-medium text-lg">Status Colors</h3>
      <div className="flex flex-wrap gap-4">
        <ColorSwatch
          name="Speaking"
          variable="--color-status-speaking"
          className="bg-status-speaking"
        />
        <ColorSwatch
          name="Danger"
          variable="--color-status-danger"
          className="bg-status-danger"
        />
        <ColorSwatch
          name="Active"
          variable="--color-status-active"
          className="bg-status-active"
        />
      </div>
    </section>

    <section>
      <h2 className="mb-4 font-semibold text-xl">Radius Scale</h2>
      <div className="flex flex-wrap gap-6">
        {[
          { name: "sm", value: "0.5rem" },
          { name: "md", value: "0.875rem" },
          { name: "lg", value: "1.25rem" },
          { name: "xl", value: "1.5rem" },
          { name: "2xl", value: "2rem" },
        ].map(({ name, value }) => (
          <div key={name} className="flex flex-col items-center gap-2">
            <div
              className="h-16 w-16 border-2 border-foreground bg-card"
              style={{ borderRadius: `var(--radius-${name})` }}
            />
            <code className="text-sm">--radius-{name}</code>
            <span className="text-muted-foreground text-xs">{value}</span>
          </div>
        ))}
      </div>
    </section>

    <section>
      <h2 className="mb-4 font-semibold text-xl">Motion Tokens</h2>
      <div className="flex flex-wrap gap-6">
        <div className="flex flex-col gap-2">
          <p className="font-medium">Duration</p>
          <div className="flex gap-4">
            <div className="rounded-2xl border border-border bg-card/80 px-4 py-3 text-foreground-soft text-sm">
              <code>--duration-fast</code>
              <p className="text-muted-foreground text-sm">150ms</p>
            </div>
            <div className="rounded-2xl border border-border bg-card/80 px-4 py-3 text-foreground-soft text-sm">
              <code>--duration-md</code>
              <p className="text-muted-foreground text-sm">300ms</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <p className="font-medium">Easing</p>
          <div className="rounded-2xl border border-border bg-card/80 px-4 py-3 text-foreground-soft text-sm">
            <code>--ease-standard</code>
            <p className="text-muted-foreground text-sm">
              cubic-bezier(0.2, 0.7, 0.2, 1)
            </p>
          </div>
        </div>
      </div>
    </section>

    <section>
      <h2 className="mb-4 font-semibold text-xl">Typography</h2>
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl">Heading 1 (Shippori Mincho B1)</h1>
          <code className="text-muted-foreground text-sm">--font-display</code>
        </div>
        <div>
          <h2 className="text-2xl">Heading 2 (Shippori Mincho B1)</h2>
        </div>
        <div>
          <h3 className="text-xl">Heading 3 (Shippori Mincho B1)</h3>
        </div>
        <div>
          <p className="text-base">
            Body text (M PLUS Rounded 1c) - Soft and friendly impression
          </p>
          <code className="text-muted-foreground text-sm">--font-body</code>
        </div>
      </div>
    </section>
  </div>
);

const meta = {
  title: "Design System/Design Tokens",
  component: DesignTokensShowcase,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof DesignTokensShowcase>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {};

export const Colors: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-6">
      <section>
        <h3 className="mb-3 font-medium text-lg">Core Colors</h3>
        <div className="flex flex-wrap gap-4">
          <ColorSwatch name="Background" variable="--color-background" />
          <ColorSwatch name="Foreground" variable="--color-foreground" />
          <ColorSwatch name="Card" variable="--color-card" />
          <ColorSwatch name="Border" variable="--color-border" />
        </div>
      </section>
      <section>
        <h3 className="mb-3 font-medium text-lg">Accent Palette (Warm)</h3>
        <div className="flex flex-wrap gap-4">
          <ColorSwatch name="Coral" variable="--color-coral" />
          <ColorSwatch name="Beige" variable="--color-beige" />
          <ColorSwatch name="Amber" variable="--color-amber" />
        </div>
      </section>
    </div>
  ),
};

export const RadiusScale: Story = {
  render: () => (
    <div className="flex flex-wrap gap-6 p-6">
      {["sm", "md", "lg", "xl", "2xl"].map((size) => (
        <div key={size} className="flex flex-col items-center gap-2">
          <div
            className="h-20 w-20 border-2 border-foreground bg-card"
            style={{ borderRadius: `var(--radius-${size})` }}
          />
          <code className="text-sm">radius-{size}</code>
        </div>
      ))}
    </div>
  ),
};

export const MotionTokens: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex gap-4">
        <button
          type="button"
          className="rounded-lg bg-primary px-4 py-2 text-primary-foreground duration-fast ease-standard hover:opacity-80"
        >
          Fast (150ms)
        </button>
        <button
          type="button"
          className="rounded-lg bg-primary px-4 py-2 text-primary-foreground duration-md ease-standard hover:opacity-80"
        >
          Medium (300ms)
        </button>
      </div>
      <p className="text-muted-foreground text-sm">
        Hover over buttons to see transition timing
      </p>
    </div>
  ),
};

export const Typography: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-6">
      <h1 className="text-4xl">Heading 1 - Shippori Mincho B1</h1>
      <h2 className="text-3xl">Heading 2 - Shippori Mincho B1</h2>
      <h3 className="text-2xl">Heading 3 - Shippori Mincho B1</h3>
      <h4 className="text-xl">Heading 4 - Shippori Mincho B1</h4>
      <p className="text-base">Body text - M PLUS Rounded 1c</p>
      <p className="text-sm">Small text - M PLUS Rounded 1c</p>
      <p className="text-xs">Extra small text - M PLUS Rounded 1c</p>
    </div>
  ),
};
