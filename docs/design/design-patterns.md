# Design Patterns

## Overview

Design patterns are proven solutions to recurring UI challenges. This guideline defines 8 major design patterns.

## Eye Flow Guidance

A pattern for designing the flow of the user's gaze and naturally guiding them to important information.

### Fundamental Principles

#### 1. Gaze moves from top to bottom

| Pattern | Characteristics | Application |
|---------|----------------|-------------|
| F-pattern | From top-left to right, repeating downward | List screens, settings screens, screens with vertically stacked information |
| Z-pattern | From top-left to top-right, bottom-left to bottom-right | Modals, login screens, first-visit or minimal-scroll screens |

#### 2. Gaze moves from large elements to small elements

Use heading levels in order and make inner spacing narrower than outer spacing to achieve hierarchical eye flow guidance.

### Implementation Considerations

- Recognize that these principles may not work when users have a clear purpose
- Be aware that multiple principles interact with each other
- Use headings and spacing to set "starting points and boundaries for eye movement"
- Consider the effect variations across devices and screen widths
- Combine with accessibility measures and do not rely solely on eye flow guidance

## Visual Grouping

A pattern for giving visual cohesion to multiple related elements.

### 3 Expression Methods

| Method | Characteristics | Use Case |
|--------|----------------|----------|
| Spacing | Reduces screen complexity | When elements can be arranged by degree of relevance |
| Rectangles | Clarifies group boundaries | When containing multiple sub-groups |
| Rules (lines) | Displays clear boundaries | Last resort when spacing/rectangles are insufficient |

### Hierarchy Structure

```
Section (heading + content)
└── Block (group within a section)
    └── Element
```

### Design Guidelines

- **Maintain consistency**: Apply the same grouping method to elements at the same hierarchy level
- **Watch hierarchy depth**: The deeper it gets, the harder it becomes to understand information relationships
- **Use TabBar/SideNav**: Use dedicated components for switching between multiple sections

## Page Layout

A pattern for designing the overall structure of a page.

### Basic Structure

```
┌─────────────────────────────┐
│         AppHeader           │
├─────────────────────────────┤
│ Container                   │
│ ┌─────────────────────────┐ │
│ │ Page title + Lead text  │ │
│ ├─────────────────────────┤ │
│ │                         │ │
│ │      Main content       │ │
│ │                         │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

### 6 Layout Types

| Type | Description | Usage |
|------|-------------|-------|
| Collection (Table/List) | List display of objects | Article list, user list |
| Single (1-Column) | Parallel information sections | Detail page, settings screen |
| Single (2-Column) | Primary/secondary information distinction | Profile, dashboard |
| Single (Custom View) | 2D interactive content | Map, chart |
| Side Navigation + Content | Extensive navigation | Settings, documentation |
| Collection + Single | List-detail pair display | Email, chat |

### Lead Text

Implement lead text in the header area so users can quickly understand the page's purpose.

```tsx
<header>
  <h1>Article List</h1>
  <p className="text-text-secondary">
    Manage published articles. Create new articles or edit existing ones.
  </p>
</header>
```

### Managing Page Length

Methods to avoid excessively long vertical scrolling:

- Collapse content with disclosure widgets
- Split pages using TabBar, SideNav, or SideMenu
- Reduce information density

## Mobile Layout

UI design patterns for smartphones.

### Basic Principles

| Item | Desktop | Mobile |
|------|---------|--------|
| Columns | Multi-column possible | Single column recommended |
| Scrolling | 2D possible (maps, etc.) | Vertical scrolling only recommended |
| Information volume | Detailed display possible | Curated information only |
| Interactions | Multiple operations possible | Limited to simple operations |

### Design Approach

```tsx
// Responsive vs Adaptive
// Responsive: Same elements, structure, data with layout changes only
// Adaptive: Structure, data, and presentation change based on screen width or device
```

### Implementation

```tsx
// Mobile detection
const { isMobile } = useEnvironment();

// Responsive classes
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* Cards */}
</div>
```

## Feedback

A pattern for designing responses to user actions.

### Basic Principles

| Principle | Description |
|-----------|-------------|
| Passive recognition | Users can understand results without actively checking |
| Proximity display | Display feedback near the element that was operated on |
| Screen reader support | Maintain appropriate reading order |

### Feedback Patterns

#### Form Input/Submission

```tsx
// Validation error
<FormControl error={!!errors.email}>
  <Label>Email address</Label>
  <Input {...register("email")} />
  {errors.email && <ErrorMessage>{errors.email.message}</ErrorMessage>}
