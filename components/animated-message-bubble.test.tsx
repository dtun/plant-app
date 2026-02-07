import { render, screen } from "@testing-library/react-native";

import { AnimatedMessageBubble } from "./animated-message-bubble";

jest.mock("@/components/message-bubble", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  let { Text } = require("react-native");
  return {
    MessageBubble: ({ content }: { content: string }) => <Text>{content}</Text>,
  };
});

test("renders message content with 'none' animation type", () => {
  render(<AnimatedMessageBubble animationType="none" role="user" content="Hello!" />);

  expect(screen.getByText("Hello!")).toBeOnTheScreen();
});

test("renders message content with 'slide-up' animation type", () => {
  render(<AnimatedMessageBubble animationType="slide-up" role="user" content="User message" />);

  expect(screen.getByText("User message")).toBeOnTheScreen();
});

test("renders message content with 'fade-in' animation type", () => {
  render(<AnimatedMessageBubble animationType="fade-in" role="assistant" content="Bot reply" />);

  expect(screen.getByText("Bot reply")).toBeOnTheScreen();
});

test("renders with animationDelay prop", () => {
  render(
    <AnimatedMessageBubble
      animationType="fade-in"
      animationDelay={200}
      role="assistant"
      content="Delayed message"
    />
  );

  expect(screen.getByText("Delayed message")).toBeOnTheScreen();
});
