import type { TokenManager } from "./auth/types";
import { ValidationError } from "./errors";
import { createRestManager, type RestManager } from "./rest/manager";
import type { RateLimitStrategy } from "./rest/strategy";
import type { RateLimitInfo, RestRequest, RetryConfig } from "./rest/types";
import type { Channel, Content, LiveStream, Page, ResolvedUrl, Video } from "./types";

/** @category Plugins */
export type PluginCapabilities = {
  /** Whether the plugin supports live stream detection */
  supportsLiveStreams: boolean;
  /** Whether the plugin supports archive resolution (live -> video) */
  supportsArchiveResolution: boolean;
  /** Authentication model used by this plugin */
  authModel: "apiKey" | "oauth2" | "basic";
  /** Rate limiting model */
  rateLimitModel: "quota" | "tokenBucket";
};

/**
 * Declarative configuration for creating a PlatformPlugin via `PlatformPlugin.create()`.
 * Plugin authors provide this instead of manually wiring RestManager overrides.
 *
 * @category Plugins
 */
export type PluginDefinition = {
  /** Platform identifier (e.g., "youtube", "twitch"). */
  name: string;

  /** Base URL for the platform's API. */
  baseUrl: string;

  /** Rate limiting strategy instance. */
  rateLimitStrategy: RateLimitStrategy;

  /** Token manager for auth (optional — some platforms use query param auth). */
  tokenManager?: TokenManager;

  /** URL matcher — pure function, no network calls. */
  matchUrl: (url: string) => ResolvedUrl | null;

  /** Transform requests before sending (e.g., inject API key, add headers). */
  transformRequest?: (req: RestRequest) => RestRequest;

  /** Additional default headers for all requests. */
  headers?: Record<string, string>;

  /** Platform-specific rate limit handling (e.g., YouTube 403 quota detection). */
  handleRateLimit?: (response: Response, req: RestRequest, attempt: number) => Promise<boolean>;

  /** Parse rate limit info from response headers. */
  parseRateLimitHeaders?: (headers: Headers) => RateLimitInfo | undefined;

  /** Override fetch for testing. */
  fetch?: typeof globalThis.fetch;

  /** Retry configuration. */
  retry?: RetryConfig;

  /** Plugin capability metadata. */
  capabilities?: PluginCapabilities;
};

/**
 * Platform-specific data access methods.
 * Separated from PluginDefinition because they need access to the constructed RestManager.
 * Methods receive `rest` as the first argument — pure functions that are easier to test and compose.
 *
 * @category Plugins
 */
export type PluginMethods = {
  /** Retrieve content by ID. */
  getContent: (rest: RestManager, id: string) => Promise<Content>;

  /** Retrieve channel by ID. */
  getChannel: (rest: RestManager, id: string) => Promise<Channel>;

  /** List live streams for a channel. */
  getLiveStreams: (rest: RestManager, channelId: string) => Promise<LiveStream[]>;

  /** List videos for a channel with pagination. */
  getVideos: (
    rest: RestManager,
    channelId: string,
    cursor?: string,
    pageSize?: number,
  ) => Promise<Page<Video>>;

  /** Resolve archive for a live stream (optional). */
  resolveArchive?: (rest: RestManager, live: LiveStream) => Promise<Video | null>;
};

/**
 * A platform-specific plugin that implements data retrieval for a single streaming platform.
 *
 * @precondition Each plugin instance is bound to a single platform
 * @postcondition All returned data conforms to the unified Content/Channel types
 * @category Plugins
 */
export type PlatformPlugin = {
  /** Platform identifier (e.g., "youtube", "twitch", "twitcasting"). */
  readonly name: string;

  /** The underlying RestManager for this plugin. */
  readonly rest: RestManager;

  /** Plugin capability metadata. */
  readonly capabilities: PluginCapabilities;

  /**
   * Test whether a URL belongs to this platform.
   * Returns a ResolvedUrl if matched, or null if not.
   * No network calls.
   */
  match(url: string): ResolvedUrl | null;

  /**
   * Resolve a URL to a platform + type + id.
   * Default implementation delegates to match().
   */
  resolveUrl(url: string): ResolvedUrl | null;

  /** Retrieve content (live stream or video) by ID. */
  getContent(id: string): Promise<Content>;

  /** Retrieve channel information by ID. */
  getChannel(id: string): Promise<Channel>;

  /** List currently active live streams for a channel. */
  getLiveStreams(channelId: string): Promise<LiveStream[]>;

  /** List videos (archives) for a channel with cursor-based pagination. */
  getVideos(channelId: string, cursor?: string, pageSize?: number): Promise<Page<Video>>;

  /** Resolve the archive video for a live stream (platform-specific). */
  resolveArchive?(live: LiveStream): Promise<Video | null>;

  /** Release resources (timers, connections). */
  [Symbol.dispose](): void;
};

