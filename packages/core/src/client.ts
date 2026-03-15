import { PlatformNotFoundError, ValidationError } from "./errors";
import type { PlatformPlugin } from "./plugin";
import type { Channel, Content, LiveStream, Page, ResolvedUrl, Video } from "./types";

export type UnifiedClientOptions = {
  plugins?: PlatformPlugin[];
};

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
   * @returns the resolved content (LiveStream or Video)
   * @precondition url matches a registered plugin
   * @postcondition returns Content (LiveStream or Video)
   * @throws PlatformNotFoundError if no plugin matches the URL
   */
  getContent(url: string): Promise<Content>;

  /**
   * Retrieve content by platform name and ID.
   *
   * @param platform - platform name
   * @param id - content identifier
   * @returns the resolved content (LiveStream or Video)
   * @precondition platform is registered
   * @postcondition returns Content (LiveStream or Video)
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
  dispose(): void;
};

/**
 * Companion object for the UnifiedClient type.
 * Provides factory utility.
 *
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

    const matchUrl = (url: string): ResolvedUrl | null => {
      for (const plugin of plugins.values()) {
        const resolved = plugin.match(url);
        if (resolved) {
          return resolved;
        }
      }
      return null;
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
          throw new PlatformNotFoundError(url);
        }
        const plugin = getPlugin(resolved.platform);
        return plugin.getContent(resolved.id);
      },

      async getContentById(platform: string, id: string): Promise<Content> {
        const plugin = getPlugin(platform);
        return plugin.getContent(id);
      },

      async getLiveStreams(platform: string, channelId: string): Promise<LiveStream[]> {
        const plugin = getPlugin(platform);
        return plugin.getLiveStreams(channelId);
      },

      async getVideos(
        platform: string,
        channelId: string,
        cursor?: string,
        pageSize?: number,
      ): Promise<Page<Video>> {
        const plugin = getPlugin(platform);
        return plugin.getVideos(channelId, cursor, pageSize);
      },

      async getChannel(platform: string, id: string): Promise<Channel> {
        const plugin = getPlugin(platform);
        return plugin.getChannel(id);
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

      dispose(): void {
        for (const plugin of plugins.values()) {
          plugin.dispose();
        }
        plugins.clear();
      },
    };

    return client;
  },
} as const;
