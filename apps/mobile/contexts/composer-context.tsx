import { useChatContext } from "@/contexts/chat-context";
import { useMessageList } from "@/contexts/message-list-context";
import { intelligence, type ChatMessage, type PlantContext } from "@/src/intelligence";
import { events } from "@/src/livestore/schema";
import { getDeviceId } from "@/utils/device";
import {
  pickImageFromLibrary,
  showPhotoPickerAlert,
  takePhotoWithCamera,
  type PhotoFailure,
} from "@/utils/photo-utils";
import { useLingui } from "@lingui/react/macro";
import * as Crypto from "expo-crypto";
import { createContext, useCallback, useContext, useState } from "react";
import { Alert, LayoutChangeEvent } from "react-native";
import { useSharedValue } from "react-native-reanimated";

interface ComposerContextValue {
  inputText: string;
  setInputText: (text: string) => void;
  pendingImageUri: string | null;
  setPendingImageUri: (uri: string | null) => void;
  composerHeight: { value: number };
  handleComposerLayout: (event: LayoutChangeEvent) => void;
  handleAttachPhoto: () => void;
  handleSend: () => Promise<void>;
}

let ComposerContext = createContext<ComposerContextValue | null>(null);

export function ComposerProvider({ children }: { children: React.ReactNode }) {
  let { plantId, store, plant } = useChatContext();
  let { messages, markAsNew, setIsGenerating, isGenerating } = useMessageList();

  let { t } = useLingui();
  let [inputText, setInputText] = useState("");
  let [pendingImageUri, setPendingImageUri] = useState<string | null>(null);
  let [pendingImageBase64, setPendingImageBase64] = useState<string | null>(null);
  let composerHeight = useSharedValue(0);

  let handleComposerLayout = useCallback(
    (event: LayoutChangeEvent) => {
      composerHeight.value = event.nativeEvent.layout.height;
    },
    [composerHeight]
  );

  function notifyPhotoFailure(failure: PhotoFailure, surface: "camera" | "library") {
    if (failure.kind === "cancelled") return;
    if (failure.kind === "permission-denied") {
      Alert.alert(
        t`Permission Required`,
        surface === "camera"
          ? t`Please allow access to your camera to take plant photos.`
          : t`Please allow access to your photo library to select plant photos.`
      );
      return;
    }
    Alert.alert(
      t`Error`,
      surface === "camera"
        ? t`Failed to take photo. Please try again.`
        : t`Failed to pick image. Please try again.`
    );
  }

  function handleAttachPhoto() {
    showPhotoPickerAlert(
      async () => {
        let result = await takePhotoWithCamera();
        if (result.ok) {
          setPendingImageUri(result.uri);
          setPendingImageBase64(result.base64);
        } else {
          notifyPhotoFailure(result.failure, "camera");
        }
      },
      async () => {
        let result = await pickImageFromLibrary();
        if (result.ok) {
          setPendingImageUri(result.uri);
          setPendingImageBase64(result.base64);
        } else {
          notifyPhotoFailure(result.failure, "library");
        }
      }
    );
  }

  async function handleSend() {
    let text = inputText.trim();
    let imageUri = pendingImageUri;
    let imageBase64 = pendingImageBase64;
    if ((!text && !imageUri) || isGenerating || !plant) return;

    setInputText("");
    setPendingImageUri(null);
    setPendingImageBase64(null);
    let deviceId = getDeviceId();
    let now = Date.now();

    // Commit user message
    let userMessageId = Crypto.randomUUID();
    markAsNew(userMessageId);
    store.commit(
      events.messageCreated({
        id: userMessageId,
        plantId,
        userId: deviceId,
        role: "user",
        content: text || "",
        imageUri: imageUri ?? undefined,
        createdAt: now,
      })
    );

    // Generate AI response
    setIsGenerating(true);
    try {
      let plantContext: PlantContext = {
        name: plant.name,
        description: plant.description,
        size: plant.size,
        photoUri: plant.photoUri,
        aiAnalysis: plant.aiAnalysis,
      };

      let chatHistory: ChatMessage[] = messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
        imageUri: m.imageUri ?? undefined,
      }));
      chatHistory.push({
        role: "user",
        content: text || t`What do you see in this photo?`,
        imageUri: imageUri ?? undefined,
        imageBase64: imageBase64 ?? undefined,
      });

      let result = await intelligence().generateChatResponse({
        plantContext,
        messages: chatHistory,
      });

      let messageContent: string;
      if (result.ok) {
        messageContent = result.value;
      } else {
        switch (result.failure.kind) {
          case "no-config":
          case "invalid-key":
            messageContent = t`I need to be set up first. Please configure your AI settings.`;
            break;
          case "quota":
          case "network":
          case "unknown":
            messageContent = result.failure.message;
            break;
        }
      }

      let assistantMessageId = Crypto.randomUUID();
      markAsNew(assistantMessageId);
      store.commit(
        events.messageCreated({
          id: assistantMessageId,
          plantId,
          userId: deviceId,
          role: "assistant",
          content: messageContent,
          createdAt: Date.now(),
        })
      );
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <ComposerContext.Provider
      value={{
        inputText,
        setInputText,
        pendingImageUri,
        setPendingImageUri,
        composerHeight,
        handleComposerLayout,
        handleAttachPhoto,
        handleSend,
      }}
    >
      {children}
    </ComposerContext.Provider>
  );
}

export function useComposer(): ComposerContextValue {
  let context = useContext(ComposerContext);
  if (!context) {
    throw new Error("useComposer must be used within a ComposerProvider");
  }
  return context;
}
