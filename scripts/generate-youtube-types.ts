/**
 * Fetches the YouTube Data API v3 Discovery Document from Google,
 * converts the relevant schemas to OpenAPI 3.1, and generates
 * TypeScript types using openapi-typescript.
 *
 * Usage: npx tsx scripts/generate-youtube-types.ts
 */
import fs from "node:fs";
import path from "node:path";
import openapiTS, { astToString } from "openapi-typescript";

const DISCOVERY_URL = "https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest";

/** Schemas the SDK actually references (and their transitive dependencies). */
const REQUIRED_SCHEMAS = new Set([
  "Video",
  "VideoSnippet",
  "VideoContentDetails",
  "VideoStatistics",
  "VideoLiveStreamingDetails",
  "Channel",
  "ChannelSnippet",
  "ChannelContentDetails",
  "PlaylistItem",
  "PlaylistItemSnippet",
  "Thumbnail",
  "ThumbnailDetails",
  "ResourceId",
  "PageInfo",
  "SearchResult",
  "SearchResultSnippet",
  "VideoListResponse",
  "ChannelListResponse",
  "PlaylistItemListResponse",
  "SearchListResponse",
]);

type DiscoverySchema = {
  type?: string;
  description?: string;
  properties?: Record<string, DiscoverySchema>;
  items?: DiscoverySchema;
  $ref?: string;
  enum?: string[];
  enumDescriptions?: string[];
  format?: string;
  additionalProperties?: DiscoverySchema;
  annotations?: unknown;
  deprecated?: boolean;
  default?: string;
  required?: boolean;
};

type DiscoveryDoc = {
  schemas: Record<string, DiscoverySchema>;
};

/**
 * Convert a Google Discovery schema property to an OpenAPI 3.1 schema.
 * Handles $ref rewriting, format mapping, and nested objects.
 */
const convertProperty = (prop: DiscoverySchema): Record<string, unknown> => {
  if (prop.$ref) {
    return { $ref: `#/components/schemas/${prop.$ref}` };
  }

  const result: Record<string, unknown> = {};

  if (prop.description) result.description = prop.description;
  if (prop.deprecated) result.deprecated = true;

  if (prop.type === "array" && prop.items) {
    result.type = "array";
    result.items = convertProperty(prop.items);
    return result;
  }

  if (prop.type === "object" && prop.properties) {
    result.type = "object";
    result.properties = Object.fromEntries(
      Object.entries(prop.properties).map(([k, v]) => [k, convertProperty(v)]),
    );
    return result;
  }

  if (prop.type === "object" && prop.additionalProperties) {
    result.type = "object";
    result.additionalProperties = convertProperty(prop.additionalProperties);
    return result;
  }

  if (prop.enum) {
    result.type = prop.type ?? "string";
    result.enum = prop.enum;
    return result;
  }

  // Map Discovery "format" to OpenAPI types
  if (prop.type === "integer" || prop.format === "int32" || prop.format === "uint32") {
    result.type = "integer";
    return result;
  }

  if (prop.format === "int64" || prop.format === "uint64") {
    // YouTube API returns these as strings
    result.type = "string";
    return result;
  }

  if (prop.format === "date-time") {
    result.type = "string";
    result.format = "date-time";
    return result;
  }

  if (prop.format === "double" || prop.format === "float") {
    result.type = "number";
    return result;
  }

  result.type = prop.type ?? "string";
  return result;
};

/**
 * Convert a top-level Discovery schema to an OpenAPI 3.1 schema object.
 */
const convertSchema = (schema: DiscoverySchema): Record<string, unknown> => {
  const result: Record<string, unknown> = {
    type: "object",
  };
  if (schema.description) result.description = schema.description;

  if (schema.properties) {
    result.properties = Object.fromEntries(
      Object.entries(schema.properties).map(([k, v]) => [k, convertProperty(v)]),
    );
  }
  return result;
};

/**
 * Resolve transitive $ref dependencies for the required schemas.
 */
const resolveRefs = (
  schemas: Record<string, DiscoverySchema>,
  required: Set<string>,
): Set<string> => {
  const resolved = new Set<string>();
  const queue = [...required];

  const collectRefs = (obj: DiscoverySchema): void => {
    if (obj.$ref && !resolved.has(obj.$ref)) {
      queue.push(obj.$ref);
    }
    if (obj.properties) {
      for (const v of Object.values(obj.properties)) collectRefs(v);
    }
    if (obj.items) collectRefs(obj.items);
    if (obj.additionalProperties && typeof obj.additionalProperties === "object") {
      collectRefs(obj.additionalProperties);
    }
  };

  while (queue.length > 0) {
    const name = queue.pop()!;
    if (resolved.has(name)) continue;
    resolved.add(name);

    const schema = schemas[name];
    if (!schema?.properties) continue;
    collectRefs(schema);
  }

  return resolved;
};

const main = async () => {
  console.log("Fetching YouTube Data API v3 Discovery Document...");
  const res = await fetch(DISCOVERY_URL, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
  const discovery: DiscoveryDoc = await res.json();

  if (!discovery.schemas || typeof discovery.schemas !== "object") {
    throw new Error("Invalid Discovery Document: missing schemas object");
  }

  // Resolve all required schemas including transitive dependencies
  const allRequired = resolveRefs(discovery.schemas, REQUIRED_SCHEMAS);
  console.log(`Converting ${allRequired.size} schemas (from ${REQUIRED_SCHEMAS.size} roots)...`);

  // Build OpenAPI 3.1 document with only the required schemas
  const openapi = {
    openapi: "3.1.0",
    info: {
      title: "YouTube Data API v3 (subset)",
      version: "v3",
      description:
        "Auto-generated from Google Discovery Document. Contains only schemas used by unified-live SDK.",
    },
    paths: {},
    components: {
      schemas: Object.fromEntries(
        [...allRequired]
          .sort()
          .filter((name) => discovery.schemas[name])
          .map((name) => [name, convertSchema(discovery.schemas[name])]),
      ),
    },
  };

  const outDir = path.resolve(
    new URL("..", import.meta.url).pathname,
    "packages/youtube/src/generated",
  );
  fs.mkdirSync(outDir, { recursive: true });

  // Generate TypeScript types
  const ast = await openapiTS(openapi as never);
  const contents = [
    "// Auto-generated from YouTube Data API v3 Discovery Document.",
    "// Do not edit manually. Run: npx tsx scripts/generate-youtube-types.ts",
    "",
    astToString(ast),
  ].join("\n");

  const tsPath = path.join(outDir, "youtube-api.d.ts");
  fs.writeFileSync(tsPath, contents);
  console.log(`Wrote TypeScript types: ${tsPath}`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
