# Writing Guidelines

## Overview

Writing clear and effective text is a key factor in improving user experience. This guideline establishes the principles and rules for creating consistent, readable, and easy-to-understand text.

## 3 Fundamental Principles

### 1. Selective Information Based on Purpose

Carefully choose what to say and how to express it, considering the reader's context (when they will read it, their prior knowledge, etc.).

| Points to Consider | Example |
|------------------|-----|
| Reader's knowledge level | Whether to use technical terms or simpler language |
| Reading context | Whether reading in a hurry or reading carefully |
| Desired information | Whether they want only an overview or full details |

### 2. Appropriate Word Choice

Choose words carefully, keeping in mind the impression the reader will receive.

- Prefer positive expressions
- Avoid ambiguous expressions
- Use words familiar to the reader

### 3. Correct Grammar

Be conscious of sentence structure elements and follow grammar rules correctly.

- Subject-verb agreement
- Modifier placement
- Proper use of prepositions and articles

## Practical Rules

### Keep Sentences Concise

Long sentences are difficult to read and understand. Aim for clear, concise sentences.

```
Bad: By using this feature, users will be able to change the notification
     reception settings from their own account settings screen.

Good: Use this feature to change notification settings from your account settings.
```

### Clarify Subjects and Objects

Make the subject clear and do not omit necessary articles or prepositions.

```
Bad: Data deleted.
Good: The data was deleted.

Bad: Can change settings.
Good: You can change the settings.
```

### Appropriate Use of Punctuation

Place commas at meaningful chunk boundaries. However, be careful not to over-punctuate and fragment the text.

```
Bad: Tomorrow, I will, with Tanaka, in the meeting room, have a discussion.
Good: Tomorrow, I will have a discussion with Tanaka in the meeting room.
```

### Avoid Double Negatives

Double negatives are hard to understand, so prefer affirmative statements.

```
Bad: You cannot complete without entering.
Good: You can complete by entering.

Bad: Even if not configured, it will not remain unnotified.
Good: Even without configuration, you will still be notified.
```

### Consistent Notation

Use standard conventions as a baseline and unify notation within the project.

| Category | Rule |
|----------|--------|
| Spelling | Use American English as the standard |
| Numbers | Half-width digits, commas every 3 digits (e.g., 100,000) |
| Symbols | Use standard punctuation (periods, parentheses, etc.) |
| Units | No space between number and unit (e.g., 10px) |

## Document (Markdown) Writing

Apply the same quality standards to technical documents written in `docs/`, not just UI text.

### Heading Design

- Use only one `#` per file
- Use `##` for sections, and `###` as needed as the baseline
- Use heading names that convey the content at a glance

### State the Purpose at the Beginning

Write 1-2 sentences at the start of the body explaining "what this document defines."
This enables readers to quickly determine whether the information is relevant to them.

### Distinguishing Between Bullet Points and Steps

- Use numbered lists for sequential instructions
- Use bullet points for non-sequential items
- Keep one message per item

### Code Block Principles

- Include executable units of code
- Specify the language (e.g., `bash`, `ts`, `json`)
- If there are prerequisites, write them immediately before the code block

### Link Practices

- Use relative paths for in-repository references
- Use link text that describes the destination, not "here" or "click here"
- Prefer primary sources (official documentation) as the basis for specifications

### Combining with textlint

Text quality is ensured through a combination of manual review and `textlint`.
See [docs/security/textlint.md](../security/textlint.md) for detailed operational policies.

## 5 Writing Goals

### 1. Consistency

Use unified expressions to prevent inconsistent notation across screens.

```
Bad: "Save" on screen A, "Save changes" on screen B
Good: Use "Save" consistently across all screens
```

### 2. Coherence

Unify the language used throughout the product so that users do not feel a difference in tone between screens.

### 3. Searchability

Structure content so users can easily find the information they need, and use familiar words.

- Prefer commonly used terms
- Include easily searchable keywords

### 4. Standardization

By publishing the rationale behind word choices, enable consistent quality regardless of individual skill or preference.

### 5. Efficiency

Leverage writing patterns and examples to streamline the word selection process.

## UI Text Rules

### Button Labels

| Type | Format | Example |
|------|------|-----|
| Action button | End with a verb | Save, Delete |
| Confirmation button | Noun or verb | OK, Cancel, Close |
| Navigation | Noun | Home, Settings |

### Error Messages

See the [Content Guidelines](./content-guidelines.md).

### Placeholders

```
Bad: Please enter
Good: e.g., John Smith
```

### Labels

```
Bad: Enter your name:
Good: Name
```

## Prohibited Practices

- Using machine translations as-is
- Using technical terms without explanation
- Overuse of formal or overly polite language
- Using imperative tone (except for user instructions)
- Overuse of "etc." or "and so on"

## References

- [Content Guidelines](./content-guidelines.md)
- [Accessibility Guidelines](./accessibility.md)
