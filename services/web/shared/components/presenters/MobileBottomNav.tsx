"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "../../lib/navigation";
import { NavIcon } from "./NavIcon";

export const MobileBottomNav = () => {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      className="fixed right-0 bottom-0 left-0 z-50 border-border border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden"
    >
      <ul className="flex h-18 items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-size-touch-target min-w-size-touch-target flex-col items-center justify-center gap-1 px-4 py-3 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <NavIcon
                  name={item.icon}
                  className="h-5 w-5"
                  aria-hidden="true"
                />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
