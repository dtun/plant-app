import { msg } from "@lingui/core/macro";
import { i18n } from "@/src/i18n";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";

export interface PhotoResult {
  uri: string;
  base64: string | null;
  cancelled: boolean;
}

export async function pickImageFromLibrary(): Promise<PhotoResult> {
  try {
    let permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(
        i18n._(msg`Permission Required`),
        i18n._(msg`Please allow access to your photo library to select plant photos.`)
      );
      return { uri: "", base64: null, cancelled: true };
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (result.canceled || !result.assets[0]) {
      return { uri: "", base64: null, cancelled: true };
    }

    return {
      uri: result.assets[0].uri,
      base64: result.assets[0].base64 ?? null,
      cancelled: false,
    };
  } catch (error) {
    console.error("Error picking image:", error);
    Alert.alert(i18n._(msg`Error`), i18n._(msg`Failed to pick image. Please try again.`));
    return { uri: "", base64: null, cancelled: true };
  }
}

export async function takePhotoWithCamera(): Promise<PhotoResult> {
  try {
    let permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(
        i18n._(msg`Permission Required`),
        i18n._(msg`Please allow access to your camera to take plant photos.`)
      );
      return { uri: "", base64: null, cancelled: true };
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (result.canceled || !result.assets[0]) {
      return { uri: "", base64: null, cancelled: true };
    }

    return {
      uri: result.assets[0].uri,
      base64: result.assets[0].base64 ?? null,
      cancelled: false,
    };
  } catch (error) {
    console.error("Error taking photo:", error);
    Alert.alert(i18n._(msg`Error`), i18n._(msg`Failed to take photo. Please try again.`));
    return { uri: "", base64: null, cancelled: true };
  }
}

export function showPhotoPickerAlert(onCamera: () => void, onLibrary: () => void): void {
  Alert.alert(
    i18n._(msg`Select Plant Photo`),
    i18n._(msg`Choose how you'd like to add a photo of your plant`),
    [
      { text: i18n._(msg`Camera`), onPress: onCamera },
      { text: i18n._(msg`Photo Library`), onPress: onLibrary },
      { text: i18n._(msg`Cancel`), style: "cancel" },
    ]
  );
}
