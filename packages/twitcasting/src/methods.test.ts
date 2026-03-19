import { NotFoundError } from "@unified-live/core";
import { describe, expect, it, vi } from "vitest";
import {
  twitcastingGetContent,
  twitcastingGetChannel,
  twitcastingGetLiveStreams,
  twitcastingGetVideos,
  twitcastingResolveArchive,
  twitcastingSearch,
} from "./methods";
import { createMockRest } from "./test-helpers";

const mockUser = {
  id: "u1",
  screen_id: "testuser",
  name: "TestUser",
  image: "https://img.twitcasting.tv/user.png",
  profile: "Hello",
  level: 5,
  is_live: false,
  created: 1609459200,
};

const mockLiveMovie = {
  id: "m1",
  user_id: "u1",
  title: "Live Stream",
  subtitle: null,
  last_owner_comment: null,
  category: "talk",
  link: "https://twitcasting.tv/testuser/movie/m1",
  is_live: true,
  is_recorded: false,
  current_view_count: 100,
  total_view_count: 500,
  duration: 0,
  created: 1700000000,
  large_thumbnail: "https://img.twitcasting.tv/thumb.jpg",
  small_thumbnail: "https://img.twitcasting.tv/thumb_s.jpg",
};

const mockArchiveMovie = {
  ...mockLiveMovie,
  id: "m2",
  is_live: false,
  is_recorded: true,
  current_view_count: 0,
  total_view_count: 3000,
  duration: 7200,
  created: 1699900000,
};

describe("twitcastingGetContent", () => {
  it("returns content for a valid movie ID", async () => {
    const rest = createMockRest({ movie: mockArchiveMovie, broadcaster: mockUser });
    const result = await twitcastingGetContent(rest, "m2");
    expect(result.type).toBe("video");
    expect(result.id).toBe("m2");
    expect(rest.request).toHaveBeenCalledWith(expect.objectContaining({ path: "/movies/m2" }));
  });

  it("returns live content for a live movie", async () => {
    const rest = createMockRest({ movie: mockLiveMovie, broadcaster: mockUser });
    const result = await twitcastingGetContent(rest, "m1");
    expect(result.type).toBe("live");
  });

  it.each([
    { movie: null, broadcaster: mockUser, label: "movie is null" },
    { movie: mockArchiveMovie, broadcaster: null, label: "broadcaster is null" },
  ])("throws NotFoundError when $label", async ({ movie, broadcaster }) => {
    const rest = createMockRest({ movie, broadcaster });
    await expect(twitcastingGetContent(rest, "m1")).rejects.toThrow(NotFoundError);
  });
});

describe("twitcastingGetChannel", () => {
  it("returns channel for a valid user", async () => {
    const rest = createMockRest({ user: mockUser, supporter_count: 42, supporting_count: 10 });
    const result = await twitcastingGetChannel(rest, "testuser");
    expect(result.id).toBe("u1");
    expect(result.platform).toBe("twitcasting");
    expect(result.subscriberCount).toBe(42);
    expect(rest.request).toHaveBeenCalledWith(expect.objectContaining({ path: "/users/testuser" }));
  });

  it("throws NotFoundError when user is null", async () => {
    const rest = createMockRest({ user: null });
    await expect(twitcastingGetChannel(rest, "nobody")).rejects.toThrow(NotFoundError);
  });
});

