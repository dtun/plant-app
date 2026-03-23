import { render, screen } from "@testing-library/react-native";
import { InitialsAvatar } from "./initials-avatar";
import { getAvatarColor } from "@/utils/avatar-helpers";

describe("InitialsAvatar", () => {
  test("renders initials from plant name", () => {
    render(<InitialsAvatar name="Snake Plant" />);
    expect(screen.getByText("SP")).toBeTruthy();
  });

  test("renders single initial for single-word name", () => {
    render(<InitialsAvatar name="Monstera" />);
    expect(screen.getByText("M")).toBeTruthy();
  });

  test("applies deterministic background color from name", () => {
    let expectedColor = getAvatarColor("Snake Plant");
    render(<InitialsAvatar name="Snake Plant" />);
    let avatar = screen.getByTestId("initials-avatar");
    expect(avatar.props.style).toEqual(expect.objectContaining({ backgroundColor: expectedColor }));
  });

  test("uses default size of 48", () => {
    render(<InitialsAvatar name="Monstera" />);
    let avatar = screen.getByTestId("initials-avatar");
    expect(avatar.props.style).toEqual(expect.objectContaining({ width: 48, height: 48 }));
  });

  test("accepts custom size prop", () => {
    render(<InitialsAvatar name="Monstera" size={64} />);
    let avatar = screen.getByTestId("initials-avatar");
    expect(avatar.props.style).toEqual(expect.objectContaining({ width: 64, height: 64 }));
  });

  test("renders circle shape", () => {
    render(<InitialsAvatar name="Monstera" size={40} />);
    let avatar = screen.getByTestId("initials-avatar");
    expect(avatar.props.style).toEqual(expect.objectContaining({ borderRadius: 20 }));
  });

  test("text color is dark for sufficient contrast against pastel backgrounds", () => {
    render(<InitialsAvatar name="Monstera" />);
    let text = screen.getByText("M");
    expect(text.props.style).toEqual(expect.objectContaining({ color: "#333333" }));
  });

  test("has correct accessibility label", () => {
    render(<InitialsAvatar name="Snake Plant" />);
    let avatar = screen.getByTestId("initials-avatar");
    expect(avatar.props.accessibilityLabel).toBe("Snake Plant avatar");
  });

  test("handles empty name gracefully", () => {
    render(<InitialsAvatar name="" />);
    let avatar = screen.getByTestId("initials-avatar");
    expect(avatar).toBeTruthy();
  });
});
