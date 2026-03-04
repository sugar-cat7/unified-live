import type { ReactNode } from "react";

import { Badge } from "../ui/badge";

type Tone = "coral" | "beige" | "amber" | "ink" | "mint" | "sky" | "lilac";

type Props = {
  tone?: Tone;
  children: ReactNode;
};

export const TagPill = ({ tone = "beige", children }: Props) => {
  return <Badge tone={tone}>{children}</Badge>;
};
