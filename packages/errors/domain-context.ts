import { z } from "zod";

/**
 * Context schemas for each domain error code
 *
 * Errors that do not require context use z.undefined()
 */
export const DomainErrorContextSchemas = {
  // E1xxx - Domain
  E1001: z.object({
    // Session expired
    sessionId: z.string(),
    expiredAt: z.string(),
  }),
  E1002: z.undefined(), // Session not started
  E1003: z.undefined(), // Session already completed

  // E2xxx - Billing
  E2001: z.object({
    // Plan limit exceeded
    currentPlan: z.string(),
    limit: z.number(),
    currentUsage: z.number(),
  }),
  E2002: z.undefined(), // Subscription expired

  // E3xxx - Auth
  E3001: z.object({
    // Verification code expired
    expiresAfterMinutes: z.number(),
  }),
  E3002: z.undefined(), // Invalid verification code

  // E4xxx - User
  E4001: z.undefined(), // Onboarding incomplete
  E4002: z.undefined(), // Phone number not verified
} as const;

/**
 * Context type map per error code
 */
export type DomainErrorContextMap = {
  [K in keyof typeof DomainErrorContextSchemas]: z.infer<
    (typeof DomainErrorContextSchemas)[K]
  >;
};
