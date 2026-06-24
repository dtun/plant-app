import Purchases from "react-native-purchases";

import { createRevenueCatBilling } from "./revenuecat-billing";

let mockPurchases = Purchases as unknown as {
  configure: jest.Mock;
  getCustomerInfo: jest.Mock;
  getOfferings: jest.Mock;
  purchasePackage: jest.Mock;
  restorePurchases: jest.Mock;
  addCustomerInfoUpdateListener: jest.Mock;
  removeCustomerInfoUpdateListener: jest.Mock;
};

function customerInfo(active: Record<string, { productIdentifier: string }> = {}) {
  return { entitlements: { active, all: {} } };
}

let proInfo = customerInfo({ pro: { productIdentifier: "lifetime" } });

function setKeys() {
  process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY = "test-ios-key";
  process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY = "test-android-key";
}

beforeEach(() => {
  jest.clearAllMocks();
  setKeys();
});

afterEach(() => {
  delete process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
  delete process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;
});

test("getEntitlement returns no-config failure when no API key is set", async () => {
  delete process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
  delete process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;
  let billing = createRevenueCatBilling();

  let result = await billing.getEntitlement();

  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.failure.kind).toBe("no-config");
  expect(mockPurchases.configure).not.toHaveBeenCalled();
  expect(mockPurchases.getCustomerInfo).not.toHaveBeenCalled();
});

test("getEntitlement reports pro ownership and product id from active entitlement", async () => {
  mockPurchases.getCustomerInfo.mockResolvedValueOnce(proInfo);
  let billing = createRevenueCatBilling();

  let result = await billing.getEntitlement();

  expect(mockPurchases.configure).toHaveBeenCalledWith({ apiKey: "test-ios-key" });
  if (!result.ok) throw new Error("expected ok");
  expect(result.value.isPro).toBe(true);
  expect(result.value.productId).toBe("lifetime");
});

test("getEntitlement reports not-pro when the entitlement is inactive", async () => {
  mockPurchases.getCustomerInfo.mockResolvedValueOnce(customerInfo());
  let billing = createRevenueCatBilling();

  let result = await billing.getEntitlement();

  if (!result.ok) throw new Error("expected ok");
  expect(result.value.isPro).toBe(false);
  expect(result.value.productId).toBeNull();
});

test("getEntitlement maps network errors to a network failure", async () => {
  mockPurchases.getCustomerInfo.mockRejectedValueOnce(new Error("network request failed"));
  let billing = createRevenueCatBilling();

  let result = await billing.getEntitlement();

  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.failure.kind).toBe("network");
});

test("getEntitlement maps unrecognized errors to an unknown failure", async () => {
  mockPurchases.getCustomerInfo.mockRejectedValueOnce(new Error("kaboom"));
  let billing = createRevenueCatBilling();

  let result = await billing.getEntitlement();

  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.failure.kind).toBe("unknown");
});

test("getOffer returns a price label from the current offering", async () => {
  mockPurchases.getOfferings.mockResolvedValueOnce({
    current: { availablePackages: [{ product: { priceString: "$9.99", identifier: "lifetime" } }] },
    all: {},
  });
  let billing = createRevenueCatBilling();

  let result = await billing.getOffer();

  if (!result.ok) throw new Error("expected ok");
  expect(result.value.priceLabel).toBe("$9.99");
});

test("getOffer returns no-offer when there is no current offering", async () => {
  mockPurchases.getOfferings.mockResolvedValueOnce({ current: null, all: {} });
  let billing = createRevenueCatBilling();

  let result = await billing.getOffer();

  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.failure.kind).toBe("no-offer");
});

test("purchase returns no-offer when no offer has been resolved", async () => {
  let billing = createRevenueCatBilling();

  let result = await billing.purchase();

  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.failure.kind).toBe("no-offer");
  expect(mockPurchases.purchasePackage).not.toHaveBeenCalled();
});

test("purchase buys the resolved offer and returns the new entitlement", async () => {
  let pkg = { product: { priceString: "$9.99", identifier: "lifetime" } };
  mockPurchases.getOfferings.mockResolvedValueOnce({
    current: { availablePackages: [pkg] },
    all: {},
  });
  mockPurchases.purchasePackage.mockResolvedValueOnce({ customerInfo: proInfo });
  let billing = createRevenueCatBilling();

  await billing.getOffer();
  let result = await billing.purchase();

  expect(mockPurchases.purchasePackage).toHaveBeenCalledWith(pkg);
  if (!result.ok) throw new Error("expected ok");
  expect(result.value.isPro).toBe(true);
});

test("purchase maps a user cancellation to a cancelled failure", async () => {
  mockPurchases.getOfferings.mockResolvedValueOnce({
    current: { availablePackages: [{ product: { priceString: "$9.99", identifier: "lifetime" } }] },
    all: {},
  });
  mockPurchases.purchasePackage.mockRejectedValueOnce({ userCancelled: true });
  let billing = createRevenueCatBilling();

  await billing.getOffer();
  let result = await billing.purchase();

  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.failure.kind).toBe("cancelled");
});

test("restore reports ownership found on the account", async () => {
  mockPurchases.restorePurchases.mockResolvedValueOnce(proInfo);
  let billing = createRevenueCatBilling();

  let result = await billing.restore();

  if (!result.ok) throw new Error("expected ok");
  expect(result.value.isPro).toBe(true);
});

test("restore succeeds with not-pro when nothing is found", async () => {
  mockPurchases.restorePurchases.mockResolvedValueOnce(customerInfo());
  let billing = createRevenueCatBilling();

  let result = await billing.restore();

  if (!result.ok) throw new Error("expected ok");
  expect(result.value.isPro).toBe(false);
});

test("getEntitlement maps a configure failure to a billing failure instead of throwing", async () => {
  mockPurchases.configure.mockImplementationOnce(() => {
    throw new Error("native module unavailable");
  });
  let billing = createRevenueCatBilling();

  let result = await billing.getEntitlement();

  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.failure.kind).toBe("unknown");
  expect(mockPurchases.getCustomerInfo).not.toHaveBeenCalled();
});

test("subscribe returns a no-op unsubscribe when configure throws", () => {
  mockPurchases.configure.mockImplementationOnce(() => {
    throw new Error("native module unavailable");
  });
  let billing = createRevenueCatBilling();

  let unsubscribe = billing.subscribe(() => {});

  expect(mockPurchases.addCustomerInfoUpdateListener).not.toHaveBeenCalled();
  expect(() => unsubscribe()).not.toThrow();
});

test("subscribe maps vendor updates to entitlements and unsubscribes cleanly", () => {
  let billing = createRevenueCatBilling();
  let seen: boolean[] = [];

  let unsubscribe = billing.subscribe((entitlement) => seen.push(entitlement.isPro));

  let listener = mockPurchases.addCustomerInfoUpdateListener.mock.calls[0][0];
  listener(proInfo);
  unsubscribe();

  expect(seen).toEqual([true]);
  expect(mockPurchases.removeCustomerInfoUpdateListener).toHaveBeenCalledWith(listener);
});
