import type { ResolvedUrl } from "@unified-live/core";

const CONTENT_PATTERN =
  /^https?:\/\/(?:www\.)?twitcasting\.tv\/([a-zA-Z0-9_]+)\/movie\/(\d+)/;

const CHANNEL_PATTERN =
  /^https?:\/\/(?:www\.)?twitcasting\.tv\/([a-zA-Z0-9_]+)\/?$/;

/**
 * Match a URL to a TwitCasting content or channel resource.
 *
 * @precondition url is a valid URL string
 * @postcondition returns ResolvedUrl for TwitCasting URLs, null otherwise
 * @idempotency Safe — no side effects
 */
export function matchTwitCastingUrl(url: string): ResolvedUrl | null {
  const contentMatch = url.match(CONTENT_PATTERN);
  if (contentMatch?.[2]) {
    return {
      platform: "twitcasting",
      type: "content",
      id: contentMatch[2],
    };
  }

  const channelMatch = url.match(CHANNEL_PATTERN);
  if (channelMatch?.[1]) {
    return {
      platform: "twitcasting",
      type: "channel",
      id: channelMatch[1],
    };
  }

  return null;
}
