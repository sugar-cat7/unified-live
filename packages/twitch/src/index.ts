export { createClientCredentialsTokenManager } from "./auth";
export type { TwitchStream, TwitchUser, TwitchVideo } from "./mapper";
export { parseDuration, toChannel, toLive, toVideo } from "./mapper";
export type { TwitchPluginConfig } from "./plugin";
export { createTwitchPlugin } from "./plugin";
export { matchTwitchUrl } from "./urls";

import type { Content, LiveStream, Video } from "@unified-live/core";
import type { TwitchStream, TwitchVideo } from "./mapper";

/** Content from Twitch with typed `raw` field for accessing platform-specific data. */
export type TwitchTypedContent = Content & { raw: TwitchStream | TwitchVideo };
/** LiveStream from Twitch with typed `raw` field. */
export type TwitchTypedLiveStream = LiveStream & { raw: TwitchStream };
/** Video from Twitch with typed `raw` field. */
export type TwitchTypedVideo = Video & { raw: TwitchVideo };
