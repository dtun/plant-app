import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from "expo-application";
import { Platform } from "react-native";

export async function getDeviceId(): Promise<string> {
  // Try to get existing device ID
  let deviceId = await AsyncStorage.getItem("deviceId");

  if (!deviceId) {
    // Generate new device ID based on platform
    if (Platform.OS === "ios") {
      deviceId = await Application.getIosIdForVendorAsync();
    }

    // Fallback to timestamp-based ID if platform ID unavailable
    if (!deviceId) {
      deviceId = `device-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 9)}`;
    }

    // Store for future use
    await AsyncStorage.setItem("deviceId", deviceId);
  }

  return deviceId;
}
