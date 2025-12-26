import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";

export interface PhotoResult {
  uri: string;
  cancelled: boolean;
}

export async function pickImageFromLibrary(): Promise<PhotoResult> {
  try {
    let permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(
        "Permission Required",
        "Please allow access to your photo library to select plant photos."
      );
      return { uri: "", cancelled: true };
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) {
      return { uri: "", cancelled: true };
    }

    return { uri: result.assets[0].uri, cancelled: false };
  } catch (error) {
    console.error("Error picking image:", error);
    Alert.alert("Error", "Failed to pick image. Please try again.");
    return { uri: "", cancelled: true };
  }
}

export async function takePhotoWithCamera(): Promise<PhotoResult> {
  try {
    let permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(
        "Permission Required",
        "Please allow access to your camera to take plant photos."
      );
      return { uri: "", cancelled: true };
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) {
      return { uri: "", cancelled: true };
    }

    return { uri: result.assets[0].uri, cancelled: false };
  } catch (error) {
    console.error("Error taking photo:", error);
    Alert.alert("Error", "Failed to take photo. Please try again.");
    return { uri: "", cancelled: true };
  }
}

export function showPhotoPickerAlert(onCamera: () => void, onLibrary: () => void): void {
  Alert.alert("Select Plant Photo", "Choose how you'd like to add a photo of your plant", [
    { text: "Camera", onPress: onCamera },
    { text: "Photo Library", onPress: onLibrary },
    { text: "Cancel", style: "cancel" },
  ]);
}
