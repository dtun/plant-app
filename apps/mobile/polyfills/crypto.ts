/**
 * Crypto polyfill for React Native
 *
 * Adds crypto.getRandomValues and crypto.randomUUID to the global object
 * using expo-crypto. getRandomValues is required by LiveStore's nanoid
 * dependency; randomUUID is provided so callers of the global do not hit a
 * missing method at runtime that the type system said was there.
 *
 * crypto.subtle is not provided. The cast below hides that gap, so do not
 * rely on the global's SubtleCrypto in app code.
 */

import * as Crypto from "expo-crypto";

type UUID = ReturnType<globalThis.Crypto["randomUUID"]>;

// Polyfill crypto.getRandomValues and crypto.randomUUID for React Native
if (typeof global.crypto === "undefined") {
  global.crypto = {
    randomUUID(): UUID {
      return Crypto.randomUUID() as UUID;
    },

    getRandomValues<T extends ArrayBufferView>(array: T): T {
      // Get the byte length from the ArrayBufferView
      let byteLength = array.byteLength;

      // Get random bytes from expo-crypto
      let randomBytes = Crypto.getRandomBytes(byteLength);

      // Create a Uint8Array view of the input array's buffer
      let uint8View = new Uint8Array(array.buffer, array.byteOffset, byteLength);

      // Copy the random bytes into the view
      uint8View.set(randomBytes);

      return array;
    },
  } as Crypto;
}
