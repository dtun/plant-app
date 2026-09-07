import Purchases, { PURCHASES_ERROR_CODE } from "react-native-purchases";

import { createRevenueCatEntitlements } from "./revenuecat-entitlements";

let mockPurchases = Purchases as unknown as {
  configure: jest.Mock;
  getAppUserID: jest.Mock;
  getCustomerInfo: jest.Mock;
  getOfferings: jest.Mock;
  purchasePackage: jest.Mock;
  restorePurchases: jest.Mock;
  addCustomerInfoUpdateListener: jest.Mock;
  removeCustomerInfoUpdateListener: jest.Mock;
};

interface ActiveEntitlement {
  productIdentifier: string;
  expirationDateMillis?: number | null;
  willRenew?: boolean;
}

function customerInfo(
  active: Record<string, ActiveEntitlement> = {},
  managementURL: string | null = null
) {
  return { entitlements: { active, all: {} }, managementURL };
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

test("getEntitlement reports expiry, renewal, and management URL for a subscription", async () => {
  mockPurchases.getCustomerInfo.mockResolvedValueOnce(
    customerInfo(
      {
        pro: {
          productIdentifier: "pro_monthly",
          expirationDateMillis: 1767225600000,
          willRenew: true,
        },
      },
      "https://apps.apple.com/account/subscriptions"
    )
  );
  let entitlements = createRevenueCatEntitlements();

  let result = await entitlements.getEntitlement();

  if (!result.ok) throw new Error("expected ok");
  expect(result.value.isPro).toBe(true);
  expect(result.value.expiresAt).toBe(1767225600000);
  expect(result.value.willRenew).toBe(true);
  expect(result.value.managementUrl).toBe("https://apps.apple.com/account/subscriptions");
});

test("getEntitlement reports a lifetime unlock with no expiry and no renewal", async () => {
  mockPurchases.getCustomerInfo.mockResolvedValueOnce(
    customerInfo({
      pro: { productIdentifier: "lifetime", expirationDateMillis: null, willRenew: false },
    })
  );
  let entitlements = createRevenueCatEntitlements();

  let result = await entitlements.getEntitlement();

  if (!result.ok) throw new Error("expected ok");
  expect(result.value.isPro).toBe(true);
  expect(result.value.expiresAt).toBeNull();
  expect(result.value.willRenew).toBe(false);
});

test("getEntitlement reports not-pro when the entitlement is inactive", async () => {
  mockPurchases.getCustomerInfo.mockResolvedValueOnce(customerInfo());
  let entitlements = createRevenueCatEntitlements();

  let result = await entitlements.getEntitlement();

  if (!result.ok) throw new Error("expected ok");
  expect(result.value.isPro).toBe(false);
  expect(result.value.productId).toBeNull();
  expect(result.value.expiresAt).toBeNull();
  expect(result.value.willRenew).toBe(false);
  expect(result.value.managementUrl).toBeNull();
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

test("getEntitlement maps STORE_PROBLEM_ERROR to a store-error failure", async () => {
  mockPurchases.getCustomerInfo.mockRejectedValueOnce(
    sdkError(PURCHASES_ERROR_CODE.STORE_PROBLEM_ERROR, "Es gab ein Problem mit dem App Store")
  );
  let entitlements = createRevenueCatEntitlements();

  let result = await entitlements.getEntitlement();

  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.failure.kind).toBe("store-error");
});

test("purchase maps PURCHASE_NOT_ALLOWED_ERROR to a not-allowed failure", async () => {
  mockPurchases.getOfferings.mockResolvedValueOnce({
    current: { availablePackages: [{ product: { priceString: "$9.99", identifier: "lifetime" } }] },
    all: {},
  });
  mockPurchases.purchasePackage.mockRejectedValueOnce(
    sdkError(PURCHASES_ERROR_CODE.PURCHASE_NOT_ALLOWED_ERROR, "Achats désactivés sur cet appareil")
  );
  let entitlements = createRevenueCatEntitlements();

  let result = await entitlements.purchase({
    priceLabel: "$9.99",
    productId: "lifetime",
    term: "monthly",
  });

  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.failure.kind).toBe("not-allowed");
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

test("getOffer exposes the product id the offer is backed by", async () => {
  mockPurchases.getOfferings.mockResolvedValueOnce({
    current: {
      availablePackages: [{ product: { priceString: "$4.99", identifier: "pro_monthly" } }],
    },
    all: {},
  });
  let entitlements = createRevenueCatEntitlements();

  let result = await entitlements.getOffer();

  if (!result.ok) throw new Error("expected ok");
  expect(result.value.productId).toBe("pro_monthly");
});

test("purchase buys the given offer without getOffer having run first", async () => {
  let pkg = { product: { priceString: "$4.99", identifier: "pro_monthly" } };
  mockPurchases.getOfferings.mockResolvedValueOnce({
    current: { availablePackages: [pkg] },
    all: {},
  });
  mockPurchases.purchasePackage.mockResolvedValueOnce({ customerInfo: proInfo });
  let entitlements = createRevenueCatEntitlements();

  let result = await entitlements.purchase({
    priceLabel: "$4.99",
    productId: "pro_monthly",
    term: "monthly",
  });

  expect(mockPurchases.purchasePackage).toHaveBeenCalledWith(pkg);
  if (!result.ok) throw new Error("expected ok");
  expect(result.value.isPro).toBe(true);
});

test("purchase picks the package matching the offer when several are on sale", async () => {
  let monthly = { product: { priceString: "$4.99", identifier: "pro_monthly" } };
  let annual = { product: { priceString: "$39.99", identifier: "pro_annual" } };
  mockPurchases.getOfferings.mockResolvedValueOnce({
    current: { availablePackages: [monthly, annual] },
    all: {},
  });
  mockPurchases.purchasePackage.mockResolvedValueOnce({ customerInfo: proInfo });
  let entitlements = createRevenueCatEntitlements();

  await entitlements.purchase({ priceLabel: "$39.99", productId: "pro_annual", term: "monthly" });

  expect(mockPurchases.purchasePackage).toHaveBeenCalledWith(annual);
});

test("purchase returns no-offer when the offer is no longer on sale", async () => {
  mockPurchases.getOfferings.mockResolvedValueOnce({
    current: {
      availablePackages: [{ product: { priceString: "$4.99", identifier: "pro_monthly" } }],
    },
    all: {},
  });
  let entitlements = createRevenueCatEntitlements();

  let result = await entitlements.purchase({
    priceLabel: "$9.99",
    productId: "retired_sku",
    term: "monthly",
  });

  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.failure.kind).toBe("no-offer");
  expect(mockPurchases.purchasePackage).not.toHaveBeenCalled();
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

  let result = await entitlements.purchase({
    priceLabel: "$9.99",
    productId: "lifetime",
    term: "monthly",
  });

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

  let result = await entitlements.purchase({
    priceLabel: "$9.99",
    productId: "lifetime",
    term: "monthly",
  });

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

test("getAppUserId returns the vendor's anonymous app user id", async () => {
  mockPurchases.getAppUserID.mockResolvedValueOnce("$RCAnonymousID:2f8c1a9e");
  let entitlements = createRevenueCatEntitlements();

  let id = await entitlements.getAppUserId();

  expect(id).toBe("$RCAnonymousID:2f8c1a9e");
});

test("getAppUserId returns null when no API key is set", async () => {
  delete process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
  delete process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;
  let entitlements = createRevenueCatEntitlements();

  let id = await entitlements.getAppUserId();

  expect(id).toBeNull();
  expect(mockPurchases.getAppUserID).not.toHaveBeenCalled();
});

test("getAppUserId returns null instead of throwing when the SDK fails", async () => {
  mockPurchases.getAppUserID.mockRejectedValueOnce(new Error("native module unavailable"));
  let entitlements = createRevenueCatEntitlements();

  let id = await entitlements.getAppUserId();

  expect(id).toBeNull();
});

test.each([
  ["WEEKLY", "weekly"],
  ["MONTHLY", "monthly"],
  ["TWO_MONTH", "two-month"],
  ["THREE_MONTH", "three-month"],
  ["SIX_MONTH", "six-month"],
  ["ANNUAL", "annual"],
  ["LIFETIME", "lifetime"],
  ["UNKNOWN", null],
  ["CUSTOM", null],
])("getOffer reports the renewal term for a %s package as %s", async (packageType, term) => {
  mockPurchases.getOfferings.mockResolvedValueOnce({
    current: {
      availablePackages: [{ packageType, product: { priceString: "$4.99", identifier: "pro" } }],
    },
    all: {},
  });
  let entitlements = createRevenueCatEntitlements();

  let result = await entitlements.getOffer();

  if (!result.ok) throw new Error("expected ok");
  expect(result.value.term).toBe(term);
});
