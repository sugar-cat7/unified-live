import type { ResolvedUrl } from "@unified-live/core";

const CONTENT_PATTERN = /^https?:\/\/(?:www\.)?twitch\.tv\/videos\/(\d+)/;

const CHANNEL_PATTERN =
  /^https?:\/\/(?:www\.)?twitch\.tv\/([a-zA-Z0-9_]{1,25})$/;

/**
 * Match a URL to a Twitch content or channel resource.
 *
 * @precondition url is a valid URL string
 * @postcondition returns ResolvedUrl for Twitch URLs, null otherwise
 * @idempotency Safe — no side effects
 */
export function matchTwitchUrl(url: string): ResolvedUrl | null {
  const contentMatch = url.match(CONTENT_PATTERN);
  if (contentMatch?.[1]) {
    return { platform: "twitch", type: "content", id: contentMatch[1] };
  }

  const channelMatch = url.match(CHANNEL_PATTERN);
  if (channelMatch?.[1]) {
    return { platform: "twitch", type: "channel", id: channelMatch[1] };
  }

  return null;
}
