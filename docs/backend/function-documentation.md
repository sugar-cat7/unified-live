# Function Documentation Conventions

## Overview

Public functions must have their specifications documented with JSDoc.
This improves the accuracy of code generation, test generation, and reviews.

Explicitly stating preconditions and postconditions makes it easier to design boundary value tests.

## Required Tags

### Type Operations (Companion Object Methods, Mappers)

| Tag | Description | Required |
|------|------|------|
| `@param` | Meaning and constraints of the argument | Yes |
| `@returns` | Meaning of the return value | Yes |
| `@precondition` | Conditions that must hold before the call | Yes |
| `@postcondition` | Conditions guaranteed after the call | Yes |

### Infrastructure & Plugin Functions

In addition to the above tags, the following is also required.

| Tag | Description | Required |
|------|------|------|
| `@idempotency` | Whether the function is idempotent and why | Yes |

## Code Examples

### Companion Object Method

```typescript
/**
 * Narrows Content to LiveStream.
 *
 * @precondition content is a valid Content value
 * @postcondition returns true iff content.type === "live"
 */
export const Content = {
  isLive: (content: Content): content is LiveStream => content.type === "live",
} as const;
```

### Factory Function

```typescript
/**
 * Creates a YouTube platform plugin.
 *
 * @param config - YouTube API configuration
 * @precondition config.apiKey is a valid YouTube Data API v3 key
 * @postcondition returns a PlatformPlugin that handles YouTube URLs and API calls
 * @idempotency Not idempotent — each call creates a new plugin instance
 */
export function createYouTubePlugin(config: YouTubePluginConfig): PlatformPlugin {
  // ...
}
```

### Plugin Method (PluginMethods)

```typescript
/**
 * Retrieves a YouTube video or live stream by ID.
 *
 * @param rest - RestManager for making API calls
 * @param id - YouTube video ID
 * @precondition id is a valid YouTube video ID
 * @postcondition returns Content matching the video ID
 * @idempotency Safe — read-only operation
 */
export async function youtubeGetContent(rest: RestManager, id: string): Promise<Content> {
  // ...
}
```

## Relationship with Tests

JSDoc preconditions and postconditions directly inform test design.

| JSDoc | Role in Tests |
|-------|--------------|
| `@precondition` | Test case prerequisites. Violation cases should also be added as boundary value tests |
| `@postcondition` | Basis for assertions. Verified with expect statements in tests |
| `@idempotent` | If idempotent, test with two executions of the same input; if not, verify duplicate prevention |

### Example of Test Derivation

```typescript
describe("Content.isLive", () => {
  const cases = [
    {
      name: "returns true for live streams",
      input: { ...baseContent, type: "live" as const },
      expected: true,
    },
    {
      name: "returns false for videos",
      input: { ...baseContent, type: "video" as const },
      expected: false,
    },
  ];

  it.each(cases)("$name", ({ input, expected }) => {
    expect(Content.isLive(input)).toBe(expected); // @postcondition
  });
});
```

## Related Documents

- [SDK Architecture](./sdk-architecture.md) - Overall layer structure
- [Unit Testing](../testing/unit-testing.md) - Table-driven test implementation guidelines
