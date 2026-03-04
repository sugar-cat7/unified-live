# Design Principles

## Overview

Design principles are the foundation for delivering consistent and excellent user experiences. This guideline defines a 22-item checklist centered on usability.

## Usability Checklist

### Information Architecture (Items 1-5)

Items related to understanding user workflows and information structure.

| # | Check Item | Description |
|---|-----------|-------------|
| 1 | Explain understanding of user workflows | Have you clearly understood and reflected in the design what workflows users perform? |
| 2 | Explain the conceptual model | Does the system convey its structure and behavior to users in an understandable way? |
| 3 | Are the properties and actions associated with objects sufficient for user workflow completion? | Are the necessary information and operations available? |
| 4 | Explain the view navigation relationships | Are screen transitions logical and predictable? |
| 5 | Is the main navigation categorized according to user interests? | Does the navigation structure match the user's mental model? |

### Design Patterns (Items 6-16)

Items related to visual design and interaction.

| # | Check Item | Related Guideline |
|---|-----------|-------------------|
| 6 | Does it follow the "Eye Flow Guidance" standards? | [Design Patterns - Eye Flow Guidance](./design-patterns.md#eye-flow-guidance) |
| 7 | Does it follow the "Visual Grouping" standards? | [Design Patterns - Visual Grouping](./design-patterns.md#visual-grouping) |
| 8 | Does it follow the "Page Layout" standards? | [Design Patterns - Page Layout](./design-patterns.md#page-layout) |
| 9 | Does it follow the "Spacing" standards? | [CSS Guidelines](../css.md) |
| 10 | Does it follow the "Mobile Layout" standards? | [Design Patterns - Mobile Layout](./design-patterns.md#mobile-layout) |
| 11 | Does user notification/feedback follow the "Feedback" standards? | [Design Patterns - Feedback](./design-patterns.md#feedback) |
| 12 | For UIs with modes, does it follow the "Modal UI" standards? | [Design Patterns - Modal UI](./design-patterns.md#modal-ui) |
| 13 | When using tables, does it follow appropriate standards? | Data table design principles |
| 14 | Do input elements follow the "Default Values" standards? | Appropriate default value configuration |
| 15 | Have error states been considered, with feedback designed to help recover from and resolve errors? | [Content Guidelines - Error Messages](./content-guidelines.md) |
| 16 | Is there an intermediate confirmation step before dangerous or irreversible operations (including deletion)? | Display of confirmation dialogs |

### Components (Items 17-18)

Items related to UI component usage.

| # | Check Item | Description |
|---|-----------|-------------|
| 17 | Are there custom components that duplicate existing UI library components? | Leverage existing components and avoid custom implementations |
| 18 | Are components being used according to their intended standards? | Usage aligned with component design intent |

### Writing (Items 19-21)

Items related to text content.

| # | Check Item | Related Guideline |
|---|-----------|-------------------|
| 19 | Are names aligned with core concepts? | [Writing Guidelines](./writing.md) |
| 20 | Do navigation flows and action names follow the standards? | Consistent button labels and link text |
| 21 | Do error messages follow the standards? | [Content Guidelines](./content-guidelines.md) |

### Accessibility (Item 22)

| # | Check Item | Related Guideline |
|---|-----------|-------------------|
| 22 | Has the accessibility quick checklist been used for verification? | [Accessibility Guidelines](./accessibility.md) |

## Item Details

### 1. Understanding User Workflows

Clarify the following before design:

- Who is the user (persona)
- What problem are they trying to solve
- In what context will they use it
- What defines success

### 2. Conceptual Model

Design a mental model for users to understand the system:

- What are the system's main "objects"
- What are the relationships between objects
- What operations are possible

### 6. Eye Flow Guidance

Design the flow of the user's gaze:

- F-pattern (screens with vertically stacked information)
- Z-pattern (first-visit or minimal-scroll screens)
- Eye movement from large elements to small elements

### 15. Error State Considerations

When an error occurs:

1. **Incident**: Explain what happened
2. **Cause**: Explain why it happened
3. **Resolution**: Explain how to resolve it

### 16. Intermediate Confirmation

Display a confirmation dialog before dangerous operations:

```tsx
// Delete confirmation example
<Dialog>
  <DialogTitle>Delete this article?</DialogTitle>
  <DialogDescription>
    This action cannot be undone. The article "{title}" will be permanently deleted.
  </DialogDescription>
  <DialogActions>
    <Button variant="ghost" onClick={onCancel}>Cancel</Button>
    <Button variant="destructive" onClick={onConfirm}>Delete</Button>
  </DialogActions>
</Dialog>
```

## When to Use the Checklist

| Timing | Purpose |
|--------|---------|
| At design start | Confirm design direction |
| At design completion | Check for gaps and omissions |
| During review | Ensure quality |
| Before release | Final verification |

## References

- [Design Patterns](./design-patterns.md)
- [Accessibility Checklist](./accessibility.md)
- [Content Guidelines](./content-guidelines.md)
- [Design Review](./design-review.md)