/**
 * Companion object for the PlatformPlugin type.
 * Provides factory and type guard utilities.
 *
 * @category Plugins
 * @example
 * ```ts
 * const plugin = PlatformPlugin.create(definition, methods);
 * if (PlatformPlugin.is(unknown)) { ... }
 * ```
 */
export const PlatformPlugin = {
  /**
   * Create a PlatformPlugin from a declarative definition and methods.
   *
   * @param definition - declarative plugin configuration
   * @param methods - platform-specific data access implementations
   * @returns a fully wired PlatformPlugin
   * @precondition definition.rateLimitStrategy is initialized
   * @postcondition returns a fully functional PlatformPlugin with wired RestManager
   */
  create(definition: PluginDefinition, methods: PluginMethods): PlatformPlugin {
    let parsedBaseUrl: URL;
    try {
      parsedBaseUrl = new URL(definition.baseUrl);
    } catch {
      throw new ValidationError(
        "VALIDATION_INVALID_URL",
        `Plugin "${definition.name}" baseUrl is not a valid URL (got "${definition.baseUrl}")`,
        { platform: definition.name },
      );
    }
    if (parsedBaseUrl.protocol !== "https:") {
      throw new ValidationError(
        "VALIDATION_INVALID_URL",
        `Plugin "${definition.name}" baseUrl must use HTTPS (got "${definition.baseUrl}")`,
        { platform: definition.name },
      );
    }

    const rest = createRestManager({
      platform: definition.name,
      baseUrl: definition.baseUrl,
      rateLimitStrategy: definition.rateLimitStrategy,
      tokenManager: definition.tokenManager,
      headers: definition.headers,
      fetch: definition.fetch,
      retry: definition.retry,
    });

    if (definition.transformRequest) {
      const origRequest = rest.request;
      const transform = definition.transformRequest;
      rest.request = <T>(req: RestRequest) => {
        return origRequest<T>(transform(req));
      };
    }

    if (definition.handleRateLimit) {
      rest.handleRateLimit = definition.handleRateLimit;
    }

    if (definition.parseRateLimitHeaders) {
      rest.parseRateLimitHeaders = definition.parseRateLimitHeaders;
    }

    const plugin: PlatformPlugin = {
      name: definition.name,
      rest,
      capabilities: definition.capabilities ?? {
        supportsLiveStreams: true,
        supportsArchiveResolution: !!methods.resolveArchive,
        authModel: "apiKey",
        rateLimitModel: "tokenBucket",
      },
      match: definition.matchUrl,
      resolveUrl: definition.matchUrl,
      getContent: (id) => methods.getContent(rest, id),
      getChannel: (id) => methods.getChannel(rest, id),
      getLiveStreams: (channelId) => methods.getLiveStreams(rest, channelId),
      getVideos: (channelId, cursor, pageSize) =>
        methods.getVideos(rest, channelId, cursor, pageSize),
      resolveArchive: methods.resolveArchive
        ? (live) => methods.resolveArchive!(rest, live)
        : undefined,
      [Symbol.dispose]: () => rest[Symbol.dispose](),
    };

    return plugin;
  },

  /**
   * Type guard for PlatformPlugin.
   *
   * @param value - the value to check
   * @returns true if value implements PlatformPlugin
   * @postcondition returns true if value has all required PlatformPlugin properties
   */
  is(value: unknown): value is PlatformPlugin {
    if (typeof value !== "object" || value === null) return false;
    const obj = value as Record<string | symbol, unknown>;
    return (
      typeof obj.name === "string" &&
      typeof obj.match === "function" &&
      typeof obj.resolveUrl === "function" &&
      typeof obj.getContent === "function" &&
      typeof obj.getChannel === "function" &&
      typeof obj.getLiveStreams === "function" &&
      typeof obj.getVideos === "function" &&
      typeof obj[Symbol.dispose] === "function" &&
      obj.rest !== undefined &&
      typeof obj.capabilities === "object" &&
      obj.capabilities !== null
    );
  },
} as const;
