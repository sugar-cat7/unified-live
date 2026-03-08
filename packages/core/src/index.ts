export { createStaticTokenManager } from "./auth/static.js";
export type { TokenManager } from "./auth/types.js";
export type { UnifiedClient, UnifiedClientOptions } from "./client.js";
export { createClient } from "./client.js";
export {
  AuthenticationError,
  NotFoundError,
  PlatformNotFoundError,
  QuotaExhaustedError,
  RateLimitError,
  UnifiedLiveError,
} from "./errors.js";
export type { PluginDefinition, PluginMethods } from "./plugin.js";
export { PlatformPlugin } from "./plugin.js";
export type { TokenBucketConfig } from "./rest/bucket.js";
export { createTokenBucketStrategy } from "./rest/bucket.js";
export type { RestManager } from "./rest/manager.js";
export { createRestManager } from "./rest/manager.js";
export type { QuotaBudgetConfig } from "./rest/quota.js";
export { createQuotaBudgetStrategy } from "./rest/quota.js";
export type {
  RateLimitHandle,
  RateLimitStatus,
  RateLimitStrategy,
} from "./rest/strategy.js";
export type {
  RateLimitInfo,
  RestManagerOptions,
  RestRequest,
  RestResponse,
  RetryConfig,
} from "./rest/types.js";
export { createRateLimitHeaderParser } from "./rest/types.js";
export type { ErrResult, OkResult, Result } from "./result.js";
export { Err, Ok, unwrap, wrap } from "./result.js";
export { getTracer, SpanAttributes } from "./telemetry/traces.js";
export type {
  BroadcastSession,
  Channel,
  Content as ContentType,
  LiveStream,
  Page,
  ResolvedUrl,
  Video,
} from "./types.js";
export {
  broadcastSessionSchema,
  Content,
  channelRefSchema,
  channelSchema,
  contentSchema,
  liveStreamSchema,
  resolvedUrlSchema,
  thumbnailSchema,
  videoSchema,
} from "./types.js";
