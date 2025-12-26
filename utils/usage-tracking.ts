/**
 * Usage tracking utilities for managing monthly name generation limits
 *
 * Free tier: 3 generations per month
 * Pro tier: Unlimited generations
 */

import { events, tables, type AppSchema } from "@/src/livestore/schema";
import type { Store } from "@livestore/livestore";
import Constants from "expo-constants";

export type UserTier = "free" | "pro";

export interface UsageCheckResult {
  allowed: boolean;
  remaining: number; // -1 for unlimited (pro tier)
  tier: UserTier;
}

export interface UsageStats {
  count: number;
  month: string; // Format: YYYY-MM
  tier: UserTier;
}

// Constants
const FREE_TIER_LIMIT = 3;

/**
 * Get device ID from expo-constants
 */
function getDeviceId(): string {
  return Constants.sessionId || "default";
}

/**
 * Get current month in YYYY-MM format
 */
function getCurrentMonth(): string {
  let now = new Date();
  let year = now.getFullYear();
  let month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Generate usage ID in format: {deviceId}-{YYYY-MM}
 */
function getUsageId(deviceId: string, month: string): string {
  return `${deviceId}-${month}`;
}

/**
 * Validate and narrow tier type from database
 */
function isValidTier(tier: string): tier is UserTier {
  return tier === "free" || tier === "pro";
}

/**
 * Get or create user record for the current device
 */
async function getOrCreateUser(
  store: Store<AppSchema>,
  deviceId: string
): Promise<{ id: string; tier: UserTier }> {
  let users = store.query(tables.user.where({ id: deviceId }));
  let user = users[0];

  if (!user) {
    let defaultTier: UserTier = "free";
    await store.commit(
      events.userCreated({
        id: deviceId,
        tier: defaultTier,
        syncEnabled: false,
        createdAt: Date.now(),
      })
    );
    return { id: deviceId, tier: defaultTier };
  }

  let tier: UserTier = isValidTier(user.tier) ? user.tier : "free";
  return { id: user.id, tier };
}

/**
 * Get usage record for current month
 */
function getCurrentMonthUsage(
  store: Store<AppSchema>,
  usageId: string
): number {
  let usageRecords = store.query(tables.usage.where({ id: usageId }));
  let usage = usageRecords[0];

  return usage?.count ?? 0;
}

/**
 * Check if user can generate a plant name based on their tier and usage
 *
 * Returns:
 * - allowed: true if user can generate (pro tier or free tier with remaining quota)
 * - remaining: number of generations left (-1 for unlimited pro tier, 0-3 for free tier)
 * - tier: user's current subscription tier
 */
export async function canGenerateName(
  store: Store<AppSchema>
): Promise<UsageCheckResult> {
  let deviceId = getDeviceId();
  let user = await getOrCreateUser(store, deviceId);

  // Pro tier has unlimited usage
  if (user.tier === "pro") {
    return {
      allowed: true,
      remaining: -1,
      tier: "pro",
    };
  }

  // Free tier - check monthly usage
  let currentMonth = getCurrentMonth();
  let usageId = getUsageId(deviceId, currentMonth);
  let count = getCurrentMonthUsage(store, usageId);
  let remaining = Math.max(0, FREE_TIER_LIMIT - count);

  return {
    allowed: remaining > 0,
    remaining,
    tier: "free",
  };
}

/**
 * Increment the monthly usage counter
 *
 * This should be called after successfully generating a plant name.
 * Works for both free and pro tiers (pro for analytics).
 */
export async function incrementUsage(store: Store<AppSchema>): Promise<void> {
  let deviceId = getDeviceId();
  let user = await getOrCreateUser(store, deviceId);
  let currentMonth = getCurrentMonth();
  let usageId = getUsageId(deviceId, currentMonth);

  let currentCount = getCurrentMonthUsage(store, usageId);
  let newCount = currentCount + 1;

  await store.commit(
    events.usageRecorded({
      id: usageId,
      userId: user.id,
      month: currentMonth,
      count: newCount,
      createdAt: Date.now(),
    })
  );
}

/**
 * Get current month's usage statistics
 *
 * Returns the current month's usage count along with tier information.
 * Useful for displaying usage stats to the user.
 */
export async function getCurrentUsage(
  store: Store<AppSchema>
): Promise<UsageStats> {
  let deviceId = getDeviceId();
  let user = await getOrCreateUser(store, deviceId);
  let currentMonth = getCurrentMonth();
  let usageId = getUsageId(deviceId, currentMonth);

  let count = getCurrentMonthUsage(store, usageId);

  return {
    count,
    month: currentMonth,
    tier: user.tier,
  };
}

/**
 * Reset monthly usage counter (for testing purposes)
 *
 * Resets the current month's usage count to 0.
 * This is primarily used for testing but could also be used
 * for customer support scenarios.
 */
export async function resetMonthlyUsage(
  store: Store<AppSchema>
): Promise<void> {
  let deviceId = getDeviceId();
  let user = await getOrCreateUser(store, deviceId);
  let currentMonth = getCurrentMonth();
  let usageId = getUsageId(deviceId, currentMonth);

  await store.commit(
    events.usageRecorded({
      id: usageId,
      userId: user.id,
      month: currentMonth,
      count: 0,
      createdAt: Date.now(),
    })
  );
}
