/**
 * RevenueCat payment configuration
 *
 * Public SDK keys are read from env vars (same pattern as the default AI keys).
 * Set these in your build environment:
 *   EXPO_PUBLIC_REVENUECAT_IOS_KEY
 *   EXPO_PUBLIC_REVENUECAT_ANDROID_KEY
 *
 * The "pro" entitlement is configured in the RevenueCat dashboard and granted
 * by the one-time non-consumable unlock product.
 */

import { Platform } from "react-native";

export const PRO_ENTITLEMENT_ID = "pro";

/**
 * Returns the RevenueCat public SDK key for the current platform, or null when
 * unavailable (web, or key not provided).
 */
export function getRevenueCatApiKey(): string | null {
  let key: string | undefined;

  if (Platform.OS === "ios") {
    key = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
  } else if (Platform.OS === "android") {
    key = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;
  }

  return key && key.length > 0 ? key : null;
}