</FormControl>
```

#### Processing State

```tsx
<Button loading={isSubmitting}>
  {isSubmitting ? "Submitting..." : "Submit"}
</Button>
```

#### Completion Notification

```tsx
// On success
<ResponseMessage status="success">
  Saved successfully
</ResponseMessage>

// On error
<ResponseMessage status="error">
  Failed to save. Please try again.
</ResponseMessage>
```

## Modal UI

A modal UI pattern for completing specific tasks.

### Use Cases

| Scenario | Example |
|----------|---------|
| Adding/editing objects | Article creation, profile editing |
| Sorting data | List sort settings |
| Importing/exporting data | CSV import/export |
| Confirming destructive actions | Delete confirmation |
| Complex sequential operations | Wizard |

### Implementation Patterns

| Pattern | Component | Usage |
|---------|-----------|-------|
| Modal dialog | Dialog | Small to medium forms |
| Full-page mode | FloatArea | When there is a large amount of information |
| Partial-page mode | Drawer | Maintaining awareness of the original layout |
| Step-based | StepFormDialog | Multi-step operations |

### Structural Elements

```tsx
<Dialog>
  <DialogTitle>Create Article</DialogTitle>
  <DialogDescription>Enter the information for the new article.</DialogDescription>

  <DialogContent>
    <FormControl>
      <Label>Title</Label>
      <Input />
    </FormControl>
  </DialogContent>

  <DialogActions>
    <Button variant="ghost" onClick={onCancel}>Cancel</Button>
    <Button onClick={onSubmit}>Create</Button>
  </DialogActions>
</Dialog>
```

### Accessibility

**Avoid disabling the submit button**. Even when there are input errors, let the user press the button and then display error feedback.

## Wizard

A pattern for completing operations across multiple steps.

### Use Cases

| Scenario | Example |
|----------|---------|
| Complex operations | Searching and selecting objects, file editing |
| Conditional branching | Subsequent items change based on input content |
| Confirmation operations with parameter input | Setting conditions before deletion |

### Basic Principles

- **Avoid overuse**: Restricts user behavior, so limit to particularly effective cases
- **Progress display**: Always show the total number of steps and the current step

### Implementation

```tsx
<StepFormDialog
  currentStep={currentStep}
  totalSteps={3}
  title={`Import Articles (${currentStep}/3)`}
>
  {currentStep === 1 && <Step1 />}
  {currentStep === 2 && <Step2 />}
  {currentStep === 3 && <Step3 />}

  <DialogActions>
    {currentStep > 1 && (
      <Button variant="ghost" onClick={onBack}>Back</Button>
    )}
    <Button variant="ghost" onClick={onCancel}>Cancel</Button>
    {currentStep < 3 ? (
      <Button onClick={onNext}>Next</Button>
    ) : (
      <Button onClick={onComplete}>Import</Button>
    )}
  </DialogActions>
</StepFormDialog>
```

## Permission-Based Display Control

A pattern for controlling UI visibility based on user permissions.

### 4 Patterns

| Pattern | Behavior | Example |
|---------|----------|---------|
| A | Hide UI, hide reason | Do not show the feature at all to unauthorized users |
| B | Hide UI, show reason | Explanation of system-standard permissions (cannot delete) |
| C | Disable UI, show reason | Cannot delete because it is in use |
| D | Show UI, allow interaction | Normal state |

### Displaying Reasons

```tsx
// Display reason with Tooltip
<Tooltip content="This permission cannot be deleted because it is used by the system">
  <Button disabled>Delete</Button>
</Tooltip>

// Using disabledReason
<Button
  disabled
  disabledReason="Cannot delete because another user is currently editing"
>
  Delete
</Button>
```

### Writing Principles

| Situation | Expression |
|-----------|------------|
| User can take action | "Cannot [action] because [reason]" |
| User cannot take action | "Cannot [action]" |

## References

- [Design Principles](./design-principles.md)
- [Accessibility Guidelines](./accessibility.md)
- [CSS Guidelines](../css.md)