describe("twitcastingGetLiveStreams", () => {
  it("returns live stream when user is live", async () => {
    const liveUser = { ...mockUser, is_live: true };
    const rest = createMockRest({ user: liveUser });
    // Override request to handle two calls: first /users, then /users/.../current_live
    let callCount = 0;
    (rest.request as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      callCount++;
      if (callCount === 1) return { status: 200, headers: new Headers(), data: { user: liveUser } };
      return { status: 200, headers: new Headers(), data: { movie: mockLiveMovie } };
    });

    const result = await twitcastingGetLiveStreams(rest, "u1");
    expect(result).toHaveLength(1);
    expect(result[0]!.type).toBe("live");
  });

  it("returns empty array when user is not live", async () => {
    const rest = createMockRest({ user: mockUser });
    const result = await twitcastingGetLiveStreams(rest, "u1");
    expect(result).toEqual([]);
  });

  it("returns empty array when current_live returns no movie", async () => {
    const liveUser = { ...mockUser, is_live: true };
    let callCount = 0;
    const rest = createMockRest({});
    (rest.request as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      callCount++;
      if (callCount === 1) return { status: 200, headers: new Headers(), data: { user: liveUser } };
      return { status: 200, headers: new Headers(), data: { movie: null } };
    });

    const result = await twitcastingGetLiveStreams(rest, "u1");
    expect(result).toEqual([]);
  });
});

describe("twitcastingGetVideos", () => {
  it("returns paginated videos excluding live movies", async () => {
    const movies = [mockArchiveMovie, mockLiveMovie]; // one archive, one live
    let callCount = 0;
    const rest = createMockRest({});
    (rest.request as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        return { status: 200, headers: new Headers(), data: { total_count: 10, movies } };
      }
      return { status: 200, headers: new Headers(), data: { user: mockUser } };
    });

    const result = await twitcastingGetVideos(rest, "u1");
    // Only archive movies should be returned as videos
    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.type).toBe("video");
    expect(result.total).toBe(10);
  });

  it("hasMore is false when fewer items than page size", async () => {
    let callCount = 0;
    const rest = createMockRest({});
    (rest.request as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        // Fewer movies than default pageSize (50)
        return {
          status: 200,
          headers: new Headers(),
          data: { total_count: 2, movies: [mockArchiveMovie] },
        };
      }
      return { status: 200, headers: new Headers(), data: { user: mockUser } };
    });

    const result = await twitcastingGetVideos(rest, "u1");
    expect(result.hasMore).toBe(false);
    expect(result.cursor).toBeUndefined();
  });

  it("passes cursor as slice_id", async () => {
    let callCount = 0;
    const rest = createMockRest({});
    (rest.request as ReturnType<typeof vi.fn>).mockImplementation(
      async (req: { query?: Record<string, string> }) => {
        callCount++;
        if (callCount === 1) {
          expect(req.query?.slice_id).toBe("cursor123");
          return { status: 200, headers: new Headers(), data: { total_count: 0, movies: [] } };
        }
        return { status: 200, headers: new Headers(), data: { user: mockUser } };
      },
    );

    await twitcastingGetVideos(rest, "u1", "cursor123");
  });
});

describe("twitcastingResolveArchive", () => {
  it("returns null when movie is still live", async () => {
    const rest = createMockRest({ movie: mockLiveMovie, broadcaster: mockUser });
    const live = {
      id: "m1",
      platform: "twitcasting",
      title: "",
      description: "",
      tags: [] as string[],
      url: "https://twitcasting.tv/test",
      thumbnail: { url: "", width: 1, height: 1 },
      channel: { id: "u1", name: "", url: "" },
      sessionId: "m1",
      type: "live" as const,
      viewerCount: 0,
      startedAt: new Date(),
      raw: {},
    };
    const result = await twitcastingResolveArchive(rest, live);
    expect(result).toBeNull();
  });

  it("returns Video when movie has ended", async () => {
    const rest = createMockRest({ movie: mockArchiveMovie, broadcaster: mockUser });
    const live = {
      id: "m2",
      platform: "twitcasting",
      title: "",
      description: "",
      tags: [] as string[],
      url: "https://twitcasting.tv/test",
      thumbnail: { url: "", width: 1, height: 1 },
      channel: { id: "u1", name: "", url: "" },
      sessionId: "m2",
      type: "live" as const,
      viewerCount: 0,
      startedAt: new Date(),
      raw: {},
    };
    const result = await twitcastingResolveArchive(rest, live);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("video");
  });
});

