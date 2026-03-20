import {
  type Channel,
  type Content,
  type LiveStream,
  NotFoundError,
  Page,
  type RestManager,
  type SearchOptions,
  type Video,
} from "@unified-live/core";
import { toContent, toLive, toVideo, type TCMovie, type TCUser, toChannel } from "./mapper";

type TCMovieResponse = {
  movie: TCMovie;
  broadcaster: TCUser;
};

type TCUserResponse = {
  user: TCUser;
  supporter_count: number;
  supporting_count: number;
};

type TCMoviesResponse = {
  total_count: number;
  movies: TCMovie[];
};

type TCSearchUsersResponse = {
  users: TCUser[];
};

/**
 * Fetch a TwitCasting movie by ID and map to unified Content.
 *
 * @param rest - REST manager for API requests
 * @param id - TwitCasting movie ID
 * @returns unified Content (live or video) for the movie
 * @precondition id is a valid TwitCasting movie ID
 * @postcondition returns Content (live or video) for the movie
 */
export const twitcastingGetContent = async (rest: RestManager, id: string): Promise<Content> => {
  const res = await rest.request<TCMovieResponse>({
    method: "GET",
    path: `/movies/${id}`,
    bucketId: "movies",
  });

  if (!res.data.movie || !res.data.broadcaster) {
    throw new NotFoundError("twitcasting", id);
  }

  return toContent(res.data.movie, res.data.broadcaster);
};

/**
 * Fetch a TwitCasting channel by user_id or screen_id and map to unified Channel.
 *
 * @param rest - REST manager for API requests
 * @param id - TwitCasting user_id or screen_id
 * @returns unified Channel for the user
 * @throws NotFoundError if user does not exist
 * @precondition id is a valid TwitCasting user_id or screen_id
 * @postcondition returns Channel for the user
 */
export const twitcastingGetChannel = async (rest: RestManager, id: string): Promise<Channel> => {
  const res = await rest.request<TCUserResponse>({
    method: "GET",
    path: `/users/${encodeURIComponent(id)}`,
    bucketId: "users",
  });

  if (!res.data.user) {
    throw new NotFoundError("twitcasting", id);
  }

  const channel = toChannel(res.data.user);
  return { ...channel, subscriberCount: res.data.supporter_count };
};

/**
 * Fetch active live streams for a TwitCasting channel.
 *
 * @param rest - REST manager for API requests
 * @param channelId - TwitCasting user_id or screen_id
 * @returns array of live streams (0 or 1 items)
 * @precondition channelId is a valid TwitCasting user_id or screen_id
 * @postcondition returns live streams (0 or 1 for TwitCasting, since a user can only have one live)
 */
export const twitcastingGetLiveStreams = async (
  rest: RestManager,
  channelId: string,
): Promise<LiveStream[]> => {
  const encodedId = encodeURIComponent(channelId);
  const res = await rest.request<TCUserResponse>({
    method: "GET",
    path: `/users/${encodedId}`,
    bucketId: "users",
  });

  if (!res.data.user.is_live) {
    return [];
  }

  // Fetch the current live movie
  const movieRes = await rest.request<{ movie: TCMovie }>({
    method: "GET",
    path: `/users/${encodedId}/current_live`,
    bucketId: "movies",
  });

  if (!movieRes.data.movie) {
    return [];
  }

  return [toLive(movieRes.data.movie, res.data.user)];
};

/**
 * Fetch paginated videos for a TwitCasting channel.
 *
 * @param rest - REST manager for API requests
 * @param channelId - TwitCasting user_id or screen_id
 * @param cursor - optional pagination cursor (slice_id)
 * @param pageSize - number of items per page (default 50)
 * @returns paginated list of videos
 * @precondition channelId is a valid TwitCasting user_id or screen_id
 * @postcondition returns paginated videos using slice_id for deep pagination
 */
export const twitcastingGetVideos = async (
  rest: RestManager,
  channelId: string,
  cursor?: string,
  pageSize = 50,
): Promise<Page<Video>> => {
  const query: Record<string, string> = { limit: String(pageSize) };
  if (cursor) {
    query.slice_id = cursor;
  }

  const encodedId = encodeURIComponent(channelId);
  // We need user info for mapping, fetch in parallel
  const [moviesRes, userRes] = await Promise.all([
    rest.request<TCMoviesResponse>({
      method: "GET",
      path: `/users/${encodedId}/movies`,
      query,
      bucketId: "movies",
    }),
    rest.request<TCUserResponse>({
      method: "GET",
      path: `/users/${encodedId}`,
      bucketId: "users",
    }),
  ]);

  const movies = moviesRes.data.movies;
  const videos: Video[] = [];
  for (const m of movies) {
    if (!m.is_live) {
      videos.push(toVideo(m, userRes.data.user));
    }
  }

  // Use last movie ID (not last video) as cursor to avoid stopping when a page has only live movies
  const nextCursor = movies.length === pageSize ? movies.at(-1)!.id : undefined;
  return {
    items: videos,
    cursor: nextCursor,
    total: moviesRes.data.total_count,
    hasMore: nextCursor !== undefined,
  };
};

