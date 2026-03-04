# Cache Components Guidelines (Next.js 16)

## Prerequisites

In this template's `services/web/next.config.ts`, the following are enabled by default:

- `reactCompiler: true`
- `cacheComponents: true`

Under these prerequisites, App Router design is based on "Server Components + Cache Components + Suspense boundaries".

## Design Principles

1. **Make cacheable operations explicit**
   - Add `'use cache'` to cacheable Server Components / functions.
   - Make the cache update strategy explicit with `cacheLife` and `cacheTag`.
2. **Determine dynamic data boundaries first**
   - Treat locations that read request-dependent data such as `cookies()`, `headers()`, `searchParams` as dynamic boundaries.
   - Place `<Suspense>` below dynamic boundaries to return the static shell first.
3. **Separate personalization from shared cache**
   - Use `'use cache: private'` for user-specific data.
   - Use standard `'use cache'` for shareable data.
4. **Use `'use cache'` at small responsibility units**
   - Do not cache an entire page at once; apply it to meaningful subtree/function units.
   - Separate into reusable "data function + Presenter" units.

## Recommended Patterns

### 1. Separate cacheable read functions

```tsx
import { cacheLife, cacheTag } from "next/cache";

export async function getCatalog() {
  "use cache";
  cacheTag("catalog");
  cacheLife({ stale: 300 });

  const response = await fetch("https://example.com/catalog");
  return response.json();
}
```

### 2. Fetch dynamic data in a non-cached layer and pass it down

```tsx
import { cookies } from "next/headers";

async function ProfileContent() {
  const sessionId = (await cookies()).get("session-id")?.value ?? "guest";
  return <CachedProfile sessionId={sessionId} />;
}

async function CachedProfile({ sessionId }: { sessionId: string }) {
  "use cache";
  const profile = await getProfile(sessionId);
  return <ProfilePresenter profile={profile} />;
}
```

### 3. Use private cache for user-specific information

```tsx
import { cacheLife, cacheTag } from "next/cache";
import { cookies } from "next/headers";

async function getRecommendations(productId: string) {
  "use cache: private";
  cacheTag(`recommendations:${productId}`);
  cacheLife({ stale: 60 });

  const sessionId = (await cookies()).get("session-id")?.value ?? "guest";
  return fetchRecommendations(productId, sessionId);
}
```

## Implementations to Avoid

- Placing a shared cache in the same function that reads `cookies()` or `headers()`
- Using `'use cache'` without defining update conditions (`cacheTag` / `cacheLife`)
- Falling back to fully dynamic rendering for an entire large page without cache boundaries

## References

- Next.js `cacheComponents`: https://nextjs.org/docs/app/getting-started/cache-components
- Next.js `'use cache'`: https://nextjs.org/docs/app/api-reference/directives/use-cache
- Next.js `'use cache: private'`: https://nextjs.org/docs/app/api-reference/directives/use-cache-private
