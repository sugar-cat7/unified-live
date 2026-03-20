export { createClientCredentialsTokenManager } from "./auth";
export type { TwitchClip, TwitchStream, TwitchUser, TwitchVideo } from "./mapper";
export { parseDuration, toChannel, toClip, toLive, toVideo } from "./mapper";
export type { TwitchVideoOptions } from "./methods";
export type { TwitchPluginConfig } from "./plugin";
export { createTwitchPlugin } from "./plugin";
export { matchTwitchUrl } from "./urls";

import type { Clip, Content, LiveStream, Video } from "@unified-live/core";
import type { TwitchClip, TwitchStream, TwitchVideo } from "./mapper";

/** Content from Twitch with typed `raw` field for accessing platform-specific data. */
export type TwitchTypedContent = Content & { raw: TwitchStream | TwitchVideo | TwitchClip };
/** LiveStream from Twitch with typed `raw` field. */
export type TwitchTypedLiveStream = LiveStream & { raw: TwitchStream };
/** Video from Twitch with typed `raw` field. */
export type TwitchTypedVideo = Video & { raw: TwitchVideo };
/** Clip from Twitch with typed `raw` field. */
export type TwitchTypedClip = Clip & { raw: TwitchClip };
