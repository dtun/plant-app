import { EntitlementsProvider } from "@/contexts/entitlements-context";
import {
  __setEntitlementsForTests,
  createFakeEntitlements,
  createRevenueCatEntitlements,
  type FakeEntitlementsResponses,
} from "@/src/entitlements";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import PaywallScreen from "./paywall";

let mockBack = jest.fn();
let mockParams: { reason?: string } = {};

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack }),
  useLocalSearchParams: () => mockParams,
}));

function renderPaywall(responses: FakeEntitlementsResponses = {}) {
  let fake = createFakeEntitlements(responses);
  __setEntitlementsForTests(fake);
  render(
    <EntitlementsProvider>
      <PaywallScreen />
    </EntitlementsProvider>
  );
  return fake;
}

beforeEach(() => {
  mockParams = {};
});

afterEach(() => {
  __setEntitlementsForTests(createRevenueCatEntitlements());
});

test("shows the offer's price and renewal term", async () => {
  renderPaywall({
    offer: { ok: true, value: { priceLabel: "$29.99", productId: "pro_annual", term: "annual" } },
  });

  expect(await screen.findByText("$29.99")).toBeOnTheScreen();
  expect(screen.getByText("Renews yearly")).toBeOnTheScreen();
});

test("shows a message when the offer cannot be loaded", async () => {
  renderPaywall({ offer: { ok: false, failure: { kind: "network" } } });

  expect(
    await screen.findByText("Couldn't load the subscription. Check your connection and try again.")
  ).toBeOnTheScreen();
});

test("a successful subscribe dismisses the paywall", async () => {
  let fake = renderPaywall();
  let purchase = jest.spyOn(fake, "purchase");

  fireEvent.press(await screen.findByRole("button", { name: "Subscribe" }));

  await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));
  expect(purchase).toHaveBeenCalledWith(
    expect.objectContaining({ productId: "pro_monthly", priceLabel: "$4.99" })
  );
});

test("a cancelled subscribe returns to idle with no message", async () => {
  let fake = renderPaywall({ purchase: { ok: false, failure: { kind: "cancelled" } } });
  let purchase = jest.spyOn(fake, "purchase");

  fireEvent.press(await screen.findByRole("button", { name: "Subscribe" }));

  await waitFor(() => expect(purchase).toHaveBeenCalledTimes(1));
  expect(mockBack).not.toHaveBeenCalled();
  expect(screen.queryByRole("alert")).toBeNull();
  expect(screen.getByRole("button", { name: "Subscribe" })).toBeEnabled();
});

test("a network failure during subscribe shows a message and stays put", async () => {
  renderPaywall({ purchase: { ok: false, failure: { kind: "network" } } });

  fireEvent.press(await screen.findByRole("button", { name: "Subscribe" }));

  expect(
    await screen.findByText("Couldn't reach the store. Check your connection and try again.")
  ).toBeOnTheScreen();
  expect(mockBack).not.toHaveBeenCalled();
});

test("a not-allowed failure during subscribe explains that purchases are blocked", async () => {
  renderPaywall({ purchase: { ok: false, failure: { kind: "not-allowed" } } });

  fireEvent.press(await screen.findByRole("button", { name: "Subscribe" }));

  expect(
    await screen.findByText("Purchases aren't allowed on this device or account.")
  ).toBeOnTheScreen();
});

test("an unknown failure during subscribe shows a generic message", async () => {
  renderPaywall({ purchase: { ok: false, failure: { kind: "unknown" } } });

  fireEvent.press(await screen.findByRole("button", { name: "Subscribe" }));

  expect(await screen.findByText("Something went wrong. Please try again.")).toBeOnTheScreen();
});

test("a successful restore dismisses the paywall", async () => {
  let fake = renderPaywall({
    restore: {
      ok: true,
      value: {
        isPro: true,
        productId: "pro_monthly",
        expiresAt: 4102444800000,
        willRenew: true,
        managementUrl: null,
      },
    },
  });
  let restore = jest.spyOn(fake, "restore");

  fireEvent.press(await screen.findByRole("button", { name: "Restore purchase" }));

  await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));
  expect(restore).toHaveBeenCalledTimes(1);
});

