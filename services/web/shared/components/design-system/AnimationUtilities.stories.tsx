import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FadeIn } from "../presenters/FadeIn";
import { FadeUp } from "../presenters/FadeUp";
import { Floaty } from "../presenters/Floaty";

const AnimationShowcase = () => (
  <div className="flex flex-col gap-8 p-6">
    <section>
      <h2 className="mb-4 font-semibold text-lg">FadeUp Component</h2>
      <div className="flex flex-wrap gap-4">
        <FadeUp className="rounded-2xl border border-border bg-card/80 px-4 py-3 text-foreground-soft text-sm">
          <code>&lt;FadeUp&gt;</code>
          <p className="mt-1 text-muted-foreground text-sm">0.8s ease-out</p>
        </FadeUp>
        <FadeUp
          duration="slow"
          delay={300}
          className="rounded-2xl border border-border bg-card/80 px-4 py-3 text-foreground-soft text-sm"
        >
          <code>&lt;FadeUp duration="slow"&gt;</code>
          <p className="mt-1 text-muted-foreground text-sm">1.2s ease-out</p>
        </FadeUp>
      </div>
    </section>

    <section>
      <h2 className="mb-4 font-semibold text-lg">Floaty Component</h2>
      <div className="flex items-center gap-4">
        <Floaty className="inline-block rounded-2xl border border-border bg-card/80 px-4 py-3 text-foreground-soft text-sm">
          <code>&lt;Floaty&gt;</code>
          <p className="mt-1 text-muted-foreground text-sm">
            8s ease-in-out infinite
          </p>
        </Floaty>
      </div>
    </section>

    <section>
      <h2 className="mb-4 font-semibold text-lg">FadeIn Component</h2>
      <div className="flex items-center gap-4">
        <FadeIn className="rounded-2xl border border-border bg-card/80 px-4 py-3 text-foreground-soft text-sm">
          <code>&lt;FadeIn&gt;</code>
          <p className="mt-1 text-muted-foreground text-sm">0.3s ease-out</p>
        </FadeIn>
      </div>
    </section>
  </div>
);

const meta = {
  title: "Design System/Animation Utilities",
  component: AnimationShowcase,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof AnimationShowcase>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllAnimations: Story = {};

export const FadeUpStory: Story = {
  name: "FadeUp",
  render: () => (
    <div className="flex gap-4 p-6">
      <FadeUp className="rounded-2xl border border-border bg-card/80 px-4 py-3 text-foreground-soft text-sm">
        <p>FadeUp (default)</p>
        <p className="text-muted-foreground text-sm">Standard (0.8s)</p>
      </FadeUp>
      <FadeUp
        duration="slow"
        delay={200}
        className="rounded-2xl border border-border bg-card/80 px-4 py-3 text-foreground-soft text-sm"
      >
        <p>FadeUp (slow)</p>
        <p className="text-muted-foreground text-sm">Slow (1.2s)</p>
      </FadeUp>
    </div>
  ),
};

export const FloatyStory: Story = {
  name: "Floaty",
  render: () => (
    <div className="p-6">
      <Floaty className="inline-block rounded-xl bg-card p-4 shadow-[var(--shadow-card)]">
        <p>Floating element</p>
        <p className="text-muted-foreground text-sm">Gentle up/down movement</p>
      </Floaty>
    </div>
  ),
};

export const FadeInStory: Story = {
  name: "FadeIn",
  render: () => (
    <div className="p-6">
      <FadeIn className="rounded-2xl border border-border bg-card/80 px-4 py-3 text-foreground-soft text-sm">
        <p>Fade in with slight upward motion</p>
      </FadeIn>
    </div>
  ),
};
