# Date/Time Handling Guidelines

This document defines the date/time handling conventions for the application.

## Fundamental Principles

1. **UTC as the standard**: All server-side timestamps and stored dates use UTC
2. **Display in JST**: The frontend displays dates in JST (Asia/Tokyo) for Japanese users
3. **Use `@my-app/dayjs`**: Always use the shared dayjs package instead of the native `Date` object

## Package: `@my-app/dayjs`

The `@my-app/dayjs` package provides consistent date/time utilities across the entire application.

### Installation

Already included in both `services/api` and `services/web`.

```typescript
import {
  getCurrentUTCDate,
  getCurrentTimestamp,
  formatToJST,
  formatToLocalizedDate,
} from "@my-app/dayjs";
```

## Server-Side (Backend)

### Getting the Current Time

```typescript
import { getCurrentUTCDate, getCurrentTimestamp } from "@my-app/dayjs";

// Get the current time as a Date object (UTC)
const now = getCurrentUTCDate();

// Get the current timestamp in milliseconds (replacement for Date.now())
const timestamp = getCurrentTimestamp();
```

### Database Operations

All database timestamps are stored in UTC.

```typescript
import { getCurrentUTCDate } from "@my-app/dayjs";

// When creating a record
await db.insert(table).values({
  createdAt: getCurrentUTCDate(),
  updatedAt: getCurrentUTCDate(),
});
```

### Token/Session Expiration

```typescript
import { addMillisecondsFromNow, convertToUTC } from "@my-app/dayjs";

// Creating an expiration time
const TOKEN_EXPIRE_MS = 30 * 60 * 1000; // 30 minutes
const expireTime = convertToUTC(addMillisecondsFromNow(TOKEN_EXPIRE_MS));
```

## Frontend (Client-Side)

### Getting the Current Time

```typescript
import { getCurrentUTCDate, getCurrentTimestamp } from "@my-app/dayjs";

// For timestamp calculations (e.g., elapsed time)
const startTime = getCurrentTimestamp();
// ... later
const elapsed = getCurrentTimestamp() - startTime;
```

### Displaying Dates to Users

Use JST format for Japanese users.

```typescript
import { formatToJST, formatToJSTShort } from "@my-app/dayjs";

// Full format: "2024年1月15日 10時30分00秒"
const fullDate = formatToJST(utcDate);

// Short format: "2024/01/15"
const shortDate = formatToJSTShort(utcDate);
```

For multilingual support:

```typescript
import { formatToLocalizedDate } from "@my-app/dayjs";

// Automatically format based on language code
const localizedDate = formatToLocalizedDate(utcDate, "ja"); // Japanese
const localizedDate = formatToLocalizedDate(utcDate, "en"); // English
```

### Generating Filenames

```typescript
import { formatToISODate, formatToFilenameSafeISO, getCurrentUTCDate } from "@my-app/dayjs";

// Date-only filename: "2024-01-15"
const dateStr = formatToISODate(getCurrentUTCDate());
const filename = `export-${sessionId}-${dateStr}.webm`;

// Filename with timestamp: "2024-01-15T10-30-00-000Z"
const timestamp = formatToFilenameSafeISO(getCurrentUTCDate());
const filename = `recording-${timestamp}.webm`;
```

### Date Filtering

```typescript
import {
  getCurrentUTCDate,
  subtractDays,
  convertToUTCDate,
  isBefore,
} from "@my-app/dayjs";

// Filter items from the last 7 days
const now = getCurrentUTCDate();
const cutoffDate = subtractDays(now, 7);
const filteredItems = items.filter(
  (item) => !isBefore(convertToUTCDate(item.date), cutoffDate)
);
```

## Available Functions

### Time Retrieval

| Function | Return Type | Description |
|-----|-----------|------|
| `getCurrentUTCDate()` | `Date` | Returns the current UTC time as a Date object |
| `getCurrentUTCString()` | `string` | Returns the current UTC time as an ISO string |
| `getCurrentTimestamp()` | `number` | Returns the current UTC timestamp in milliseconds |
| `getCurrentYear()` | `number` | Returns the current year (UTC) |

### Conversion Functions

| Function | Return Type | Description |
|-----|-----------|------|
| `convertToUTC(input)` | `string` | Converts to a UTC ISO string |
| `convertToUTCDate(input)` | `Date` | Converts to a UTC Date object |
| `convertToUTCTimestamp(input, tz)` | `string` | Converts from a timezone to UTC |

### Formatting Functions

| Function | Return Type | Description |
|-----|-----------|------|
| `formatToISODate(input)` | `string` | Formats to "YYYY-MM-DD" |
| `formatToFilenameSafeISO(input)` | `string` | Formats to "YYYY-MM-DDTHH-mm-ss-SSSZ" |
| `formatToJST(input)` | `string` | Formats for JST display (full) |
| `formatToJSTShort(input)` | `string` | Formats for JST display (YYYY/MM/DD) |
| `formatToLocalizedDate(input, lang)` | `string` | Formats based on language |

### Date Arithmetic

| Function | Return Type | Description |
|-----|-----------|------|
| `addMillisecondsFromNow(ms)` | `Date` | Adds milliseconds to the current time |
| `addMinutes(input, minutes)` | `Date` | Adds minutes to a date/time |
| `subtractDays(input, days)` | `Date` | Subtracts days from a date/time |
| `subtractMinutes(input, minutes)` | `Date` | Subtracts minutes from a date/time |

### Comparison Functions

| Function | Return Type | Description |
|-----|-----------|------|
| `isBefore(date1, date2)` | `boolean` | Determines whether date1 is before date2 |

## Supported Languages/Timezones

| Code | Locale | Timezone |
|-------|---------|------------|
| `ja` | ja-JP | Asia/Tokyo |
| `en` | en-US | UTC |
| `ko` | ko-KR | Asia/Seoul |
| `cn` | zh-CN | Asia/Shanghai |
| `tw` | zh-TW | Asia/Taipei |
| `fr` | fr-FR | Europe/Paris |
| `de` | de-DE | Europe/Berlin |
| `es` | es-ES | Europe/Madrid |
| `default` | ja-JP | Asia/Tokyo |

## Migrating from Native Date

### Before Migration

```typescript
// Do not use these
const now = new Date();
const timestamp = Date.now();
const year = new Date().getFullYear();
const isoString = new Date().toISOString();
```

### After Migration

```typescript
import {
  getCurrentUTCDate,
  getCurrentTimestamp,
  getCurrentYear,
  getCurrentUTCString,
} from "@my-app/dayjs";

const now = getCurrentUTCDate();
const timestamp = getCurrentTimestamp();
const year = getCurrentYear();
const isoString = getCurrentUTCString();
```

## Testing

When testing time-dependent code, use Vitest's fake timers.

```typescript
import { beforeEach, afterEach, vi } from "vitest";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2025-01-15T10:00:00.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
});
```

Note: Functions from `@my-app/dayjs` use dayjs internally, which respects the mocked system time, so they work correctly with Vitest's fake timers.
