import type { RestManager } from "./rest/manager.js";
import type {
  Channel,
  Content,
  LiveStream,
  Page,
  ResolvedUrl,
  Video,
} from "./types.js";

/**
 * A platform-specific plugin that implements data retrieval for a single streaming platform.
 *
 * @precondition Each plugin instance is bound to a single platform
 * @postcondition All returned data conforms to the unified Content/Channel types
 */
export type PlatformPlugin = {
  /** Platform identifier (e.g., "youtube", "twitch", "twitcasting"). */
  readonly name: string;

  /** The underlying RestManager for this plugin. */
  readonly rest: RestManager;

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
  getVideos(channelId: string, cursor?: string): Promise<Page<Video>>;

  /** Resolve the archive video for a live stream (platform-specific). */
  resolveArchive?(live: LiveStream): Promise<Video | null>;

  /** Release resources (timers, connections). */
  dispose(): void;
};
