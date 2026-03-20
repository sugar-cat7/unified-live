export type { Schemas, YTChannelResource, YTVideoResource } from "./mapper";
export { parseDuration, toChannel, toContent } from "./mapper";
export type { YouTubePluginConfig } from "./plugin";
export { createYouTubePlugin } from "./plugin";
export { createYouTubeQuotaStrategy, YOUTUBE_COST_MAP } from "./quota";
export { matchYouTubeUrl } from "./urls";

import type { Archive, Broadcast, Content } from "@unified-live/core";
import type { YTVideoResource } from "./mapper";

/** Content from YouTube with typed `raw` field for accessing platform-specific data. */
export type YouTubeTypedContent = Content & { raw: YTVideoResource };
/** Broadcast from YouTube with typed `raw` field. */
export type YouTubeTypedBroadcast = Broadcast & { raw: YTVideoResource };
/** Archive from YouTube with typed `raw` field. */
export type YouTubeTypedArchive = Archive & { raw: YTVideoResource };
