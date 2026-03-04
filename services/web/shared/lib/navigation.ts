import type { IconName } from "../components/presenters/NavIcon";

export type NavItem = {
  icon: IconName;
  label: string;
  href: string;
};

export const navItems: NavItem[] = [{ icon: "home", label: "Home", href: "/" }];
