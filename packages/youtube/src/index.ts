export type { Schemas, YTChannelResource, YTPlaylistItemResource, YTVideoResource } from "./mapper";
export { parseDuration, toChannel, toContent } from "./mapper";
export type { YouTubePluginConfig } from "./plugin";
export { createYouTubePlugin } from "./plugin";
export { createYouTubeQuotaStrategy, YOUTUBE_COST_MAP } from "./quota";
export { matchYouTubeUrl } from "./urls";

import type { Content, LiveStream, Video } from "@unified-live/core";
import type { YTVideoResource } from "./mapper";

/** Content from YouTube with typed `raw` field for accessing platform-specific data. */
export type YouTubeTypedContent = Content & { raw: YTVideoResource };
/** LiveStream from YouTube with typed `raw` field. */
export type YouTubeTypedLiveStream = LiveStream & { raw: YTVideoResource };
/** Video from YouTube with typed `raw` field. */
export type YouTubeTypedVideo = Video & { raw: YTVideoResource };
