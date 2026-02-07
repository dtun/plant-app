import { AnimatedMessageBubble } from "@/components/animated-message-bubble";
import { ChatInput } from "@/components/ui/chat-input";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { PhotoUpload } from "@/components/ui/photo-upload";
import { SubmitButton } from "@/components/ui/submit-button";
import { plantById$, messagesByPlant$ } from "@/src/livestore/queries";
import { events } from "@/src/livestore/schema";
import { generateChatResponse, type ChatMessage, type PlantContext } from "@/utils/ai-service";
import { getDeviceId } from "@/utils/device";
import { useMessageAnimation } from "@/hooks/use-message-animation";
import {
  pickImageFromLibrary,
  showPhotoPickerAlert,
  takePhotoWithCamera,
} from "@/utils/photo-utils";
import { LegendList, type LegendListRef } from "@legendapp/list";
import { useQuery, useStore } from "@livestore/react";
import * as Crypto from "expo-crypto";
import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useResolveClassNames } from "uniwind";

function formatDayLabel(timestamp: number): string {
  let date = new Date(timestamp);
  let now = new Date();
  let diffMs = now.getTime() - date.getTime();
  let diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Today";
  }
  if (diffDays === 1) {
    return "Yesterday";
  }
  return date.toLocaleDateString([], {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function isSameDay(a: number, b: number): boolean {
  let dateA = new Date(a);
  let dateB = new Date(b);
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

function TypingIndicator() {
  return (
    <View className="px-4 py-1 items-start">
      <View className="rounded-2xl px-4 py-3 bg-bubble-assistant">
        <Text className="text-base text-icon">•••</Text>
      </View>
    </View>
  );
}

interface DaySeparatorProps {
  label: string;
}

function DaySeparator({ label }: DaySeparatorProps) {
  return (
    <View className="items-center py-3">
      <Text className="text-xs text-icon">{label}</Text>
    </View>
  );
}

export default function ChatScreen() {
  let { plantId } = useLocalSearchParams<{ plantId: string }>();
  let { store } = useStore();
  let plants = useQuery(plantById$(plantId));
  let plant = plants[0];

  let messages = useQuery(messagesByPlant$(plantId));

  let [inputText, setInputText] = useState("");
  let [pendingImageUri, setPendingImageUri] = useState<string | null>(null);
  let [isGenerating, setIsGenerating] = useState(false);
  let flatListRef = useRef<LegendListRef>(null);
  let { markAsNew, getAnimationType } = useMessageAnimation();
  let inputAreaStyle = useResolveClassNames("px-4 pt-2 bg-background");

  let scrollToBottom = useCallback(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, isGenerating, scrollToBottom]);

  function handleClearChat() {
    Alert.alert(
      "Clear Chat",
      `Are you sure you want to clear all messages with ${plant?.name ?? "this plant"}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            store.commit(
              events.chatCleared({
                plantId,
                deletedAt: Date.now(),
              })
            );
          },
        },
      ]
    );
  }

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

  // Build list data with day separators
  let listData: (
    | { type: "separator"; label: string }
    | { type: "message"; message: (typeof messages)[0] }
  )[] = [];
  let lastTimestamp: number | null = null;

  for (let msg of messages) {
    if (lastTimestamp === null || !isSameDay(lastTimestamp, msg.createdAt)) {
      listData.push({ type: "separator", label: formatDayLabel(msg.createdAt) });
    }
    listData.push({ type: "message", message: msg });
    lastTimestamp = msg.createdAt;
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <Stack.Screen
        options={{
          title: plant?.name ?? "Chat",
          headerBackTitle: "Chats",
          headerRight: () => (
            <>
              {plant?.photoUri ? (
                <View className="w-8 h-8 rounded-full overflow-hidden">
                  <Image
                    source={{ uri: plant.photoUri! }}
                    className="w-8 h-8"
                    accessibilityLabel={`Photo of ${plant.name}`}
                  />
                </View>
              ) : null}
              <Pressable
                onPress={handleClearChat}
                className="self-center"
                accessibilityRole="button"
                accessibilityLabel="Chat options"
                accessibilityHint="Opens chat options menu"
              >
                <Text className="text-base px-2 text-color p-1">Reset</Text>
              </Pressable>
            </>
          ),
        }}
      />

      <Animated.View entering={FadeIn.duration(200)} style={{ flex: 1 }}>
        <LegendList
          ref={flatListRef}
          data={listData}
          estimatedItemSize={80}
          keyExtractor={(item, index) =>
            item.type === "message" ? item.message.id : `sep-${index}`
          }
          renderItem={({ item }) => {
            if (item.type === "separator") {
              return <DaySeparator label={item.label} />;
            }
            let animationType = getAnimationType(item.message.id, item.message.role);
            return (
              <AnimatedMessageBubble
                animationType={animationType}
                animationDelay={item.message.role === "assistant" ? 200 : 0}
                role={item.message.role}
                content={item.message.content}
                imageUri={item.message.imageUri}
              />
            );
          }}
          ListFooterComponent={isGenerating ? <TypingIndicator /> : null}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center px-8">
              <Text className="text-icon text-base text-center">
                Say hello to {plant?.name ?? "your plant"}!
              </Text>
            </View>
          }
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: messages.length === 0 ? "center" : "flex-end",
            paddingVertical: 8,
          }}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={scrollToBottom}
        />
      </Animated.View>

      <SafeAreaView edges={["bottom", "left", "right"]} style={inputAreaStyle}>
        {pendingImageUri ? (
          <View className="flex-row items-center mb-2">
            <View className="relative">
              <Image
                source={{ uri: pendingImageUri }}
                className="w-16 h-16 rounded-lg"
                accessibilityLabel="Selected photo preview"
              />
              <TouchableOpacity
                onPress={() => setPendingImageUri(null)}
                className="absolute -top-1.5 -right-1.5 bg-red-500 rounded-full w-5 h-5 items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel="Remove selected photo"
              >
                <IconSymbol name="xmark" size={10} color="#fff" colorClassName={null} />
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
        <ChatInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          leftButton={<PhotoUpload selectedImage={null} onImageSelect={handleAttachPhoto} />}
          rightButton={
            <SubmitButton
              onPress={handleSend}
              disabled={(!inputText.trim() && !pendingImageUri) || isGenerating}
              isLoading={isGenerating}
            />
          }
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
