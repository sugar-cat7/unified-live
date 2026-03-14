# 01: Types

## PluginDefinition

The declarative input type for `PlatformPlugin.create()`. Plugin authors provide this instead of manually wiring RestManager overrides.

```ts
const pluginDefinitionSchema = z.object({
  /** Platform identifier (e.g., "youtube", "twitch"). */
  name: z.string().check(z.minLength(1)),

  /** Base URL for the platform's API. */
  baseUrl: z.url(),

  /** Rate limiting strategy instance. */
  rateLimitStrategy: z.custom<RateLimitStrategy>(),

  /** Token manager for auth (optional — some platforms use query param auth). */
  tokenManager: z.custom<TokenManager>().optional(),

  /** URL matcher — pure function, no network calls. */
  matchUrl: z.custom<(url: string) => ResolvedUrl | null>(),

  /** Transform requests before sending (e.g., inject API key, add headers). */
  transformRequest: z.custom<(req: RestRequest) => RestRequest>().optional(),

  /** Additional default headers for all requests. */
  headers: z.record(z.string(), z.string()).optional(),

  /** Platform-specific rate limit handling (e.g., YouTube 403 quota detection). */
  handleRateLimit: z
    .custom<(response: Response, req: RestRequest, attempt: number) => Promise<boolean>>()
    .optional(),

  /** Parse rate limit info from response headers. */
  parseRateLimitHeaders: z.custom<(headers: Headers) => RateLimitInfo | undefined>().optional(),

  /** Override fetch for testing. */
  fetch: z.custom<typeof globalThis.fetch>().optional(),

  /** Retry configuration. */
  retry: z.custom<RetryConfig>().optional(),
});

type PluginDefinition = z.infer<typeof pluginDefinitionSchema>;
```

## PluginMethods

The platform-specific data access methods. Separated from `PluginDefinition` because they need access to the constructed `RestManager`.

```ts
type PluginMethods = {
  /** Retrieve content by ID. Receives the plugin's RestManager. */
  getContent: (rest: RestManager, id: string) => Promise<Content>;

  /** Retrieve channel by ID. */
  getChannel: (rest: RestManager, id: string) => Promise<Channel>;

  /** List live streams for a channel. */
  getLiveStreams: (rest: RestManager, channelId: string) => Promise<LiveStream[]>;

  /** List videos for a channel with pagination. */
  getVideos: (rest: RestManager, channelId: string, cursor?: string) => Promise<Page<Video>>;

  /** Resolve archive for a live stream (optional). */
  resolveArchive?: (rest: RestManager, live: LiveStream) => Promise<Video | null>;
};
```

**Design decision**: Methods receive `rest` as the first argument rather than closing over it. This makes them pure functions that are easier to test and compose.

## PlatformPlugin (unchanged type, new companion object)

The `PlatformPlugin` type itself does NOT change. The companion object provides factory and type guard utilities:

```ts
// Existing type — no changes
export type PlatformPlugin = {
  readonly name: string;
  readonly rest: RestManager;
  match(url: string): ResolvedUrl | null;
  resolveUrl(url: string): ResolvedUrl | null;
  getContent(id: string): Promise<Content>;
  getChannel(id: string): Promise<Channel>;
  getLiveStreams(channelId: string): Promise<LiveStream[]>;
  getVideos(channelId: string, cursor?: string): Promise<Page<Video>>;
  resolveArchive?(live: LiveStream): Promise<Video | null>;
  dispose(): void;
};

// New companion object
export const PlatformPlugin = {
  /**
   * Create a PlatformPlugin from a declarative definition.
   *
   * @precondition definition.rateLimitStrategy is initialized
   * @postcondition returns a fully functional PlatformPlugin
   */
  create(definition: PluginDefinition, methods: PluginMethods): PlatformPlugin;

  /**
   * Type guard for PlatformPlugin.
   *
   * @postcondition returns true if value has all required PlatformPlugin properties
   */
  is(value: unknown): value is PlatformPlugin;
} as const;
```

**Note**: TypeScript allows a type and a value with the same name to coexist. This is the companion object pattern — `PlatformPlugin` is both a type (for type annotations) and a value (for `PlatformPlugin.create()`, `PlatformPlugin.is()`).

## Export Changes

```ts
// Before (packages/core/src/index.ts)
export type { PlatformPlugin } from "./plugin";

// After
export { PlatformPlugin } from "./plugin";
export type { PlatformPlugin as PlatformPluginType } from "./plugin";
export type { PluginDefinition, PluginMethods } from "./plugin";
```

Consumers can use `PlatformPlugin` as both a type and a value:

```ts
import { PlatformPlugin } from "@unified-live/core";

// As a type
const plugin: PlatformPlugin = ...;

// As a value
const plugin = PlatformPlugin.create(definition, methods);
if (PlatformPlugin.is(unknown)) { ... }
```
