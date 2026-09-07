import { EntitlementsProvider } from "@/contexts/entitlements-context";
import {
  __setEntitlementsForTests,
  createFakeEntitlements,
  createRevenueCatEntitlements,
  type FakeEntitlementsResponses,
} from "@/src/entitlements";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { SubscriptionSection } from "./subscription-section";

let onSubscribe = jest.fn();
let onManage = jest.fn();

function renderSection(responses: FakeEntitlementsResponses = {}) {
  let fake = createFakeEntitlements(responses);
  __setEntitlementsForTests(fake);
  render(
    <EntitlementsProvider>
      <SubscriptionSection onSubscribe={onSubscribe} onManage={onManage} />
    </EntitlementsProvider>
  );
  return fake;
}

beforeEach(() => {
  onSubscribe.mockClear();
  onManage.mockClear();
});

afterEach(() => {
  __setEntitlementsForTests(createRevenueCatEntitlements());
});

test("a user without a subscription sees that and can subscribe or restore", async () => {
  renderSection();

  expect(await screen.findByText("Not subscribed")).toBeOnTheScreen();
  expect(screen.getByRole("button", { name: "Subscribe" })).toBeOnTheScreen();
  expect(screen.getByRole("button", { name: "Restore purchase" })).toBeOnTheScreen();
});

test("Subscribe hands off to the injected navigation", async () => {
  renderSection();

  fireEvent.press(await screen.findByRole("button", { name: "Subscribe" }));

  expect(onSubscribe).toHaveBeenCalledTimes(1);
});

test("a renewing subscriber sees their plan and the renewal date", async () => {
  renderSection({
    entitlement: {
      ok: true,
      value: {
        isPro: true,
        productId: "pro_monthly",
        expiresAt: 1767268800000,
        willRenew: true,
        managementUrl: null,
      },
    },
  });

  expect(await screen.findByText("Subscribed to KeepTend Pro")).toBeOnTheScreen();
  expect(screen.getByText("Renews on January 1, 2026")).toBeOnTheScreen();
  expect(screen.queryByRole("button", { name: "Subscribe" })).toBeNull();
});

test("a cancelled-but-active subscriber sees when access ends", async () => {
  renderSection({
    entitlement: {
      ok: true,
      value: {
        isPro: true,
        productId: "pro_monthly",
        expiresAt: 1767268800000,
        willRenew: false,
        managementUrl: null,
      },
    },
  });

  expect(await screen.findByText("Expires on January 1, 2026")).toBeOnTheScreen();
  expect(screen.queryByText("Renews on January 1, 2026")).toBeNull();
});

test("a lifetime unlock shows no renewal or expiry date", async () => {
  renderSection({
    entitlement: {
      ok: true,
      value: {
        isPro: true,
        productId: "pro_lifetime",
        expiresAt: null,
        willRenew: false,
        managementUrl: null,
      },
    },
  });

  expect(await screen.findByText("Subscribed to KeepTend Pro")).toBeOnTheScreen();
  expect(screen.queryByText(/Renews on|Expires on/)).toBeNull();
});

test("Manage subscription opens the store's management page", async () => {
  renderSection({
    entitlement: {
      ok: true,
      value: {
        isPro: true,
        productId: "pro_monthly",
        expiresAt: 1767268800000,
        willRenew: true,
        managementUrl: "https://example.test/manage",
      },
    },
  });

  fireEvent.press(await screen.findByRole("button", { name: "Manage subscription" }));

  expect(onManage).toHaveBeenCalledWith("https://example.test/manage");
});

test("Manage subscription is hidden when the store offers no management page", async () => {
  renderSection({
    entitlement: {
      ok: true,
      value: {
        isPro: true,
        productId: "pro_monthly",
        expiresAt: 1767268800000,
        willRenew: true,
        managementUrl: null,
      },
    },
  });

  await screen.findByText("Subscribed to KeepTend Pro");

  expect(screen.queryByRole("button", { name: "Manage subscription" })).toBeNull();
});
