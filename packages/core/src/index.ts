// --- Auth ---
export { TokenManager } from "./auth/types";

// --- Client ---
export type { UnifiedClientOptions } from "./client";
export { UnifiedClient } from "./client";

// --- Errors ---
export type { ErrorContext, NetworkCode, QuotaDetails } from "./errors";
export {
  AuthenticationError,
  classifyNetworkError,
  ErrorCode,
  NetworkError,
  NotFoundError,
  ParseError,
  PlatformNotFoundError,
  QuotaExhaustedError,
  RateLimitError,
  UnifiedLiveError,
  ValidationError,
} from "./errors";

// --- Plugin ---
export type { PluginCapabilities, PluginDefinition, PluginMethods } from "./plugin";
export { PlatformPlugin } from "./plugin";

// --- REST ---
export type { TokenBucketConfig } from "./rest/bucket";
export { createTokenBucketStrategy } from "./rest/bucket";
export { createRestManager, parseRetryAfter, RestManager } from "./rest/manager";
export type { QuotaBudgetConfig } from "./rest/quota";
export { createQuotaBudgetStrategy } from "./rest/quota";
export type { RateLimitHandle, RateLimitStatus } from "./rest/strategy";
export { RateLimitStrategy } from "./rest/strategy";
export type {
  RateLimitInfo,
  RestManagerOptions,
  RestRequest,
  RestResponse,
  RetryConfig,
} from "./rest/types";
export { createRateLimitHeaderParser } from "./rest/types";

// --- Result (internal) ---
export type { ErrResult, OkResult, Result } from "./result";
export { Err, Ok, unwrap, wrap } from "./result";

// --- Telemetry ---
export { getTracer, SpanAttributes } from "./telemetry/traces";
export { getMeter, MetricNames } from "./telemetry/metrics";

// --- Types ---
export type { ClipOptions, KnownPlatform, ResolvedUrl, SearchOptions } from "./types";
export {
  BatchResult,
  Channel,
  channelRefSchema,
  channelSchema,
  Clip,
  clipOptionsSchema,
  clipSchema,
  Content,
  contentSchema,
  knownPlatforms,
  LiveStream,
  liveStreamSchema,
  Page,
  resolvedUrlSchema,
  ScheduledStream,
  scheduledStreamSchema,
  searchOptionsSchema,
  thumbnailSchema,
  Video,
  videoSchema,
} from "./types";
