import type { VerifyResult } from "./types.ts";
import { verify } from "./types.ts";

export const verifyYouTubePackage = async (): Promise<VerifyResult[]> => {
  const youtube = await import("@unified-live/youtube");
  const core = await import("@unified-live/core");

  return [
    await verify("ESM import", () => {
      if (typeof youtube.createYouTubePlugin !== "function")
        throw new Error("createYouTubePlugin is not a function");
      if (typeof youtube.matchYouTubeUrl !== "function")
        throw new Error("matchYouTubeUrl is not a function");
    }),

    await verify("Plugin creation", () => {
      const plugin = youtube.createYouTubePlugin({
        apiKey: "test-api-key",
      });
      if (!plugin) throw new Error("createYouTubePlugin returned falsy");
    }),

    await verify("Error instanceof", () => {
      const err = new core.RateLimitError("youtube");
      if (!(err instanceof core.UnifiedLiveError))
        throw new Error("RateLimitError is not instanceof UnifiedLiveError");
    }),

    await verify("Zod validation", () => {
      const result = core.channelSchema.safeParse({
        id: "UC12345",
        platform: "youtube",
        name: "Test Channel",
        url: "https://youtube.com/channel/UC12345",
      });
      if (!result.success)
        throw new Error(`Zod parse failed: ${JSON.stringify(result.error)}`);
    }),
  ];
};
