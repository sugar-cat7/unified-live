# Icon Guidelines

## Overview

Icons are important visual elements that enhance UI visibility and operability. This guideline establishes the policy of using Lucide React as the primary source, with original icons created as needed.

## Basic Policy

Icons are primarily selected from **Lucide React**. If no suitable icon is available, create an original one that matches the visual tone and manner.

### Using Lucide React

| Item | Recommendation |
|------|---------------|
| Package | lucide-react |
| Style | Outline (default) as the standard |
| Size | 16px to 24px as the standard based on usage |
| Color | Follow semantic colors |

```tsx
// Lucide React usage example
import { Search, User, Menu } from "lucide-react";

<Search className="w-4 h-4 text-text-secondary" />
<User className="w-5 h-5 text-text-primary" />
```

### Using the NavIcon Component

In the project, icons are used through the `NavIcon` component. This maintains icon name consistency while leveraging Lucide React icons.

```tsx
import { NavIcon } from "@/shared/components/presenters/NavIcon";

// For navigation
<NavIcon name="home" className="w-5 h-5" />
<NavIcon name="settings" className="w-5 h-5 text-muted-foreground" />
```

#### Available Icon Names

| Name | Description | Lucide Icon |
|------|-------------|-------------|
| home | Home | Home |
| play | Play | Play |
| clock | Clock | Clock |
| credit-card | Credit card | CreditCard |
| settings | Settings | Settings |
| file-text | File | FileText |
| sparkles | Sparkles | Sparkles |
| pencil | Pencil | Pencil |
| target | Target | Target |
| chart-bar | Bar chart | BarChart3 |

## Original Icon Creation Rules

When no appropriate icon exists in Lucide React, follow these rules to create original icons.

### Artboard and Size

| Item | Value |
|------|-------|
| Artboard size | 128 x 128 px |
| Padding (top/bottom/left/right) | 8px each |
| Actual creation area | 112 x 112 px |

```
+---------------------+
|        8px          |
|   +-----------+     |
|8px|  112x112  |8px  |
|   |  Creation |     |
|   |   Area    |     |
|   +-----------+     |
|        8px          |
+---------------------+
     128x128px
```

### Stroke and Border Radius

| Item | Base Value | Notes |
|------|-----------|-------|
| Stroke width | 10px | Adjustable |
| Border radius (standard) | 8px radius | - |
| Border radius (small) | 4px radius | Can be combined with standard |

### Creating Solid Style

When creating a solid style, a spacing of **6px** between adjacent colors is recommended.

## Style Variations

Following Lucide React specifications, outline style is the standard.

### Outline (Default)

- Icons composed of strokes only
- Recommended for normal state use
- strokeWidth: 2 (default)

### Customization

```tsx
// Change stroke width
<Search strokeWidth={1.5} className="w-5 h-5" />

// Change color
<User className="w-5 h-5 text-primary" />
```

## Creation Workflow

1. **Search Lucide React**: First look for an appropriate icon in Lucide React
2. **Duplicate master data**: When creating originals, always duplicate the master data before starting work
3. **Align to keyline**: Design aligned to the keyline for visual consistency
4. **Request review**: After completion, request a review from the design team

## Icon Usage Patterns

### Navigation

```tsx
// Header navigation
import { NavIcon } from "@/shared/components/presenters/NavIcon";

<nav className="flex items-center gap-4">
  <NavIcon name="home" className="w-5 h-5" />
  <NavIcon name="clock" className="w-5 h-5" />
  <NavIcon name="settings" className="w-5 h-5" />
</nav>
```

### Buttons

```tsx
// Button with icon
import { Plus } from "lucide-react";

<button className="flex items-center gap-2">
  <Plus className="w-4 h-4" />
  <span>Add</span>
</button>
```

### Status Display

```tsx
// Status icon
import { CheckCircle } from "lucide-react";

<span className="flex items-center gap-1">
  <CheckCircle className="w-4 h-4 text-success" />
  <span>Complete</span>
</span>
```

## Size Guide

| Usage | Size | Class |
|-------|------|-------|
| Inline text | 14px | `w-3.5 h-3.5` |
| Small button/badge | 16px | `w-4 h-4` |
| Standard button | 18px | `w-4.5 h-4.5` |
| Navigation | 20px | `w-5 h-5` |
| Large heading/hero | 24px | `w-6 h-6` |

## Prohibited Practices

- Deforming or modifying Lucide React icons
- Creating original icons with a significantly different style from Lucide React
- Conveying information solely through icons (use text labels alongside)
- Excessive use of icons for decorative purposes

## References

- [Lucide Icons](https://lucide.dev/icons/)
- [Lucide React Documentation](https://lucide.dev/guide/packages/lucide-react)
- [Accessibility Guidelines](./accessibility.md)
