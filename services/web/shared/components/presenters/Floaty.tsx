"use client";

import { type ReactNode, useEffect, useRef } from "react";

type FloatyProps = {
  children: ReactNode;
  className?: string;
};

export const Floaty = ({ children, className }: FloatyProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) return;

    const animation = element.animate(
      [
        { transform: "translateY(0)" },
        { transform: "translateY(-10px)" },
        { transform: "translateY(0)" },
      ],
      {
        duration: 8000,
        easing: "ease-in-out",
        iterations: Number.POSITIVE_INFINITY,
      },
    );

    return () => animation.cancel();
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
};
