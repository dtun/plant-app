import { render, screen, waitFor } from "@testing-library/react-native";
import { useStore } from "@livestore/react";
import { Text } from "react-native";

import { events } from "@/src/livestore/schema";
import { __setBillingForTests, createFakeBilling, type Billing } from "@/src/payments";

import { PurchaseProvider, usePurchase } from "./purchase-context";

jest.mock("@/utils/device", () => ({ getDeviceId: () => "test-device" }));

let commit: jest.Mock;
let query: jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  commit = jest.fn();
  query = jest.fn(() => []);
  (useStore as jest.Mock).mockReturnValue({ store: { commit, query } });
});

function Probe() {
  let { isPro, isLoading } = usePurchase();
  return <Text>{`pro=${isPro};loading=${isLoading}`}</Text>;
}

function renderProvider() {
  render(
    <PurchaseProvider>
      <Probe />
    </PurchaseProvider>
  );
}

test("opens the app when billing is unconfigured (fail open)", async () => {
  __setBillingForTests(
    createFakeBilling({ entitlement: { ok: false, failure: { kind: "no-config" } } })
  );

  renderProvider();

  await waitFor(() => expect(screen.getByText("pro=true;loading=false")).toBeOnTheScreen());
  expect(commit).not.toHaveBeenCalled();
});

test("unlocks when billing reports an active entitlement", async () => {
  __setBillingForTests(
    createFakeBilling({ entitlement: { ok: true, value: { isPro: true, productId: "lifetime" } } })
  );

  renderProvider();

  await waitFor(() => expect(screen.getByText("pro=true;loading=false")).toBeOnTheScreen());
});

test("stays locked when billing reports no entitlement", async () => {
  __setBillingForTests(
    createFakeBilling({ entitlement: { ok: true, value: { isPro: false, productId: null } } })
  );

  renderProvider();

  await waitFor(() => expect(screen.getByText("pro=false;loading=false")).toBeOnTheScreen());
});

test("fails closed (stays locked) when the entitlement check errors", async () => {
  __setBillingForTests(
    createFakeBilling({ entitlement: { ok: false, failure: { kind: "network" } } })
  );

  renderProvider();

  await waitFor(() => expect(screen.getByText("pro=false;loading=false")).toBeOnTheScreen());
});

test("clears the loading gate and fails closed when the billing call rejects", async () => {
  let rejectingBilling: Billing = {
    getEntitlement: async () => {
      throw new Error("native module hung");
    },
    getOffer: async () => ({ ok: false, failure: { kind: "unknown" } }),
    purchase: async () => ({ ok: false, failure: { kind: "unknown" } }),
    restore: async () => ({ ok: false, failure: { kind: "unknown" } }),
    subscribe: () => () => {},
  };
  __setBillingForTests(rejectingBilling);

  renderProvider();

  await waitFor(() => expect(screen.getByText("pro=false;loading=false")).toBeOnTheScreen());
});

test("records the pro tier to the user record on unlock", async () => {
  __setBillingForTests(
    createFakeBilling({ entitlement: { ok: true, value: { isPro: true, productId: "lifetime" } } })
  );

  renderProvider();

  await waitFor(() => expect(commit).toHaveBeenCalled());
  expect(events.userCreated).toHaveBeenCalledWith(
    expect.objectContaining({ id: "test-device", tier: "pro", subscriptionId: "lifetime" })
  );
});
