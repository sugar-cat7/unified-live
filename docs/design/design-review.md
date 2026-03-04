# Design Review

## Overview

Design review is an important process for ensuring product quality. This guideline defines two types of review processes: Information Architecture Review and UI Review.

## Information Architecture Review

A review that examines whether the product's information structure is sound.

### Scope

| Scope | Description |
|-------|-------------|
| New application development | Newly developed applications |
| Large-scale feature development | Major feature additions to existing products |

### Timing

Conducted when the overall design has solidified and is ready to share with the development team.

### Preparation Materials

| Material | Description |
|----------|-------------|
| Information architecture output | IA diagrams, sitemaps, flow diagrams, etc. |
| Screen layouts | Design files or screen captures |

### Participant Roles

| Role | Assigned To | Responsibilities |
|------|-------------|-----------------|
| Reviewee | Lead designer | Accountable for explaining design decisions |
| Support | Development team (optional) | Support the reviewee |
| Facilitator | Moderator | Facilitate proceedings and organize discussion |
| Reviewer | Other participants | Provide feedback |

### Evaluation Criteria

Evaluation is conducted on a 4-level scale.

| Rating | Description | Next Action |
|--------|-------------|-------------|
| Good | No issues | Proceed as-is |
| Minor issues | Small improvements needed | Fix without re-review |
| Clear issues | Clear problems exist | Fix/redesign, then re-review |
| Fundamental issues | Design needs to be reconsidered | Restart from design |

### Expected Feedback

| Perspective | Specific Examples |
|-------------|-------------------|
| Are there any concerns with the information architecture output? | Object definitions, screen transitions, navigation structure |
| Is there a gap between the screens and information architecture? | Alignment between design intent and screen representation |

**Note**: Details such as spacing and component selection are handled in the UI Review.

### Review Process

1. **Preparation**: Reviewee shares materials (at least 2 business days before the review)
2. **Explanation**: Reviewee explains the information architecture intent (15 min)
3. **Q&A**: Answer questions from reviewers (20 min)
4. **Feedback**: Reviewers provide feedback (15 min)
5. **Summary**: Determine evaluation and confirm next actions (10 min)

## UI Review

A review conducted on the concrete surface-level aspects of product design.

### Scope

| Scope | Description |
|-------|-------------|
| New application development | Newly developed applications |
| Medium to large-scale feature development | Feature additions to existing products |

### Timing

| Development Type | Timing |
|-----------------|--------|
| New development | After information architecture review completion |
| Medium-scale development | At the lead designer's preferred timing |

### Participants

| Role | Count |
|------|-------|
| Lead designer (reviewee) | 1 |
| Reviewer | 1 (randomly assigned) |

### Review Format

**Asynchronous review** is the standard format.

1. Reviewee shares the design file
2. Reviewer provides feedback via comments
3. Reviewee responds and makes corrections

### Expected Feedback

Feedback is provided in the following format:

| Element | Description |
|---------|-------------|
| Checklist number | Checklist number from [Design Principles](./design-principles.md) |
| Target | Specific screen/element |
| Issue | Problem and improvement suggestion |

#### Feedback Example

```
[#7 Visual Grouping]
Settings screen "Notification Settings" section

Issue: The spacing between "Email Notifications" and "Push Notifications" is too narrow,
       making them appear to be in the same group.

Suggestion: Increase the spacing between sections from 24px to 40px
            to clarify the group boundaries.
```

### Review Goal

Ideally, the review is a **single round-trip communication**: receiving feedback and responding to judgments outside the checklist.

### Leveraging the Checklist

UI reviews utilize the 22-item checklist from [Design Principles](./design-principles.md).

Particularly important items:

| # | Item |
|---|------|
| 6 | Eye flow guidance |
| 7 | Visual grouping |
| 8 | Page layout |
| 9 | Spacing |
| 10 | Mobile layout |
| 11 | Feedback |
| 17 | Avoiding custom components |
| 21 | Error messages |

## Review Process Flow

```
┌─────────────────────────────────────────────────────────┐
│                    For new development                   │
├─────────────────────────────────────────────────────────┤
│  Start design                                           │
│      ↓                                                  │
│  Create information architecture output                 │
│      ↓                                                  │
│  [IA Review] ←─── Re-review if rated                    │
│      │             "Clear issues" or above              │
│      ↓                                                  │
│  Create UI design                                       │
│      ↓                                                  │
│  [UI Review] ←──── Corrections and re-check as needed   │
│      ↓                                                  │
│  Start development                                      │
└─────────────────────────────────────────────────────────┘
```

## Review Request Templates

### Information Architecture Review Request

```markdown
## Information Architecture Review Request

### Project Name
[Project name]

### Overview
[Brief description of the project]

### Material Links
- Information architecture: [Link]
- Screen layouts: [Link]

### Preferred Date
[List candidate dates]

### Points to Particularly Review
- [Review point 1]
- [Review point 2]
```

### UI Review Request

```markdown
## UI Review Request

### Target Screens
[List of target screens]

### Design File
[Link to Figma, etc.]

### Background/Context
[Design background and constraints]

### Points to Particularly Review
- [Review point 1]
- [Review point 2]
```

## References

- [Design Principles](./design-principles.md)
- [Design Patterns](./design-patterns.md)
- [Accessibility Checklist](./accessibility.md)
