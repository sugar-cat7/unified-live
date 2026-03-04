import { z } from "zod";

/**
 * Google Cloud Logging Severity levels
 * @see https://cloud.google.com/logging/docs/reference/v2/rest/v2/LogEntry#LogSeverity
 */
export const LogSeveritySchema = z.enum([
  "DEFAULT",
  "DEBUG",
  "INFO",
  "NOTICE",
  "WARNING",
  "ERROR",
  "CRITICAL",
  "ALERT",
  "EMERGENCY",
]);
export type LogSeverity = z.infer<typeof LogSeveritySchema>;

/**
 * Source location schema for Google Cloud Logging
 */
export const SourceLocationSchema = z.object({
  file: z.string().optional(),
  line: z.string().optional(),
  function: z.string().optional(),
});
export type SourceLocation = z.infer<typeof SourceLocationSchema>;

/**
 * HTTP Request schema for Google Cloud Logging
 */
export const HttpRequestSchema = z.object({
  requestMethod: z.string().optional(),
  requestUrl: z.string().optional(),
  requestSize: z.string().optional(),
  status: z.number().optional(),
  responseSize: z.string().optional(),
  userAgent: z.string().optional(),
  remoteIp: z.string().optional(),
  serverIp: z.string().optional(),
  referer: z.string().optional(),
  latency: z.string().optional(),
  cacheLookup: z.boolean().optional(),
  cacheHit: z.boolean().optional(),
  cacheValidatedWithOriginServer: z.boolean().optional(),
  cacheFillBytes: z.string().optional(),
  protocol: z.string().optional(),
});
export type HttpRequest = z.infer<typeof HttpRequestSchema>;

/**
 * Operation schema for Google Cloud Logging
 */
export const OperationSchema = z.object({
  id: z.string().optional(),
  producer: z.string().optional(),
  first: z.boolean().optional(),
  last: z.boolean().optional(),
});
export type Operation = z.infer<typeof OperationSchema>;

/**
 * Google Cloud Logging structured log entry
 */
export const GcpLogEntrySchema = z.object({
  severity: LogSeveritySchema,
  message: z.string(),
  time: z.string(),
  "logging.googleapis.com/insertId": z.string().optional(),
  "logging.googleapis.com/labels": z.record(z.string(), z.string()).optional(),
  "logging.googleapis.com/operation": OperationSchema.optional(),
  "logging.googleapis.com/sourceLocation": SourceLocationSchema.optional(),
  "logging.googleapis.com/spanId": z.string().optional(),
  "logging.googleapis.com/trace": z.string().optional(),
  "logging.googleapis.com/trace_sampled": z.boolean().optional(),
  httpRequest: HttpRequestSchema.optional(),
});
export type GcpLogEntry = z.infer<typeof GcpLogEntrySchema>;

/**
 * Logger configuration schema
 */
export const LoggerConfigSchema = z.object({
  /** Logger name for identification */
  name: z.string().optional(),
  /** Minimum log level (0=silly, 3=info, 5=error, 6=fatal) */
  minLevel: z.number().min(0).max(6).default(0),
  /** GCP Project ID for trace URL generation */
  projectId: z.string().optional(),
  /** Default labels to include in every log entry */
  defaultLabels: z.record(z.string(), z.string()).optional(),
  /** Service name for identification */
  serviceName: z.string().optional(),
  /** Service version */
  serviceVersion: z.string().optional(),
});
export type LoggerConfig = z.infer<typeof LoggerConfigSchema>;

/**
 * Log context that can be passed to individual log calls
 */
export const LogContextSchema = z.object({
  /** Trace ID for distributed tracing */
  traceId: z.string().optional(),
  /** Span ID for distributed tracing */
  spanId: z.string().optional(),
  /** Whether the trace is sampled */
  traceSampled: z.boolean().optional(),
  /** HTTP request information */
  httpRequest: HttpRequestSchema.optional(),
  /** Operation information */
  operation: OperationSchema.optional(),
  /** Additional labels for this log entry */
  labels: z.record(z.string(), z.string()).optional(),
  /** Insert ID for deduplication */
  insertId: z.string().optional(),
});
export type LogContext = z.infer<typeof LogContextSchema>;
