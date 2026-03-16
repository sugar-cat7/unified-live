export { createBasicAuthTokenManager } from "./auth";
export type { TCMovie, TCUser } from "./mapper";
export { toContent, toLive, toVideo, toChannel } from "./mapper";
export type { TwitCastingPluginConfig } from "./plugin";
export { createTwitCastingPlugin } from "./plugin";
export { matchTwitCastingUrl } from "./urls";

import type { Content, LiveStream, Video } from "@unified-live/core";
import type { TCMovie } from "./mapper";

/** Content from TwitCasting with typed `raw` field for accessing platform-specific data. */
export type TwitCastingTypedContent = Content & { raw: TCMovie };
/** LiveStream from TwitCasting with typed `raw` field. */
export type TwitCastingTypedLiveStream = LiveStream & { raw: TCMovie };
/** Video from TwitCasting with typed `raw` field. */
export type TwitCastingTypedVideo = Video & { raw: TCMovie };
