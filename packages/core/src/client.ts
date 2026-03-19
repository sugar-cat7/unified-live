import { SpanStatusCode } from "@opentelemetry/api";
import type { TracerProvider } from "@opentelemetry/api";
import {
  AuthenticationError,
  NetworkError,
  PlatformNotFoundError,
  QuotaExhaustedError,
  RateLimitError,
  UnifiedLiveError,
  ValidationError,
} from "./errors";
import type { PlatformPlugin } from "./plugin";
import { getTracer, SpanAttributes } from "./telemetry/traces";
import { BatchResult } from "./types";
import type {
  Channel,
  Content,
  LiveStream,
  Page,
  ResolvedUrl,
  SearchOptions,
  Video,
} from "./types";

/** @category Client */
export type UnifiedClientOptions = {
  plugins?: PlatformPlugin[];
  tracerProvider?: TracerProvider;
};

/** @category Client */
export type UnifiedClient = {
  /**
   * Register a platform plugin.
   *
   * @param plugin - the platform plugin to register
   * @precondition plugin.name is unique across registered plugins
   * @postcondition plugin is available for URL matching and API calls
   * @idempotency Re-registering the same name overwrites the previous plugin
   */
  register(plugin: PlatformPlugin): void;

  /**
   * Retrieve content by URL. Automatically routes to the correct plugin.
   *
   * @param url - content URL to resolve and fetch
   * @returns the resolved content (LiveStream, ScheduledStream, or Video)
   * @precondition url matches a registered plugin
   * @postcondition returns Content (LiveStream, ScheduledStream, or Video)
   * @throws PlatformNotFoundError if no plugin matches the URL
   */
  getContent(url: string): Promise<Content>;

  /**
   * Retrieve content by platform name and ID.
   *
   * @param platform - platform name
   * @param id - content identifier
   * @returns the resolved content (LiveStream, ScheduledStream, or Video)
   * @precondition platform is registered
   * @postcondition returns Content (LiveStream, ScheduledStream, or Video)
   * @throws PlatformNotFoundError if platform is not registered
   */
  getContentById(platform: string, id: string): Promise<Content>;

  /**
   * List currently active live streams for a channel.
   *
   * @param platform - platform name
   * @param channelId - channel identifier
   * @returns active live streams for the channel
   * @precondition platform is registered
   * @throws PlatformNotFoundError if platform is not registered
   */
  getLiveStreams(platform: string, channelId: string): Promise<LiveStream[]>;

  /**
   * List videos for a channel with cursor-based pagination.
   *
   * @param platform - platform name
   * @param channelId - channel identifier
   * @param cursor - pagination cursor
   * @returns paginated list of videos
   * @precondition platform is registered
   * @throws PlatformNotFoundError if platform is not registered
   */
  getVideos(
    platform: string,
    channelId: string,
    cursor?: string,
    pageSize?: number,
  ): Promise<Page<Video>>;

  /**
   * Retrieve channel information.
   *
   * @param platform - platform name
   * @param id - channel identifier
   * @returns channel information
   * @precondition platform is registered
   * @throws PlatformNotFoundError if platform is not registered
   */
  getChannel(platform: string, id: string): Promise<Channel>;

  /**
   * Batch retrieve content by platform and IDs.
   *
   * @param platform - platform name
   * @param ids - content identifiers
   * @returns batch result with values and per-item errors
   * @precondition platform is registered
   * @postcondition request-level errors (rate limit, auth, network) are thrown, per-item errors go to errors map
   * @throws PlatformNotFoundError if platform is not registered
   */
  getContents(platform: string, ids: string[]): Promise<BatchResult<Content>>;

  /**
   * Batch retrieve live streams by platform and channel IDs.
   *
   * @param platform - platform name
   * @param channelIds - channel identifiers
   * @returns batch result with values (LiveStream[] per channel) and per-item errors
   * @precondition platform is registered
   * @postcondition request-level errors (rate limit, auth, network) are thrown, per-item errors go to errors map
   * @throws PlatformNotFoundError if platform is not registered
   */
  getLiveStreamsBatch(platform: string, channelIds: string[]): Promise<BatchResult<LiveStream[]>>;

  /**
   * Search content on a platform. At least one of query/status/channelId required.
   *
   * @param platform - platform name
   * @param options - search options (query, status, channelId, order, limit, cursor)
   * @returns paginated search results
   * @precondition platform is registered and supports search
   * @precondition at least one of options.query, options.status, or options.channelId is provided
   * @throws PlatformNotFoundError if platform is not registered
   * @throws ValidationError if no query, status, or channelId provided, or platform doesn't support search
   */
  search(platform: string, options: SearchOptions): Promise<Page<Content>>;

  /**
   * Access a specific platform plugin.
   *
   * @param name - platform name to look up
   * @returns the registered platform plugin
   * @throws PlatformNotFoundError if platform is not registered
   */
  platform(name: string): PlatformPlugin;

  /**
   * Parse a URL to determine which platform and resource it refers to.
   * No network calls.
   *
   * @param url - URL to match against registered plugins
   * @returns resolved URL info, or null if no plugin matches
   * @postcondition returns ResolvedUrl or null if no plugin matches
   */
  match(url: string): ResolvedUrl | null;

  /**
   * Returns the names of all registered platforms.
   *
   * @returns array of platform name strings
   * @postcondition returns a snapshot of currently registered platform names
   */
  platforms(): string[];

  /**
   * Release all resources (rate limit timers, token refresh schedulers).
   *
   * @idempotency Safe to call multiple times
   */
  [Symbol.dispose](): void;
};

