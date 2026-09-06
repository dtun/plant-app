import { render, screen, fireEvent } from "@testing-library/react-native";
import { ChatHeaderMenu } from "./chat-header-menu";

jest.mock("@/components/ui/icon-symbol", () => ({
  IconSymbol: () => null,
}));

let mockOnClearChat = jest.fn();

beforeEach(() => {
  mockOnClearChat.mockClear();
});

test("renders Share, Care Plan, and Clear Chat menu items", () => {
  render(<ChatHeaderMenu onClearChat={mockOnClearChat} />);

  expect(screen.getByText("Share")).toBeOnTheScreen();
  expect(screen.getByText("Care Plan")).toBeOnTheScreen();
  expect(screen.getByText("Clear Chat")).toBeOnTheScreen();
});

test("renders Coming soon subtitle on Share and Care Plan items", () => {
  render(<ChatHeaderMenu onClearChat={mockOnClearChat} />);

  expect(screen.getAllByText("Coming soon")).toHaveLength(2);
});

test("Clear Chat calls onClearChat when selected", () => {
  render(<ChatHeaderMenu onClearChat={mockOnClearChat} />);

  let clearItem = screen.getByText("Clear Chat").parent?.parent;
  fireEvent(clearItem!, "touchEnd");

  expect(mockOnClearChat).toHaveBeenCalledTimes(1);
});
