import { type VerifyResult, verify } from "./types.ts";

export const verifyTwitchPackage = async (): Promise<VerifyResult[]> => {
  const twitch = await import("@unified-live/twitch");
  const core = await import("@unified-live/core");

  return [
    await verify("ESM import", () => {
      if (typeof twitch.createTwitchPlugin !== "function")
        throw new Error("createTwitchPlugin is not a function");
      if (typeof twitch.matchTwitchUrl !== "function")
        throw new Error("matchTwitchUrl is not a function");
    }),

    await verify("Plugin creation", () => {
      const plugin = twitch.createTwitchPlugin({
        clientId: "test-client-id",
        clientSecret: "test-client-secret",
      });
      if (!plugin) throw new Error("createTwitchPlugin returned falsy");
    }),

    await verify("Error instanceof", () => {
      const err = new core.AuthenticationError("twitch");
      if (!(err instanceof core.AuthenticationError))
        throw new Error("AuthenticationError is not instanceof AuthenticationError");
      if (!(err instanceof core.UnifiedLiveError))
        throw new Error("AuthenticationError is not instanceof UnifiedLiveError");
    }),

    await verify("Zod validation", () => {
      const result = core.channelSchema.safeParse({
        id: "12345",
        platform: "twitch",
        name: "testuser",
        url: "https://twitch.tv/testuser",
      });
      if (!result.success) throw new Error(`Zod parse failed: ${JSON.stringify(result.error)}`);

      const invalid = core.channelSchema.safeParse({ id: 123 });
      if (invalid.success) throw new Error("Zod should reject invalid input");
    }),
  ];
};
