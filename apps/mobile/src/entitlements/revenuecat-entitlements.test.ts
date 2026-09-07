import Purchases, { PURCHASES_ERROR_CODE } from "react-native-purchases";

import { createRevenueCatEntitlements } from "./revenuecat-entitlements";

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
  let entitlements = createRevenueCatEntitlements();

  let result = await entitlements.getEntitlement();

  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.failure.kind).toBe("no-config");
  expect(mockPurchases.configure).not.toHaveBeenCalled();
  expect(mockPurchases.getCustomerInfo).not.toHaveBeenCalled();
});

test("getEntitlement reports pro ownership and product id from active entitlement", async () => {
  mockPurchases.getCustomerInfo.mockResolvedValueOnce(proInfo);
  let entitlements = createRevenueCatEntitlements();

  let result = await entitlements.getEntitlement();

  expect(mockPurchases.configure).toHaveBeenCalledWith({ apiKey: "test-ios-key" });
  if (!result.ok) throw new Error("expected ok");
  expect(result.value.isPro).toBe(true);
  expect(result.value.productId).toBe("lifetime");
});

test("getEntitlement reports not-pro when the entitlement is inactive", async () => {
  mockPurchases.getCustomerInfo.mockResolvedValueOnce(customerInfo());
  let entitlements = createRevenueCatEntitlements();

  let result = await entitlements.getEntitlement();

  if (!result.ok) throw new Error("expected ok");
  expect(result.value.isPro).toBe(false);
  expect(result.value.productId).toBeNull();
});

function sdkError(code: PURCHASES_ERROR_CODE, message: string) {
  return { code, message, userCancelled: code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR };
}

test.each([
  ["NETWORK_ERROR", PURCHASES_ERROR_CODE.NETWORK_ERROR],
  ["OFFLINE_CONNECTION_ERROR", PURCHASES_ERROR_CODE.OFFLINE_CONNECTION_ERROR],
])("getEntitlement maps %s to a network failure regardless of message text", async (_, code) => {
  mockPurchases.getCustomerInfo.mockRejectedValueOnce(sdkError(code, "Sin conexión a internet"));
  let entitlements = createRevenueCatEntitlements();

  let result = await entitlements.getEntitlement();

  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.failure.kind).toBe("network");
});

test("getEntitlement does not classify by message text alone", async () => {
  mockPurchases.getCustomerInfo.mockRejectedValueOnce(new Error("network request failed"));
  let entitlements = createRevenueCatEntitlements();

  let result = await entitlements.getEntitlement();

  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.failure.kind).toBe("unknown");
});

test("getEntitlement maps an unhandled SDK error code to an unknown failure", async () => {
  mockPurchases.getCustomerInfo.mockRejectedValueOnce(
    sdkError(PURCHASES_ERROR_CODE.INVALID_CREDENTIALS_ERROR, "Network-ish wording, wrong code")
  );
  let entitlements = createRevenueCatEntitlements();

  let result = await entitlements.getEntitlement();

  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.failure.kind).toBe("unknown");
});

test("getEntitlement maps unrecognized errors to an unknown failure", async () => {
  mockPurchases.getCustomerInfo.mockRejectedValueOnce(new Error("kaboom"));
  let entitlements = createRevenueCatEntitlements();

  let result = await entitlements.getEntitlement();

  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.failure.kind).toBe("unknown");
});

test("getOffer returns a price label from the current offering", async () => {
  mockPurchases.getOfferings.mockResolvedValueOnce({
    current: { availablePackages: [{ product: { priceString: "$9.99", identifier: "lifetime" } }] },
    all: {},
  });
  let entitlements = createRevenueCatEntitlements();

  let result = await entitlements.getOffer();

  if (!result.ok) throw new Error("expected ok");
  expect(result.value.priceLabel).toBe("$9.99");
});

