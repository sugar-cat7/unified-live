export { createBasicAuthTokenManager } from "./auth";
export type { TCMovie, TCUser } from "./mapper";
export { toContent, toLive, toVideo, toChannel } from "./mapper";
export type { TwitCastingPluginConfig } from "./plugin";
export { createTwitCastingPlugin } from "./plugin";
export { matchTwitCastingUrl } from "./urls";

import type { Archive, Broadcast, Content } from "@unified-live/core";
import type { TCMovie } from "./mapper";

/** Content from TwitCasting with typed `raw` field for accessing platform-specific data. */
export type TwitCastingTypedContent = Content & { raw: TCMovie };
/** Broadcast from TwitCasting with typed `raw` field. */
export type TwitCastingTypedBroadcast = Broadcast & { raw: TCMovie };
/** Archive from TwitCasting with typed `raw` field. */
export type TwitCastingTypedArchive = Archive & { raw: TCMovie };
