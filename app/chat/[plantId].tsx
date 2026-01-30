import { ActivityIndicator } from "@/components/ui/activity-indicator";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { events } from "@/src/livestore/schema";
import { generateChatResponse, type ChatMessage, type PlantContext } from "@/utils/ai-service";
import { getDeviceId } from "@/utils/device";
import {
  pickImageFromLibrary,
  showPhotoPickerAlert,
  takePhotoWithCamera,
} from "@/utils/photo-utils";
import { queryDb, Schema, sql } from "@livestore/livestore";
import { useQuery, useStore } from "@livestore/react";
import * as Crypto from "expo-crypto";
import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

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

interface MessageBubbleProps {
  role: string;
  content: string;
  imageUri?: string | null;
}

function MessageBubble({ role, content, imageUri }: MessageBubbleProps) {
  let isUser = role === "user";

  return (
    <View className={`px-4 py-1 ${isUser ? "items-end" : "items-start"}`}>
      <View
        className={`rounded-2xl max-w-[80%] overflow-hidden ${
          isUser ? "bg-bubble-user" : "bg-bubble-assistant"
        }`}
      >
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            className="w-56 h-56"
            accessibilityLabel="Photo sent in chat"
            resizeMode="cover"
          />
        ) : null}
        {content ? (
          <Text className={`text-base px-4 py-2.5 ${isUser ? "text-white" : "text-color"}`}>
            {content}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function TypingIndicator() {
  return (
    <View className="px-4 py-1 items-start">
      <View className="rounded-2xl px-4 py-3 bg-bubble-assistant flex-row items-center gap-1">
        <ActivityIndicator size="small" colorClassName="text-icon" />
        <Text className="text-sm text-icon ml-1">typing...</Text>
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

let PlantSchema = Schema.Struct({
  id: Schema.String,
  userId: Schema.String,
  name: Schema.String,
  description: Schema.NullOr(Schema.String),
  size: Schema.NullOr(Schema.String),
  photoUri: Schema.NullOr(Schema.String),
  aiAnalysis: Schema.NullOr(Schema.String),
  createdAt: Schema.Number,
  updatedAt: Schema.Number,
  syncedAt: Schema.NullOr(Schema.Number),
  deletedAt: Schema.NullOr(Schema.Number),
});

let MessageSchema = Schema.Struct({
  id: Schema.String,
  plantId: Schema.String,
  userId: Schema.String,
  role: Schema.String,
  content: Schema.String,
  imageUri: Schema.NullOr(Schema.String),
  createdAt: Schema.Number,
});

export default function ChatScreen() {
  let { plantId } = useLocalSearchParams<{ plantId: string }>();
  let { store } = useStore();
  let plantsQuery = queryDb(
    {
      query: sql`SELECT * FROM plants WHERE id = '${plantId}'`,
      schema: Schema.Array(PlantSchema),
    },
    { label: `plant-${plantId}` }
  );
  let plants = useQuery(plantsQuery);
  let plant = plants[0];

  let messagesQuery = queryDb(
    {
      query: sql`SELECT id, plantId, userId, role, content, imageUri, createdAt
        FROM chatMessages
        WHERE plantId = '${plantId}' AND deletedAt IS NULL
        ORDER BY createdAt ASC`,
      schema: Schema.Array(MessageSchema),
    },
    { label: `chatMessages-${plantId}` }
  );

  let messages = useQuery(messagesQuery);

  let [inputText, setInputText] = useState("");
  let [pendingImageUri, setPendingImageUri] = useState<string | null>(null);
  let [isGenerating, setIsGenerating] = useState(false);
  let flatListRef = useRef<FlatList>(null);

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
    store.commit(
      events.messageCreated({
        id: Crypto.randomUUID(),
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

      store.commit(
        events.messageCreated({
          id: Crypto.randomUUID(),
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
      store.commit(
        events.messageCreated({
          id: Crypto.randomUUID(),
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
            <View className="flex-row items-center gap-1">
              {plant?.photoUri ? (
                <View className="w-8 h-8 rounded-full overflow-hidden">
                  <Image
                    source={{ uri: plant.photoUri! }}
                    className="w-8 h-8"
                    accessibilityLabel={`Photo of ${plant.name}`}
                  />
                </View>
              ) : null}
              <TouchableOpacity
                onPress={handleClearChat}
                className="w-8 h-8 items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel="Chat options"
                accessibilityHint="Opens chat options menu"
              >
                <IconSymbol name="ellipsis.circle" size={22} colorClassName="text-tint" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <FlatList
        ref={flatListRef}
        data={listData}
        keyExtractor={(item, index) => (item.type === "message" ? item.message.id : `sep-${index}`)}
        renderItem={({ item }) => {
          if (item.type === "separator") {
            return <DaySeparator label={item.label} />;
          }
          return (
            <MessageBubble
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

      <View className="border-t border-icon px-4 py-2 bg-background">
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
        <View className="flex-row items-end gap-2">
          <TouchableOpacity
            onPress={handleAttachPhoto}
            disabled={isGenerating}
            className="rounded-full w-9 h-9 items-center justify-center mb-0.5"
            style={{ opacity: isGenerating ? 0.5 : 1 }}
            accessibilityRole="button"
            accessibilityLabel="Attach photo"
            accessibilityHint="Open camera or photo library to attach a photo"
            accessibilityState={{ disabled: isGenerating }}
          >
            <IconSymbol name="photo" size={22} colorClassName="text-tint" />
          </TouchableOpacity>
          <TextInput
            className="flex-1 text-base text-color bg-bubble-assistant rounded-2xl px-4 py-2 max-h-24 placeholder:text-placeholder"
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            multiline
            editable={!isGenerating}
            accessibilityLabel="Message input"
            accessibilityHint="Type a message to send to your plant"
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={(!inputText.trim() && !pendingImageUri) || isGenerating}
            className="rounded-full bg-tint w-9 h-9 items-center justify-center mb-0.5"
            style={{
              opacity: (!inputText.trim() && !pendingImageUri) || isGenerating ? 0.5 : 1,
            }}
            accessibilityRole="button"
            accessibilityLabel="Send message"
            accessibilityState={{
              disabled: (!inputText.trim() && !pendingImageUri) || isGenerating,
            }}
          >
            <IconSymbol name="arrow.up" size={18} color="#fff" colorClassName={null} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
