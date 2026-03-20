export type VerifyResult = {
  name: string;
  success: boolean;
  error?: string;
};

export type PackageVerifier = {
  packageName: string;
  verify: () => Promise<VerifyResult[]>;
};

export const verify = (name: string, fn: () => void | Promise<void>): Promise<VerifyResult> =>
  Promise.resolve()
    .then(() => fn())
    .then(() => ({ name, success: true }))
    .catch((e: unknown) => ({
      name,
      success: false,
      error: e instanceof Error ? e.message : String(e),
    }));
