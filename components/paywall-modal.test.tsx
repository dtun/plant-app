import { describe, expect, it, jest } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";
import PaywallModal from "./paywall-modal";

describe("PaywallModal", () => {
  it("should render when visible", () => {
    const onClose = jest.fn();
    const onUpgrade = jest.fn();

    render(
      <PaywallModal visible={true} onClose={onClose} onUpgrade={onUpgrade} />
    );

    expect(screen.getByText(/Free Limit Reached/i)).toBeTruthy();
    expect(screen.getByText(/Upgrade to Premium/i)).toBeTruthy();
  });

  it("should not render when not visible", () => {
    const onClose = jest.fn();
    const onUpgrade = jest.fn();

    const { queryByText } = render(
      <PaywallModal visible={false} onClose={onClose} onUpgrade={onUpgrade} />
    );

    expect(queryByText(/Free Limit Reached/i)).toBeNull();
  });

  it("should show benefits list", () => {
    const onClose = jest.fn();
    const onUpgrade = jest.fn();

    render(
      <PaywallModal visible={true} onClose={onClose} onUpgrade={onUpgrade} />
    );

    expect(screen.getByText(/Unlimited AI analysis/i)).toBeTruthy();
    expect(screen.getByText(/Unlimited name generation/i)).toBeTruthy();
  });

  it("should have upgrade and close buttons", () => {
    const onClose = jest.fn();
    const onUpgrade = jest.fn();

    render(
      <PaywallModal visible={true} onClose={onClose} onUpgrade={onUpgrade} />
    );

    expect(screen.getByText("Upgrade Now")).toBeTruthy();
    expect(screen.getByText("Maybe Later")).toBeTruthy();
  });
});