/**
 * TwitCasting uses the same ID for live and archive.
 * resolveArchive checks if the movie has ended and returns the video.
 *
 * @param rest - REST manager for API requests
 * @param live - live stream to check for archive
 * @returns archived Video or null if still live
 */
export const twitcastingResolveArchive = async (
  rest: RestManager,
  live: LiveStream,
): Promise<Video | null> => {
  const res = await rest.request<TCMovieResponse>({
    method: "GET",
    path: `/movies/${live.id}`,
    bucketId: "movies",
  });

  if (res.data.movie.is_live) {
    return null;
  }

  return toVideo(res.data.movie, res.data.broadcaster);
};

/**
 * Search TwitCasting for content matching the given options.
 *
 * Uses the `/search/users` endpoint to find users by keyword, then fetches
 * their current live or recent movies depending on the requested status.
 *
 * @param rest - REST manager for API requests
 * @param options - search options (query, status, limit)
 * @returns paginated list of Content items
 * @precondition options.query should be provided for meaningful results
 * @postcondition returns Page with items mapped from TwitCasting resources
 * @idempotency Safe — read-only API calls
 */
export const twitcastingSearch = async (
  rest: RestManager,
  options: SearchOptions,
): Promise<Page<Content>> => {
  // TwitCasting has no scheduled/upcoming data
  if (options.status === "upcoming") {
    return Page.empty<Content>();
  }

  // channelId-based search: fetch movies for this user directly
  if (options.channelId) {
    const encodedId = encodeURIComponent(options.channelId);
    const userRes = await rest.request<{ user: TCUser }>({
      method: "GET",
      path: `/users/${encodedId}`,
      bucketId: "users",
    });

    if (options.status === "live") {
      if (!userRes.data.user.is_live) return Page.empty<Content>();
      const movieRes = await rest.request<{ movie: TCMovie }>({
        method: "GET",
        path: `/users/${encodedId}/current_live`,
        bucketId: "movies",
      });
      return movieRes.data.movie
        ? { items: [toLive(movieRes.data.movie, userRes.data.user)], hasMore: false }
        : Page.empty<Content>();
    }

    // Default or ended: fetch recent movies
    const moviesRes = await rest.request<TCMoviesResponse>({
      method: "GET",
      path: `/users/${encodedId}/movies`,
      query: { limit: String(options.limit ?? 5) },
      bucketId: "movies",
    });
    return {
      items: (moviesRes.data.movies ?? []).map((m) => toContent(m, userRes.data.user)),
      hasMore: false,
    };
  }

  // TwitCasting search requires a keyword
  if (!options.query) {
    return Page.empty<Content>();
  }

  const query: Record<string, string> = {
    words: options.query,
    lang: options.languageCode ?? "ja",
  };
  if (options.limit) query.limit = String(options.limit);

  const res = await rest.request<TCSearchUsersResponse>({
    method: "GET",
    path: "/search/users",
    query,
    bucketId: "search",
  });

  const users = res.data.users ?? [];

  const fetchUserContent = async (user: TCUser): Promise<Content[]> => {
    const encodedUserId = encodeURIComponent(user.id);
    if (options.status === "live") {
      if (!user.is_live) return [];
      const movieRes = await rest.request<{ movie: TCMovie }>({
        method: "GET",
        path: `/users/${encodedUserId}/current_live`,
        bucketId: "movies",
      });
      return movieRes.data.movie ? [toLive(movieRes.data.movie, user)] : [];
    }
    // status === "ended" or no status — fetch recent movies
    const moviesRes = await rest.request<TCMoviesResponse>({
      method: "GET",
      path: `/users/${encodedUserId}/movies`,
      query: { limit: "5" },
      bucketId: "movies",
    });
    return (moviesRes.data.movies ?? []).map((movie) => toContent(movie, user));
  };

  const CONCURRENCY = 5;
  const items: Content[] = [];
  for (let i = 0; i < users.length; i += CONCURRENCY) {
    const chunk = users.slice(i, i + CONCURRENCY);
    const settled = await Promise.allSettled(chunk.map(fetchUserContent));
    for (const result of settled) {
      if (result.status === "fulfilled") {
        items.push(...result.value);
      }
      // Skip failed users silently — search is best-effort
    }
  }

  return { items, hasMore: false };
};
