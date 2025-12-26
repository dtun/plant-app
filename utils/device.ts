/**
 * Device identification utilities
 *
 * Provides a simple wrapper around expo-constants for device identification.
 */

import Constants from "expo-constants";

/**
 * Get device identifier
 *
 * Returns the device session ID from expo-constants.
 * Falls back to "default" if unavailable.
 *
 * @returns Device ID or "default"
 *
 * @example
 * ```typescript
 * let deviceId = getDeviceId();
 * console.log(deviceId); // "abc-123-def-456"
 * ```
 */
export function getDeviceId(): string {
  return Constants.sessionId || "default";
}
