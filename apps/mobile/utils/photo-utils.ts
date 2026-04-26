import { msg } from "@lingui/core/macro";
import { i18n } from "@/src/i18n";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";

export type PhotoFailureKind = "cancelled" | "permission-denied" | "failed";

export interface PhotoFailure {
  kind: PhotoFailureKind;
}

export type PhotoResult =
  | { ok: true; uri: string; base64: string | null }
  | { ok: false; failure: PhotoFailure };

export async function pickImageFromLibrary(): Promise<PhotoResult> {
  try {
    let permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      return { ok: false, failure: { kind: "permission-denied" } };
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (result.canceled || !result.assets[0]) {
      return { ok: false, failure: { kind: "cancelled" } };
    }

    return {
      ok: true,
      uri: result.assets[0].uri,
      base64: result.assets[0].base64 ?? null,
    };
  } catch (error) {
    console.error("Error picking image:", error);
    return { ok: false, failure: { kind: "failed" } };
  }
}

export async function takePhotoWithCamera(): Promise<PhotoResult> {
  try {
    let permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      return { ok: false, failure: { kind: "permission-denied" } };
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (result.canceled || !result.assets[0]) {
      return { ok: false, failure: { kind: "cancelled" } };
    }

    return {
      ok: true,
      uri: result.assets[0].uri,
      base64: result.assets[0].base64 ?? null,
    };
  } catch (error) {
    console.error("Error taking photo:", error);
    return { ok: false, failure: { kind: "failed" } };
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
