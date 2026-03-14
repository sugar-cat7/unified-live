import type { ResolvedUrl } from "@unified-live/core";

const CONTENT_PATTERNS = [
  // youtube.com/watch?v=<id>
  /^https?:\/\/(?:www\.)?youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
  // youtu.be/<id>
  /^https?:\/\/youtu\.be\/([a-zA-Z0-9_-]{11})/,
  // youtube.com/live/<id>
  /^https?:\/\/(?:www\.)?youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
];

const CHANNEL_PATTERNS = [
  // youtube.com/channel/<id>
  {
    pattern:
      /^https?:\/\/(?:www\.)?youtube\.com\/channel\/(UC[a-zA-Z0-9_-]{22})/,
    type: "id" as const,
  },
  // youtube.com/@<handle>
  {
    pattern: /^https?:\/\/(?:www\.)?youtube\.com\/@([a-zA-Z0-9_.-]+)/,
    type: "handle" as const,
  },
  // youtube.com/c/<name>
  {
    pattern: /^https?:\/\/(?:www\.)?youtube\.com\/c\/([a-zA-Z0-9_.-]+)/,
    type: "custom" as const,
  },
];

/**
 * Match a URL to a YouTube content or channel resource.
 *
 * @precondition url is a valid URL string
 * @postcondition returns ResolvedUrl for YouTube URLs, null otherwise
 * @idempotency Safe — no side effects
 */
export const matchYouTubeUrl = (url: string): ResolvedUrl | null => {
  for (const pattern of CONTENT_PATTERNS) {
    const match = url.match(pattern);
    if (match?.[1]) {
      return { platform: "youtube", type: "content", id: match[1] };
    }
  }

  for (const { pattern } of CHANNEL_PATTERNS) {
    const match = url.match(pattern);
    if (match?.[1]) {
      return { platform: "youtube", type: "channel", id: match[1] };
    }
  }

  return null;
};
