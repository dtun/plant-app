/**
 * LiveStore Database Module
 *
 * Provides device-specific database configuration for KeepTend.
 * Each device gets isolated storage: keeptend-{deviceId}
 */

import { makePersistedAdapter } from "@livestore/adapter-expo";
import { useStore as useLiveStore } from "@livestore/react";
import Constants from "expo-constants";

/**
 * Get device-specific store ID
 * Format: keeptend-{deviceId}
 * Falls back to keeptend-default if deviceId unavailable
 *
 * Uses expo-constants sessionId for device identification.
 * This provides a unique ID per app installation.
 */
function getStoreId(): string {
  let deviceId = Constants.sessionId || "default";
  return `keeptend-${deviceId}`;
}

/**
 * Create adapter configured for this device
 * - Sync disabled by default (local-first)
 * - Device-specific storage location
 */
function createAdapter() {
  try {
    let storeId = getStoreId();

    return makePersistedAdapter({
      sync: undefined, // Disable sync
      storage: {
        subDirectory: storeId,
      },
    });
  } catch (error) {
    throw new Error(
      `Failed to create adapter: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * React hook to access LiveStore instance
 * Must be used within LiveStoreProvider context
 */
function useStore() {
  return useLiveStore();
}

export { createAdapter, getStoreId, useStore };
