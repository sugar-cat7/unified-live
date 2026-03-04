"use client";

import { type CSSProperties, type ReactNode, useEffect, useRef } from "react";

type FadeUpProps = {
  children: ReactNode;
  className?: string;
  duration?: "default" | "slow";
  delay?: number;
};

export const FadeUp = ({
  children,
  className,
  duration = "default",
  delay = 0,
}: FadeUpProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      element.style.opacity = "1";
      return;
    }

    const durationMs = duration === "slow" ? 1200 : 800;

    const animation = element.animate(
      [
        { opacity: 0, transform: "translateY(16px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      {
        duration: durationMs,
        delay,
        easing: "cubic-bezier(0.2, 0.7, 0.2, 1)",
        fill: "forwards",
      },
    );

    return () => animation.cancel();
  }, [duration, delay]);

  const initialStyle: CSSProperties = { opacity: 0 };

  return (
    <div ref={ref} className={className} style={initialStyle}>
      {children}
    </div>
  );
};
