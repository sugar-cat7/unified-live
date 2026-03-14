import { QuotaExhaustedError } from "../errors";
import type {
  RateLimitHandle,
  RateLimitStatus,
  RateLimitStrategy,
} from "./strategy";
import type { RestRequest } from "./types";

export type QuotaBudgetConfig = {
  dailyLimit?: number;
  costMap: Record<string, number>;
  defaultCost?: number;
  platform?: string;
};

/**
 * Creates a cost-based daily quota strategy (used by YouTube).
 *
 * @precondition costMap maps bucketId strings to their quota costs
 * @postcondition acquire() throws QuotaExhaustedError when quota is exceeded
 * @idempotency Not idempotent — each acquire() consumes quota
 */
export function createQuotaBudgetStrategy(
  config: QuotaBudgetConfig,
): RateLimitStrategy {
  const dailyLimit = config.dailyLimit ?? 10_000;
  const defaultCost = config.defaultCost ?? 1;
  const platform = config.platform ?? "unknown";

  let consumed = 0;
  let resetsAt = nextResetTime();
  let resetTimer: ReturnType<typeof setTimeout> | undefined;

  function scheduleReset(): void {
    const ms = resetsAt.getTime() - Date.now();
    if (ms <= 0) {
      consumed = 0;
      resetsAt = nextResetTime();
      scheduleReset();
      return;
    }
    resetTimer = setTimeout(() => {
      consumed = 0;
      resetsAt = nextResetTime();
      scheduleReset();
    }, ms);
    if (resetTimer && "unref" in resetTimer) {
      resetTimer.unref();
    }
  }

  scheduleReset();

  return {
    acquire(req: RestRequest): Promise<RateLimitHandle> {
      const cost: number =
        req.bucketId !== undefined
          ? (config.costMap[req.bucketId] ?? defaultCost)
          : defaultCost;

      if (consumed + cost > dailyLimit) {
        return Promise.reject(
          new QuotaExhaustedError(platform, {
            consumed,
            limit: dailyLimit,
            resetsAt,
            requestedCost: cost,
          }),
        );
      }

      consumed += cost;

      const handle: RateLimitHandle = {
        complete() {
          // YouTube doesn't provide quota info in headers — no-op.
        },
        release() {
          consumed = Math.max(0, consumed - cost);
        },
      };

      return Promise.resolve(handle);
    },

    getStatus(): RateLimitStatus {
      return {
        remaining: dailyLimit - consumed,
        limit: dailyLimit,
        resetsAt,
        queued: 0,
      };
    },

    dispose(): void {
      if (resetTimer !== undefined) {
        clearTimeout(resetTimer);
        resetTimer = undefined;
      }
    },
  };
}

/** Pacific time midnight (Google's quota reset schedule). */
function nextResetTime(): Date {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) => {
    const part = parts.find((p) => p.type === type);
    return Number.parseInt(part?.value ?? "0", 10);
  };

  const ptYear = get("year");
  const ptMonth = get("month") - 1;
  const ptDay = get("day");
  const ptHour = get("hour");
  const ptMinute = get("minute");
  const ptSecond = get("second");

  // Build "now" and "tomorrow midnight" as local Dates for offset computation
  const ptNow = new Date(ptYear, ptMonth, ptDay, ptHour, ptMinute, ptSecond);
  const ptMidnight = new Date(ptYear, ptMonth, ptDay + 1, 0, 0, 0, 0);
  const offset = ptNow.getTime() - now.getTime();
  return new Date(ptMidnight.getTime() - offset);
}
