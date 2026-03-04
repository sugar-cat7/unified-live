import type {
  GcpLogEntry,
  HttpRequest,
  LogContext,
  LogSeverity,
  LoggerConfig,
  Operation,
  SourceLocation,
} from "./schema";

/**
 * tslog log level IDs mapped to Google Cloud Logging severity
 */
const LOG_LEVEL_TO_SEVERITY: Record<number, LogSeverity> = {
  0: "DEBUG", // silly
  1: "DEBUG", // trace
  2: "DEBUG", // debug
  3: "INFO", // info
  4: "WARNING", // warn
  5: "ERROR", // error
  6: "CRITICAL", // fatal
};

/**
 * tslog meta information structure
 */
interface TslogMeta {
  runtime?: string;
  hostname?: string;
  date?: Date;
  logLevelId?: number;
  logLevelName?: string;
  path?: {
    fullFilePath?: string;
    fileName?: string;
    fileColumn?: string;
    fileLine?: string;
    filePath?: string;
    filePathWithLine?: string;
  };
  name?: string;
  parentNames?: string[];
}

/**
 * Log object from tslog
 */
interface TslogLogObj {
  _meta?: TslogMeta;
  [key: string]: unknown;
}

/**
 * Extracts source location from tslog meta
 */
function extractSourceLocation(meta?: TslogMeta): SourceLocation | undefined {
  if (!meta?.path) {
    return undefined;
  }

  return {
    file: meta.path.filePath ?? meta.path.fileName,
    line: meta.path.fileLine,
    function: undefined, // tslog doesn't provide function name
  };
}

/**
 * Extracts the message from log arguments
 */
function extractMessage(logObj: TslogLogObj): string {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(logObj)) {
    if (key === "_meta" || key === "context") {
      continue;
    }

    if (typeof value === "string") {
      parts.push(value);
    } else if (value instanceof Error) {
      parts.push(`${value.name}: ${value.message}`);
      if (value.stack) {
        parts.push(value.stack);
      }
    } else if (value !== undefined && value !== null) {
      try {
        parts.push(JSON.stringify(value));
      } catch {
        parts.push(String(value));
      }
    }
  }

  return parts.join(" ");
}

/**
 * Extracts additional data (non-string values) from log object
 */
function extractData(
  logObj: TslogLogObj,
): Record<string, unknown> | undefined {
  const data: Record<string, unknown> = {};
  let hasData = false;

  for (const [key, value] of Object.entries(logObj)) {
    if (key === "_meta" || key === "context") {
      continue;
    }

    // Include structured data and errors
    if (typeof value === "object" && value !== null && !(value instanceof Error)) {
      data[key] = value;
      hasData = true;
    } else if (value instanceof Error) {
      data[key] = {
        name: value.name,
        message: value.message,
        stack: value.stack,
      };
      hasData = true;
    }
  }

  return hasData ? data : undefined;
}

/**
 * Formats a trace ID into Google Cloud Logging format
 */
function formatTraceId(projectId: string | undefined, traceId: string): string {
  if (projectId) {
    return `projects/${projectId}/traces/${traceId}`;
  }
  return traceId;
}

/**
 * Formats a tslog log object to Google Cloud Logging JSON format
 */
export function formatToGcpJson(
  logObj: TslogLogObj,
  config: LoggerConfig,
  context?: LogContext,
): GcpLogEntry & Record<string, unknown> {
  const meta = logObj._meta;
  const severity = LOG_LEVEL_TO_SEVERITY[meta?.logLevelId ?? 3] ?? "INFO";
  const timestamp = meta?.date ?? new Date();

  const entry: GcpLogEntry & Record<string, unknown> = {
    severity,
    message: extractMessage(logObj),
    time: timestamp.toISOString(),
  };

  // Add source location
  const sourceLocation = extractSourceLocation(meta);
  if (sourceLocation) {
    entry["logging.googleapis.com/sourceLocation"] = sourceLocation;
  }

  // Add labels (merge default labels with context labels)
  const labels: Record<string, string> = {};

  if (config.defaultLabels) {
    for (const [key, value] of Object.entries(config.defaultLabels)) {
      labels[key] = value;
    }
  }

  if (context?.labels) {
    for (const [key, value] of Object.entries(context.labels)) {
      labels[key] = value;
    }
  }

  if (config.serviceName) {
    labels.serviceName = config.serviceName;
  }
  if (config.serviceVersion) {
    labels.serviceVersion = config.serviceVersion;
  }
  if (config.name) {
    labels.loggerName = config.name;
  }

  if (Object.keys(labels).length > 0) {
    entry["logging.googleapis.com/labels"] = labels;
  }

  // Add trace information
  if (context?.traceId) {
    entry["logging.googleapis.com/trace"] = formatTraceId(
      config.projectId,
      context.traceId,
    );
  }
  if (context?.spanId) {
    entry["logging.googleapis.com/spanId"] = context.spanId;
  }
  if (context?.traceSampled !== undefined) {
    entry["logging.googleapis.com/trace_sampled"] = context.traceSampled;
  }

  // Add HTTP request
  if (context?.httpRequest) {
    entry.httpRequest = context.httpRequest;
  }

  // Add operation
  if (context?.operation) {
    entry["logging.googleapis.com/operation"] = context.operation;
  }

  // Add insert ID
  if (context?.insertId) {
    entry["logging.googleapis.com/insertId"] = context.insertId;
  }

  // Add structured data
  const data = extractData(logObj);
  if (data) {
    entry.data = data;
  }

  return entry;
}

/**
 * Creates a GCP JSON transport function for tslog
 */
export function createGcpTransport(
  config: LoggerConfig,
  getContext?: () => LogContext | undefined,
): (logObj: TslogLogObj) => void {
  return (logObj: TslogLogObj) => {
    const context = getContext?.();
    const entry = formatToGcpJson(logObj, config, context);
    // Output as single-line JSON to stdout
    // biome-ignore lint/suspicious/noConsole: Logger needs direct console access
    console.log(JSON.stringify(entry));
  };
}

export type { TslogLogObj, TslogMeta, HttpRequest, Operation, SourceLocation };
