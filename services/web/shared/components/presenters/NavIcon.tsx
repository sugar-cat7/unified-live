import type { LucideProps } from "lucide-react";
import {
  BarChart3,
  Clock,
  CreditCard,
  FileText,
  Home,
  Mail,
  Pencil,
  Play,
  Settings,
  Sparkles,
  Target,
} from "lucide-react";

type IconName =
  | "home"
  | "play"
  | "clock"
  | "credit-card"
  | "settings"
  | "file-text"
  | "sparkles"
  | "pencil"
  | "target"
  | "chart-bar"
  | "mail";

const iconComponents = {
  home: Home,
  play: Play,
  clock: Clock,
  "credit-card": CreditCard,
  settings: Settings,
  "file-text": FileText,
  sparkles: Sparkles,
  pencil: Pencil,
  target: Target,
  "chart-bar": BarChart3,
  mail: Mail,
} as const;

type Props = LucideProps & {
  name: IconName;
};

export const NavIcon = ({ name, ...props }: Props) => {
  const Icon = iconComponents[name];
  return <Icon aria-hidden="true" {...props} />;
};

export type { IconName };
