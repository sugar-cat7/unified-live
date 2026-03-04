"use client";

import { type CSSProperties, type ReactNode, useEffect, useRef } from "react";

type FadeInProps = {
  children: ReactNode;
  className?: string;
};

export const FadeIn = ({ children, className }: FadeInProps) => {
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

    const animation = element.animate(
      [
        { opacity: 0, transform: "translateY(-4px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      {
        duration: 300,
        easing: "ease-out",
        fill: "forwards",
      },
    );

    return () => animation.cancel();
  }, []);

  const initialStyle: CSSProperties = { opacity: 0 };

  return (
    <div ref={ref} className={className} style={initialStyle}>
      {children}
    </div>
  );
};
