import { type VerifyResult, verify } from "./types.ts";

export const verifyCorePackage = async (): Promise<VerifyResult[]> => {
  const core = await import("@unified-live/core");

  return [
    await verify("ESM import", () => {
      if (typeof core.UnifiedClient?.create !== "function")
        throw new Error("UnifiedClient.create is not a function");
      if (typeof core.UnifiedLiveError !== "function")
        throw new Error("UnifiedLiveError is not a function");
      if (typeof core.Broadcast?.is !== "function")
        throw new Error("Broadcast.is is not a function");
    }),

    await verify("Client creation", () => {
      const client = core.UnifiedClient.create();
      if (typeof client?.listBroadcasts !== "function")
        throw new Error("UnifiedClient.create() did not return a valid client");
    }),

    await verify("Error instanceof", () => {
      const err = new core.NotFoundError("test", "res-1");
      if (!(err instanceof core.UnifiedLiveError))
        throw new Error("NotFoundError is not instanceof UnifiedLiveError");
      if (!(err instanceof core.NotFoundError))
        throw new Error("NotFoundError is not instanceof NotFoundError");
      if (!(err instanceof Error)) throw new Error("NotFoundError is not instanceof Error");
    }),

    await verify("Type guards", () => {
      const broadcast = {
        id: "v1",
        platform: "youtube",
        type: "broadcast",
        title: "",
        description: "",
        tags: [],
        url: "https://example.com",
        thumbnail: { url: "https://example.com/thumb.jpg", width: 320, height: 180 },
        channel: { id: "ch1", name: "Ch", url: "https://example.com/ch" },
        viewerCount: 100,
        startedAt: new Date(),
        raw: {},
      };
      if (!core.Broadcast.is(broadcast))
        throw new Error("Broadcast.is should return true for broadcast");
      if (core.Broadcast.is({ type: "archive" }))
        throw new Error("Broadcast.is should return false for archive");
    }),
  ];
};