test("a restore that finds no purchase says so and stays put", async () => {
  renderPaywall();

  fireEvent.press(await screen.findByRole("button", { name: "Restore purchase" }));

  expect(
    await screen.findByText("No previous purchase was found for this account.")
  ).toBeOnTheScreen();
  expect(mockBack).not.toHaveBeenCalled();
});

test("a network failure during restore shows a message and stays put", async () => {
  renderPaywall({ restore: { ok: false, failure: { kind: "network" } } });

  fireEvent.press(await screen.findByRole("button", { name: "Restore purchase" }));

  expect(
    await screen.findByText("Couldn't reach the store. Check your connection and try again.")
  ).toBeOnTheScreen();
  expect(mockBack).not.toHaveBeenCalled();
});

test("Not now dismisses without purchasing or restoring", async () => {
  let fake = renderPaywall();
  let purchase = jest.spyOn(fake, "purchase");
  let restore = jest.spyOn(fake, "restore");

  fireEvent.press(await screen.findByRole("button", { name: "Not now" }));

  expect(mockBack).toHaveBeenCalledTimes(1);
  expect(purchase).not.toHaveBeenCalled();
  expect(restore).not.toHaveBeenCalled();
});

test("the default headline invites the user to give their plants a voice", async () => {
  renderPaywall();

  expect(await screen.findByRole("header", { name: "Give your plants a voice" })).toBeOnTheScreen();
});

test("arriving with an exhausted allowance acknowledges the free interactions", async () => {
  mockParams = { reason: "allowance-exhausted" };
  renderPaywall();

  expect(
    await screen.findByRole("header", { name: "You've used your free conversations" })
  ).toBeOnTheScreen();
  expect(screen.queryByText("Give your plants a voice")).toBeNull();
});

test("lists what the subscription includes", async () => {
  renderPaywall();

  expect(await screen.findByText("Chat with your plants, any time")).toBeOnTheScreen();
  expect(
    screen.getByText("Names and personalities grounded in what each plant is")
  ).toBeOnTheScreen();
  expect(screen.getByText("Care notes read from a photo")).toBeOnTheScreen();
  expect(screen.getByText("No API key or setup needed")).toBeOnTheScreen();
});

test("an already-subscribed user sees that and has nothing to buy", async () => {
  renderPaywall({
    entitlement: {
      ok: true,
      value: {
        isPro: true,
        productId: "pro_monthly",
        expiresAt: 4102444800000,
        willRenew: true,
        managementUrl: null,
      },
    },
  });

  expect(await screen.findByText("You're already subscribed to KeepTend Pro.")).toBeOnTheScreen();
  expect(screen.queryByRole("button", { name: "Subscribe" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Restore purchase" })).toBeNull();

  fireEvent.press(screen.getByRole("button", { name: "Done" }));

  expect(mockBack).toHaveBeenCalledTimes(1);
});

test("a subscribed user never sees Subscribe, even before the entitlement loads", async () => {
  renderPaywall({
    entitlement: {
      ok: true,
      value: {
        isPro: true,
        productId: "pro_monthly",
        expiresAt: 4102444800000,
        willRenew: true,
        managementUrl: null,
      },
    },
  });

  expect(screen.queryByRole("button", { name: "Subscribe" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Restore purchase" })).toBeNull();

  await screen.findByText("You're already subscribed to KeepTend Pro.");

  expect(screen.queryByRole("button", { name: "Subscribe" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Restore purchase" })).toBeNull();
});

test("an unconfigured seam hides billing and explains why", async () => {
  renderPaywall({ entitlement: { ok: false, failure: { kind: "no-config" } } });

  expect(
    await screen.findByText("Subscriptions aren't available in this build.")
  ).toBeOnTheScreen();
  expect(screen.queryByRole("button", { name: "Subscribe" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Restore purchase" })).toBeNull();
  expect(screen.getByRole("button", { name: "Not now" })).toBeOnTheScreen();
});
