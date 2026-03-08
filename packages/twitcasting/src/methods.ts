import {
  type Channel,
  type Content,
  type LiveStream,
  NotFoundError,
  type Page,
  type RestManager,
  type Video,
} from "@unified-live/core";
import {
  movieToContent,
  movieToLive,
  movieToVideo,
  type TCMovie,
  type TCUser,
  userToChannel,
} from "./mapper.js";

type TCMovieResponse = {
  movie: TCMovie;
  broadcaster: TCUser;
};

type TCUserResponse = {
  user: TCUser;
};

type TCMoviesResponse = {
  total_count: number;
  movies: TCMovie[];
};

/**
 * @precondition id is a valid TwitCasting movie ID
 * @postcondition returns Content (live or video) for the movie
 */
export async function twitcastingGetContent(
  rest: RestManager,
  id: string,
): Promise<Content> {
  const res = await rest.request<TCMovieResponse>({
    method: "GET",
    path: `/movies/${id}`,
    bucketId: "movies",
  });

  return movieToContent(res.data.movie, res.data.broadcaster);
}

/**
 * @precondition id is a valid TwitCasting user_id or screen_id
 * @postcondition returns Channel for the user
 */
export async function twitcastingGetChannel(
  rest: RestManager,
  id: string,
): Promise<Channel> {
  const res = await rest.request<TCUserResponse>({
    method: "GET",
    path: `/users/${id}`,
    bucketId: "users",
  });

  if (!res.data.user) {
    throw new NotFoundError("twitcasting", id);
  }

  return userToChannel(res.data.user);
}

/**
 * @precondition channelId is a valid TwitCasting user_id or screen_id
 * @postcondition returns live streams (0 or 1 for TwitCasting, since a user can only have one live)
 */
export async function twitcastingGetLiveStreams(
  rest: RestManager,
  channelId: string,
): Promise<LiveStream[]> {
  const res = await rest.request<TCUserResponse>({
    method: "GET",
    path: `/users/${channelId}`,
    bucketId: "users",
  });

  if (!res.data.user.is_live) {
    return [];
  }

  // Fetch the current live movie
  const movieRes = await rest.request<{ movie: TCMovie }>({
    method: "GET",
    path: `/users/${channelId}/current_live`,
    bucketId: "movies",
  });

  if (!movieRes.data.movie) {
    return [];
  }

  return [movieToLive(movieRes.data.movie, res.data.user)];
}

/**
 * @precondition channelId is a valid TwitCasting user_id or screen_id
 * @postcondition returns paginated videos using slice_id for deep pagination
 */
export async function twitcastingGetVideos(
  rest: RestManager,
  channelId: string,
  cursor?: string,
): Promise<Page<Video>> {
  const query: Record<string, string> = { limit: "50" };
  if (cursor) {
    query.slice_id = cursor;
  }

  // We need user info for mapping, fetch in parallel
  const [moviesRes, userRes] = await Promise.all([
    rest.request<TCMoviesResponse>({
      method: "GET",
      path: `/users/${channelId}/movies`,
      query,
      bucketId: "movies",
    }),
    rest.request<TCUserResponse>({
      method: "GET",
      path: `/users/${channelId}`,
      bucketId: "users",
    }),
  ]);

  const videos = moviesRes.data.movies
    .filter((m) => !m.is_live)
    .map((m) => movieToVideo(m, userRes.data.user));

  return {
    items: videos,
    cursor:
      videos.length > 0 && moviesRes.data.movies.length === 50
        ? videos.at(-1)!.id
        : undefined,
    total: moviesRes.data.total_count,
  };
}

/**
 * TwitCasting uses the same ID for live and archive.
 * resolveArchive checks if the movie has ended and returns the video.
 */
export async function twitcastingResolveArchive(
  rest: RestManager,
  live: LiveStream,
): Promise<Video | null> {
  const res = await rest.request<TCMovieResponse>({
    method: "GET",
    path: `/movies/${live.id}`,
    bucketId: "movies",
  });

  if (res.data.movie.is_live) {
    return null;
  }

  return movieToVideo(res.data.movie, res.data.broadcaster);
}