/**
 * Companion object for the UnifiedClient type.
 * Provides factory utility.
 *
 * @category Client
 * @example
 * ```ts
 * const client = UnifiedClient.create({ plugins: [twitchPlugin] });
 * ```
 */
export const UnifiedClient = {
  /**
   * Creates the main SDK client that manages plugins and routes requests.
   *
   * @param options - client configuration with optional plugins
   * @returns a new UnifiedClient instance
   * @precondition none
   * @postcondition returns a fully functional UnifiedClient
   * @idempotency Not idempotent — each call creates a new client
   */
  create(options?: UnifiedClientOptions): UnifiedClient {
    const plugins = new Map<string, PlatformPlugin>();
    const tracer = getTracer(options?.tracerProvider);

    if (options?.plugins) {
      for (const plugin of options.plugins) {
        plugins.set(plugin.name, plugin);
      }
    }

    const getPlugin = (name: string): PlatformPlugin => {
      const plugin = plugins.get(name);
      if (!plugin) {
        throw new PlatformNotFoundError(name);
      }
      return plugin;
    };

    const isRequestLevelError = (error: unknown): boolean => {
      if (error instanceof RateLimitError) return true;
      if (error instanceof QuotaExhaustedError) return true;
      if (error instanceof AuthenticationError) return true;
      if (error instanceof NetworkError) return true;
      return false;
    };

    const batchFallback = async <T>(
      fn: (id: string) => Promise<T>,
      ids: string[],
      platform: string,
    ): Promise<BatchResult<T>> => {
      const CONCURRENCY = 10;
      const values = new Map<string, T>();
      const errors = new Map<string, UnifiedLiveError>();

      for (let i = 0; i < ids.length; i += CONCURRENCY) {
        const chunk = ids.slice(i, i + CONCURRENCY);
        const settled = await Promise.allSettled(
          chunk.map(async (id) => ({ id, value: await fn(id) })),
        );
        for (const [j, result] of settled.entries()) {
          if (result.status === "fulfilled") {
            values.set(result.value.id, result.value.value);
          } else {
            if (isRequestLevelError(result.reason)) throw result.reason;
            const id = chunk[j] as string;
            errors.set(
              id,
              result.reason instanceof UnifiedLiveError
                ? result.reason
                : new UnifiedLiveError(result.reason?.message ?? "Unknown error", "INTERNAL", {
                    platform,
                    resourceId: id,
                  }),
            );
          }
        }
      }

      return { values, errors };
    };

    const matchUrl = (url: string): ResolvedUrl | null => {
      for (const plugin of plugins.values()) {
        const resolved = plugin.match(url);
        if (resolved) {
          return resolved;
        }
      }
      return null;
    };

    const withClientSpan = async <T>(
      operationName: string,
      attrs: Record<string, string | number>,
      fn: () => Promise<T>,
    ): Promise<T> => {
      return tracer.startActiveSpan(
        `unified-live.client ${operationName}`,
        async (span) => {
          span.setAttribute(SpanAttributes.OPERATION, operationName);
          for (const [k, v] of Object.entries(attrs)) span.setAttribute(k, v);
          try {
            const result = await fn();
            span.end();
            return result;
          } catch (error) {
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: error instanceof Error ? error.message : String(error),
            });
            span.recordException(error instanceof Error ? error : new Error(String(error)));
            span.end();
            throw error;
          }
        },
      );
    };

    const client: UnifiedClient = {
      register(plugin: PlatformPlugin): void {
        plugins.set(plugin.name, plugin);
      },

      async getContent(url: string): Promise<Content> {
        if (!url) {
          throw new ValidationError("VALIDATION_INVALID_INPUT", "URL must be a non-empty string");
        }
        const resolved = matchUrl(url);
        if (!resolved) {
          throw new ValidationError(
            "VALIDATION_INVALID_URL",
            `No registered plugin matches URL: "${url}"`,
          );
        }
        return withClientSpan(
          "getContent",
          { [SpanAttributes.PLATFORM]: resolved.platform },
          () => {
            const plugin = getPlugin(resolved.platform);
            return plugin.getContent(resolved.id);
          },
        );
      },

      async getContentById(platform: string, id: string): Promise<Content> {
        return withClientSpan("getContentById", { [SpanAttributes.PLATFORM]: platform }, () => {
          const plugin = getPlugin(platform);
          return plugin.getContent(id);
        });
      },

      async getLiveStreams(platform: string, channelId: string): Promise<LiveStream[]> {
        return withClientSpan("getLiveStreams", { [SpanAttributes.PLATFORM]: platform }, () => {
          const plugin = getPlugin(platform);
          return plugin.getLiveStreams(channelId);
        });
      },

      async getVideos(
        platform: string,
        channelId: string,
        cursor?: string,
        pageSize?: number,
      ): Promise<Page<Video>> {
        return withClientSpan("getVideos", { [SpanAttributes.PLATFORM]: platform }, () => {
          const plugin = getPlugin(platform);
          return plugin.getVideos(channelId, cursor, pageSize);
        });
      },

      async getChannel(platform: string, id: string): Promise<Channel> {
        return withClientSpan("getChannel", { [SpanAttributes.PLATFORM]: platform }, () => {
          const plugin = getPlugin(platform);
          return plugin.getChannel(id);
        });
      },

      async getContents(platform: string, ids: string[]): Promise<BatchResult<Content>> {
        if (ids.length === 0) return BatchResult.empty();
        return withClientSpan(
          "getContents",
          {
            [SpanAttributes.PLATFORM]: platform,
            [SpanAttributes.BATCH_SIZE]: ids.length,
          },
          () => {
            const plugin = getPlugin(platform);
            const uniqueIds = [...new Set(ids)];
            if (plugin.getContents) {
              return plugin.getContents(uniqueIds);
            }
            return batchFallback((id) => plugin.getContent(id), uniqueIds, platform);
          },
        );
      },

      async getLiveStreamsBatch(
        platform: string,
        channelIds: string[],
      ): Promise<BatchResult<LiveStream[]>> {
        if (channelIds.length === 0) return BatchResult.empty();
        return withClientSpan(
          "getLiveStreamsBatch",
          {
            [SpanAttributes.PLATFORM]: platform,
            [SpanAttributes.BATCH_SIZE]: channelIds.length,
          },
          () => {
            const plugin = getPlugin(platform);
            const uniqueIds = [...new Set(channelIds)];
            if (plugin.getLiveStreamsBatch) {
              return plugin.getLiveStreamsBatch(uniqueIds);
            }
            return batchFallback((id) => plugin.getLiveStreams(id), uniqueIds, platform);
          },
        );
      },

      async search(platform: string, searchOptions: SearchOptions): Promise<Page<Content>> {
        return withClientSpan("search", { [SpanAttributes.PLATFORM]: platform }, () => {
          const plugin = getPlugin(platform);
          if (!searchOptions.query && !searchOptions.status && !searchOptions.channelId) {
            throw new ValidationError(
              "VALIDATION_INVALID_INPUT",
              "search requires at least one of 'query', 'status', or 'channelId'",
            );
          }
          if (!plugin.search) {
            throw new ValidationError(
              "VALIDATION_INVALID_INPUT",
              `Platform '${platform}' does not support search`,
            );
          }
          return plugin.search(searchOptions);
        });
      },

      platform(name: string): PlatformPlugin {
        return getPlugin(name);
      },

      match(url: string): ResolvedUrl | null {
        return matchUrl(url);
      },

      /**
       * Returns the names of all registered platforms.
       *
       * @returns array of platform name strings
       */
      platforms(): string[] {
        return [...plugins.keys()];
      },

      [Symbol.dispose](): void {
        for (const plugin of plugins.values()) {
          plugin[Symbol.dispose]();
        }
        plugins.clear();
      },
    };

    return client;
  },

  /**
   * Type guard for UnifiedClient.
   *
   * @param value - the value to check
   * @returns true if value implements UnifiedClient interface
   * @postcondition returns true if value has all required UnifiedClient methods
   */
  is(value: unknown): value is UnifiedClient {
    if (typeof value !== "object" || value === null) return false;
    const obj = value as Record<string | symbol, unknown>;
    return (
      typeof obj.register === "function" &&
      typeof obj.getContent === "function" &&
      typeof obj.getContentById === "function" &&
      typeof obj.getLiveStreams === "function" &&
      typeof obj.getVideos === "function" &&
      typeof obj.getChannel === "function" &&
      typeof obj.getContents === "function" &&
      typeof obj.getLiveStreamsBatch === "function" &&
      typeof obj.search === "function" &&
      typeof obj.platform === "function" &&
      typeof obj.match === "function" &&
      typeof obj.platforms === "function" &&
      typeof obj[Symbol.dispose] === "function"
    );
  },
} as const;
