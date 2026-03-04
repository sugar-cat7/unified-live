# @my-app/dayjs

A utility package for date manipulation and formatting using day.js.

## Installation

```bash
pnpm add @my-app/dayjs
```

## Usage

```typescript
import {
  getCurrentUTCDate,
  getCurrentTimestamp,
  formatToJST,
  formatToLocalizedDate
} from '@my-app/dayjs';

// Get the current UTC date/time
const now = getCurrentUTCDate();

// Get the current timestamp (alternative to Date.now())
const timestamp = getCurrentTimestamp();

// Format for JST display
const jstDate = formatToJST(now);

// Format according to locale
const localizedDate = formatToLocalizedDate(now, 'ja');
```

## Dependencies

- dayjs: ^1.11.19
- zod: ^4.x

## Development

```bash
# Build the package
pnpm build
```

## Version

Current version: 0.1.0
