# Accessibility Checklist

## Overview

Accessibility is a critical element for ensuring all users can use the product. This checklist is based on WCAG 2.1 standards and is organized into 7 categories.

## 1. Alternative Text

Provide appropriate alternative text for images and media content.

| Check Item | Details |
|-----------|---------|
| Images have alternative text | Set the `alt` attribute on all `<img>` tags |
| Decorative images can be ignored | Set `alt=""` or `role="presentation"` on decorative images |

### Implementation Examples

```tsx
// Image that conveys information
<img src="/article-image.jpg" alt="Aerial photograph of Tokyo's nightscape" />

// Decorative image
<img src="/decorative-line.png" alt="" role="presentation" />

// Image within a link
<a href="/home">
  <img src="/logo.svg" alt="Return to home" />
</a>
```

## 2. Video/Audio

Ensure accessibility of video and audio content.

| Check Item | Details |
|-----------|---------|
| Video audio has captions | Users with hearing disabilities can understand the content |
| Video content has audio description or text alternative | Users with visual disabilities can understand the content |
| Auto-playing audio, video, or animations can be paused | Users can control playback |
| Nothing on screen flashes or strobes more than 3 times per second | Prevent photosensitive seizures |

### Implementation Examples

```tsx
<video controls>
  <source src="/video.mp4" type="video/mp4" />
  <track kind="captions" src="/captions-en.vtt" srclang="en" label="English captions" />
</video>
```

## 3. Markup

Use semantic HTML markup.

| Check Item | Details |
|-----------|---------|
| Tables are marked up with `<table>` | Do not use tables for layout purposes |
| Headings are marked up with `<h1>` through `<h6>` | Use heading levels in proper order |
| Lists are marked up with `<ul>`, `<ol>`, `<dl>` | Use appropriate list elements |
| Layout is not done using whitespace characters | Control layout with CSS |
| No duplicate `id` attributes exist on the same page | id attributes must be unique |

### Correct Use of Headings

```tsx
// OK: Headings in proper order
<h1>Page Title</h1>
<h2>Section 1</h2>
<h3>Subsection 1-1</h3>
<h2>Section 2</h2>

// NG: Skipping heading levels
<h1>Page Title</h1>
<h3>Section 1</h3>  {/* h2 was skipped */}
```

## 4. Perceivability and Distinguishability

Ensure visual and auditory information is properly conveyed.

| Check Item | Details |
|-----------|---------|
| Information is accessible when the screen is zoomed to 200% or text size is doubled | Responsive support |
| Contrast ratio between background and text is 4.5:1 or higher (3:1 or higher for large text 29px+) | Ensure readability |
| Content is not described solely through color, shape, sound, or layout | Convey information through multiple means |

### Contrast Ratio Standards

| Target | Minimum Contrast Ratio |
|--------|----------------------|
| Normal text (less than 14px) | 4.5:1 |
| Large text (18px or larger, or 14px or larger bold) | 3:1 |
| UI components | 3:1 |

### Information Not Dependent on Color Alone

```tsx
// NG: Indicating error with color only
<input className="border-red-500" />

// OK: Indicating error with color + icon + text
<div>
  <input className="border-red-500" aria-invalid="true" aria-describedby="error-msg" />
  <span id="error-msg" className="text-red-600">
    <ErrorIcon /> There is an error in the input
  </span>
</div>
```

## 5. Operability

Ensure operability with keyboard and other input devices.

| Check Item | Details |
|-----------|---------|
| Keyboard operable | All interactive elements can receive focus |
| Keyboard operation order matches visual order | Set tabindex appropriately |
| Content has no time limits | If necessary, provide options to extend or disable |

### Keyboard Focus Visibility

```css
:focus-visible {
  outline: 2px solid var(--color-border-focus);
  outline-offset: 2px;
}
```

## 6. Navigation

Clarify in-page navigation.

| Check Item | Details |
|-----------|---------|
| Page language is specified in `<html>` | `<html lang="en">` |
| Page title represents the page content | Specific and unique titles |
| Main content of the page has headings | Facilitate navigation with screen readers |
| Link text allows identification of the link destination | Avoid links with only "click here" |

### Improving Link Text

```tsx
// NG: Link destination unclear
Please check <a href="/policy">here</a>.

// OK: Link destination clear
Please check our <a href="/policy">Privacy Policy</a>.
```

## 7. Forms

Ensure form input accessibility.

| Check Item | Details |
|-----------|---------|
| Input content and actions are displayed as labels | Use `<label>` elements |
| Form parts have accessible names | `aria-label` or `aria-labelledby` |
| Error occurrence and content can be identified | Display error messages clearly |
| Selecting or entering in input fields does not cause major changes | Avoid unintended user actions |

### Form Implementation Example

```tsx
<div>
  <label htmlFor="email">Email Address</label>
  <input
    id="email"
    type="email"
    aria-required="true"
    aria-invalid={hasError}
    aria-describedby={hasError ? "email-error" : undefined}
  />
  {hasError && (
    <span id="email-error" role="alert" className="text-error">
      Please enter a valid email address
    </span>
  )}
</div>
```

## How to Use the Checklist

1. Review this checklist upon development completion
2. Verify each item and fix any issues found
3. After fixes, review the checklist again
4. Confirm all items are cleared before release

## References

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [Lighthouse Accessibility Audit](https://developers.google.com/web/tools/lighthouse)
