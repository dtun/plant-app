import { ChatLayout } from "@/components/chat/chat-layout";
import { ChatProvider } from "@/contexts/chat-context";
import { ComposerProvider } from "@/contexts/composer-context";
import { MessageListProvider } from "@/contexts/message-list-context";

export default function ChatScreen() {
  return (
    <ChatProvider>
      <MessageListProvider>
        <ComposerProvider>
          <ChatLayout />
        </ComposerProvider>
      </MessageListProvider>
    </ChatProvider>
  );
}
