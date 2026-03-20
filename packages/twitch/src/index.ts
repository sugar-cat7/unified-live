export { createClientCredentialsTokenManager } from "./auth";
export type { TwitchClip, TwitchStream, TwitchUser, TwitchVideo } from "./mapper";
export { parseDuration, toChannel, toClip, toLive, toVideo } from "./mapper";
export type { TwitchVideoOptions } from "./methods";
export type { TwitchPluginConfig } from "./plugin";
export { createTwitchPlugin } from "./plugin";
export { matchTwitchUrl } from "./urls";

import type { Archive, Broadcast, Clip, Content } from "@unified-live/core";
import type { TwitchClip, TwitchStream, TwitchVideo } from "./mapper";

/** Content from Twitch with typed `raw` field for accessing platform-specific data. */
export type TwitchTypedContent = Content & { raw: TwitchStream | TwitchVideo | TwitchClip };
/** Broadcast from Twitch with typed `raw` field. */
export type TwitchTypedBroadcast = Broadcast & { raw: TwitchStream };
/** Archive from Twitch with typed `raw` field. */
export type TwitchTypedArchive = Archive & { raw: TwitchVideo };
/** Clip from Twitch with typed `raw` field. */
export type TwitchTypedClip = Clip & { raw: TwitchClip };
