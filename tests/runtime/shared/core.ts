import { type VerifyResult, verify } from "./types.ts";

export const verifyCorePackage = async (): Promise<VerifyResult[]> => {
  const core = await import("@unified-live/core");

  return [
    await verify("ESM import", () => {
      if (typeof core.UnifiedClient?.create !== "function")
        throw new Error("UnifiedClient.create is not a function");
      if (typeof core.UnifiedLiveError !== "function")
        throw new Error("UnifiedLiveError is not a function");
      if (typeof core.thumbnailSchema?.parse !== "function")
        throw new Error("thumbnailSchema.parse is not a function");
    }),

    await verify("Client creation", () => {
      const client = core.UnifiedClient.create();
      if (!client) throw new Error("UnifiedClient.create() returned falsy");
    }),

    await verify("Error instanceof", () => {
      const err = new core.NotFoundError("test", "res-1");
      if (!(err instanceof core.UnifiedLiveError))
        throw new Error("NotFoundError is not instanceof UnifiedLiveError");
      if (!(err instanceof core.NotFoundError))
        throw new Error("NotFoundError is not instanceof NotFoundError");
      if (!(err instanceof Error)) throw new Error("NotFoundError is not instanceof Error");
    }),

    await verify("Zod validation", () => {
      const result = core.thumbnailSchema.safeParse({
        url: "https://example.com/thumb.jpg",
        width: 320,
        height: 180,
      });
      if (!result.success) throw new Error(`Zod parse failed: ${JSON.stringify(result.error)}`);

      const invalid = core.thumbnailSchema.safeParse({ url: 123 });
      if (invalid.success) throw new Error("Zod should reject invalid input");
    }),
  ];
};
