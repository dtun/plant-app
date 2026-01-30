/**
 * Device identification utilities
 *
 * Provides a persistent device identifier that survives app restarts.
 * Uses expo-file-system to store a UUID generated on first launch.
 */

import * as Crypto from "expo-crypto";
import { File, Paths } from "expo-file-system";

let cachedDeviceId: string | null = null;

/**
 * Initialize the device ID
 *
 * Reads the device ID from persistent storage, or generates and stores
 * a new one if this is the first launch.
 *
 * @returns Promise resolving to the device ID
 */
export async function initializeDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;

  let deviceIdFile = new File(Paths.document, "device-id.txt");

  try {
    if (deviceIdFile.exists) {
      cachedDeviceId = await deviceIdFile.text();
      return cachedDeviceId;
    }
  } catch {
    // File doesn't exist or read failed, generate new ID
  }

  cachedDeviceId = Crypto.randomUUID();
  deviceIdFile.write(cachedDeviceId, {});
  return cachedDeviceId;
}

/**
 * Get device identifier
 *
 * Returns the cached device ID. Must call initializeDeviceId() first.
 *
 * @returns Device ID
 * @throws Error if initializeDeviceId() hasn't been called
 *
 * @example
 * ```typescript
 * await initializeDeviceId();
 * let deviceId = getDeviceId();
 * console.log(deviceId); // "abc-123-def-456"
 * ```
 */
export function getDeviceId(): string {
  if (!cachedDeviceId) {
    throw new Error("Device ID not initialized. Call initializeDeviceId() first.");
  }
  return cachedDeviceId;
}

/**
 * Reset cached device ID for testing purposes only.
 * @internal
 */
export function __resetCachedDeviceIdForTesting(): void {
  cachedDeviceId = null;
}

/**
 * Set cached device ID for testing purposes only.
 * @internal
 */
export function __setCachedDeviceIdForTesting(id: string): void {
  cachedDeviceId = id;
}
