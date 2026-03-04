"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "../../lib/navigation";
import { NavIcon } from "./NavIcon";

export const DesktopSideNav = () => {
  const pathname = usePathname();

  return (
    <aside className="fixed top-0 left-0 z-40 hidden h-screen w-56 border-border border-r bg-background md:block">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center border-border border-b px-6">
          <Link
            href="/"
            className="font-bold text-lg text-primary"
            aria-label="Return to home"
          >
            App
          </Link>
        </div>
        <nav aria-label="Main navigation" className="flex-1 px-3 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
      </div>
    </aside>
  );
};
