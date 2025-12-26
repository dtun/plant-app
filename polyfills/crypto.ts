/**
 * Crypto polyfill for React Native
 *
 * Adds crypto.getRandomValues to the global object using expo-crypto.
 * Required by LiveStore's nanoid dependency.
 */

import * as Crypto from "expo-crypto";

// Polyfill crypto.getRandomValues for React Native
if (typeof global.crypto === "undefined") {
  global.crypto = {
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
