export { TokenManager } from "./auth/types";
export type { UnifiedClientOptions } from "./client";
export { UnifiedClient } from "./client";
export type { ErrorCode, ErrorContext, NetworkCode, QuotaDetails } from "./errors";
export {
  AuthenticationError,
  classifyNetworkError,
  NetworkError,
  NotFoundError,
  ParseError,
  PlatformNotFoundError,
  QuotaExhaustedError,
  RateLimitError,
  UnifiedLiveError,
  ValidationError,
} from "./errors";
export type { PluginDefinition, PluginMethods } from "./plugin";
export { PlatformPlugin } from "./plugin";
export type { TokenBucketConfig } from "./rest/bucket";
export { createTokenBucketStrategy } from "./rest/bucket";
export type { RestManager } from "./rest/manager";
export { createRestManager, parseRetryAfter } from "./rest/manager";
export type { QuotaBudgetConfig } from "./rest/quota";
export { createQuotaBudgetStrategy } from "./rest/quota";
export type { RateLimitHandle, RateLimitStatus, RateLimitStrategy } from "./rest/strategy";
export type {
  RateLimitInfo,
  RestManagerOptions,
  RestRequest,
  RestResponse,
  RetryConfig,
} from "./rest/types";
export { createRateLimitHeaderParser } from "./rest/types";
export type { ErrResult, OkResult, Result } from "./result";
export { Err, Ok, unwrap, wrap } from "./result";
export { getTracer, SpanAttributes } from "./telemetry/traces";
export type { BroadcastSession, Channel, LiveStream, Page, ResolvedUrl, Video } from "./types";
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
} from "./types";