test("getOffer returns no-offer when there is no current offering", async () => {
  mockPurchases.getOfferings.mockResolvedValueOnce({ current: null, all: {} });
  let entitlements = createRevenueCatEntitlements();

  let result = await entitlements.getOffer();

  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.failure.kind).toBe("no-offer");
});

test("purchase returns no-offer when no offer has been resolved", async () => {
  let entitlements = createRevenueCatEntitlements();

  let result = await entitlements.purchase();

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
  let entitlements = createRevenueCatEntitlements();

  await entitlements.getOffer();
  let result = await entitlements.purchase();

  expect(mockPurchases.purchasePackage).toHaveBeenCalledWith(pkg);
  if (!result.ok) throw new Error("expected ok");
  expect(result.value.isPro).toBe(true);
});

test("purchase maps the PURCHASE_CANCELLED_ERROR code to a cancelled failure", async () => {
  mockPurchases.getOfferings.mockResolvedValueOnce({
    current: { availablePackages: [{ product: { priceString: "$9.99", identifier: "lifetime" } }] },
    all: {},
  });
  mockPurchases.purchasePackage.mockRejectedValueOnce({
    code: PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR,
    message: "Compra cancelada",
    userCancelled: null,
  });
  let entitlements = createRevenueCatEntitlements();

  await entitlements.getOffer();
  let result = await entitlements.purchase();

  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.failure.kind).toBe("cancelled");
});

test("purchase still honours the legacy userCancelled flag when no code is present", async () => {
  mockPurchases.getOfferings.mockResolvedValueOnce({
    current: { availablePackages: [{ product: { priceString: "$9.99", identifier: "lifetime" } }] },
    all: {},
  });
  mockPurchases.purchasePackage.mockRejectedValueOnce({ userCancelled: true });
  let entitlements = createRevenueCatEntitlements();

  await entitlements.getOffer();
  let result = await entitlements.purchase();

  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.failure.kind).toBe("cancelled");
});

test("restore reports ownership found on the account", async () => {
  mockPurchases.restorePurchases.mockResolvedValueOnce(proInfo);
  let entitlements = createRevenueCatEntitlements();

  let result = await entitlements.restore();

  if (!result.ok) throw new Error("expected ok");
  expect(result.value.isPro).toBe(true);
});

test("restore succeeds with not-pro when nothing is found", async () => {
  mockPurchases.restorePurchases.mockResolvedValueOnce(customerInfo());
  let entitlements = createRevenueCatEntitlements();

  let result = await entitlements.restore();

  if (!result.ok) throw new Error("expected ok");
  expect(result.value.isPro).toBe(false);
});

test("getEntitlement maps a configure failure to an entitlement failure instead of throwing", async () => {
  mockPurchases.configure.mockImplementationOnce(() => {
    throw new Error("native module unavailable");
  });
  let entitlements = createRevenueCatEntitlements();

  let result = await entitlements.getEntitlement();

  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.failure.kind).toBe("unknown");
  expect(mockPurchases.getCustomerInfo).not.toHaveBeenCalled();
});

test("subscribe returns a no-op unsubscribe when configure throws", () => {
  mockPurchases.configure.mockImplementationOnce(() => {
    throw new Error("native module unavailable");
  });
  let entitlements = createRevenueCatEntitlements();

  let unsubscribe = entitlements.subscribe(() => {});

  expect(mockPurchases.addCustomerInfoUpdateListener).not.toHaveBeenCalled();
  expect(() => unsubscribe()).not.toThrow();
});

test("subscribe maps vendor updates to entitlements and unsubscribes cleanly", () => {
  let entitlements = createRevenueCatEntitlements();
  let seen: boolean[] = [];

  let unsubscribe = entitlements.subscribe((entitlement) => seen.push(entitlement.isPro));

  let listener = mockPurchases.addCustomerInfoUpdateListener.mock.calls[0][0];
  listener(proInfo);
  unsubscribe();

  expect(seen).toEqual([true]);
  expect(mockPurchases.removeCustomerInfoUpdateListener).toHaveBeenCalledWith(listener);
});
