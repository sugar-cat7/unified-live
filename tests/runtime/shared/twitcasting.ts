import { type VerifyResult, verify } from "./types.ts";

export const verifyTwitCastingPackage = async (): Promise<VerifyResult[]> => {
  const tc = await import("@unified-live/twitcasting");
  const core = await import("@unified-live/core");

  return [
    await verify("ESM import", () => {
      if (typeof tc.createTwitCastingPlugin !== "function")
        throw new Error("createTwitCastingPlugin is not a function");
      if (typeof tc.matchTwitCastingUrl !== "function")
        throw new Error("matchTwitCastingUrl is not a function");
    }),

    await verify("Plugin creation", () => {
      const plugin = tc.createTwitCastingPlugin({
        clientId: "test-client-id",
        clientSecret: "test-client-secret",
      });
      if (!plugin) throw new Error("createTwitCastingPlugin returned falsy");
    }),

    await verify("Error instanceof", () => {
      const err = new core.NetworkError("twitcasting", "NETWORK_TIMEOUT");
      if (!(err instanceof core.NetworkError))
        throw new Error("NetworkError is not instanceof NetworkError");
      if (!(err instanceof core.UnifiedLiveError))
        throw new Error("NetworkError is not instanceof UnifiedLiveError");
    }),

    await verify("Type guards", () => {
      const channel = {
        id: "tc-user",
        platform: "twitcasting",
        name: "Test User",
        url: "https://twitcasting.tv/tc-user",
      };
      if (!core.Channel.is(channel))
        throw new Error("Channel.is should return true for valid channel");
      if (core.Channel.is({ id: 123 }))
        throw new Error("Channel.is should return false for invalid input");
    }),
  ];
};