describe("twitcastingSearch", () => {
  it("searches live users with query and status=live", async () => {
    const liveUser = { ...mockUser, is_live: true };
    const rest = createMockRest({});
    let callCount = 0;
    (rest.request as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        // /search/users response
        return { status: 200, headers: new Headers(), data: { users: [liveUser] } };
      }
      // /users/{id}/current_live response
      return { status: 200, headers: new Headers(), data: { movie: mockLiveMovie } };
    });

    const result = await twitcastingSearch(rest, { query: "test", status: "live" });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.type).toBe("live");
    expect(result.hasMore).toBe(false);
  });

  it("skips non-live users when status=live", async () => {
    const offlineUser = { ...mockUser, is_live: false };
    const rest = createMockRest({ users: [offlineUser] });

    const result = await twitcastingSearch(rest, { query: "test", status: "live" });
    expect(result.items).toEqual([]);
    // Only one request: /search/users — no current_live fetch for offline users
    expect(rest.request).toHaveBeenCalledTimes(1);
  });

  it("returns empty for status=upcoming (unsupported)", async () => {
    const rest = createMockRest({});
    const result = await twitcastingSearch(rest, { query: "test", status: "upcoming" });
    expect(result.items).toEqual([]);
    expect(result.hasMore).toBe(false);
    expect(rest.request).not.toHaveBeenCalled();
  });

  it("returns empty when no query provided", async () => {
    const rest = createMockRest({});
    const result = await twitcastingSearch(rest, {});
    expect(result.items).toEqual([]);
    expect(result.hasMore).toBe(false);
    expect(rest.request).not.toHaveBeenCalled();
  });

  it("fetches recent movies when status is not specified", async () => {
    const rest = createMockRest({});
    let callCount = 0;
    (rest.request as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        return { status: 200, headers: new Headers(), data: { users: [mockUser] } };
      }
      return {
        status: 200,
        headers: new Headers(),
        data: { movies: [mockArchiveMovie] },
      };
    });

    const result = await twitcastingSearch(rest, { query: "test" });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.type).toBe("video");
  });

  it("fetches recent movies when status=ended", async () => {
    const rest = createMockRest({});
    let callCount = 0;
    (rest.request as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        return { status: 200, headers: new Headers(), data: { users: [mockUser] } };
      }
      return {
        status: 200,
        headers: new Headers(),
        data: { movies: [mockArchiveMovie] },
      };
    });

    const result = await twitcastingSearch(rest, { query: "test", status: "ended" });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.type).toBe("video");
  });

  it("passes query params correctly", async () => {
    const rest = createMockRest({ users: [] });
    await twitcastingSearch(rest, { query: "gaming", limit: 10 });
    expect(rest.request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: "/search/users",
        query: { words: "gaming", lang: "ja", limit: "10" },
      }),
    );
  });

  it("fetches live content by channelId", async () => {
    const liveUser = { ...mockUser, is_live: true };
    const rest = createMockRest({});
    let callCount = 0;
    (rest.request as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      callCount++;
      if (callCount === 1) return { status: 200, headers: new Headers(), data: { user: liveUser } };
      return { status: 200, headers: new Headers(), data: { movie: mockLiveMovie } };
    });
    const result = await twitcastingSearch(rest, { channelId: "user1", status: "live" });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.type).toBe("live");
  });

  it("returns empty when channelId user is not live and status=live", async () => {
    const offlineUser = { ...mockUser, is_live: false };
    const rest = createMockRest({});
    (rest.request as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 200,
      headers: new Headers(),
      data: { user: offlineUser },
    });
    const result = await twitcastingSearch(rest, { channelId: "user1", status: "live" });
    expect(result.items).toEqual([]);
  });

  it("fetches recent movies by channelId without status", async () => {
    const rest = createMockRest({});
    let callCount = 0;
    (rest.request as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      callCount++;
      if (callCount === 1) return { status: 200, headers: new Headers(), data: { user: mockUser } };
      return { status: 200, headers: new Headers(), data: { movies: [mockArchiveMovie] } };
    });
    const result = await twitcastingSearch(rest, { channelId: "user1" });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.type).toBe("video");
  });
});
