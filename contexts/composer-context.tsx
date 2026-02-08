import { useChatContext } from "@/contexts/chat-context";
import { useMessageList } from "@/contexts/message-list-context";
import { events } from "@/src/livestore/schema";
import { generateChatResponse, type ChatMessage, type PlantContext } from "@/utils/ai-service";
import { getDeviceId } from "@/utils/device";
import {
  pickImageFromLibrary,
  showPhotoPickerAlert,
  takePhotoWithCamera,
} from "@/utils/photo-utils";
import * as Crypto from "expo-crypto";
import { createContext, useCallback, useContext, useState } from "react";
import { LayoutChangeEvent } from "react-native";
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

  let [inputText, setInputText] = useState("");
  let [pendingImageUri, setPendingImageUri] = useState<string | null>(null);
  let composerHeight = useSharedValue(0);

  let handleComposerLayout = useCallback(
    (event: LayoutChangeEvent) => {
      composerHeight.value = event.nativeEvent.layout.height;
    },
    [composerHeight]
  );

  function handleAttachPhoto() {
    showPhotoPickerAlert(
      async () => {
        let result = await takePhotoWithCamera();
        if (!result.cancelled) {
          setPendingImageUri(result.uri);
        }
      },
      async () => {
        let result = await pickImageFromLibrary();
        if (!result.cancelled) {
          setPendingImageUri(result.uri);
        }
      }
    );
  }

  async function handleSend() {
    let text = inputText.trim();
    let imageUri = pendingImageUri;
    if ((!text && !imageUri) || isGenerating || !plant) return;

    setInputText("");
    setPendingImageUri(null);
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

      // Build message history for context
      let chatHistory: ChatMessage[] = messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
        imageUri: m.imageUri ?? undefined,
      }));
      chatHistory.push({
        role: "user",
        content: text || "What do you see in this photo?",
        imageUri: imageUri ?? undefined,
      });

      let response = await generateChatResponse(plantContext, chatHistory);

      let assistantMessageId = Crypto.randomUUID();
      markAsNew(assistantMessageId);
      store.commit(
        events.messageCreated({
          id: assistantMessageId,
          plantId,
          userId: deviceId,
          role: "assistant",
          content: response,
          createdAt: Date.now(),
        })
      );
    } catch (error) {
      let errorMessage = "Sorry, I couldn't respond right now. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      let errorMessageId = Crypto.randomUUID();
      markAsNew(errorMessageId);
      store.commit(
        events.messageCreated({
          id: errorMessageId,
          plantId,
          userId: deviceId,
          role: "assistant",
          content: errorMessage,
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
