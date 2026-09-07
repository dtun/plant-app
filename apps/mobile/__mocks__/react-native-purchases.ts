/**
 * Manual mock for react-native-purchases (native module, unavailable in Jest).
 * Auto-applied for any test that imports the package.
 */

// Re-exported from the SDK's pure-JS core so tests classify against the real codes.
export { PACKAGE_TYPE, PURCHASES_ERROR_CODE } from "@revenuecat/purchases-typescript-internal";

let emptyCustomerInfo = {
  entitlements: { active: {}, all: {} },
};

let Purchases = {
  configure: jest.fn(),
  getAppUserID: jest.fn(async () => "$RCAnonymousID:mock"),
  setLogLevel: jest.fn(),
  getCustomerInfo: jest.fn(async () => emptyCustomerInfo),
  getOfferings: jest.fn(async () => ({ current: null, all: {} })),
  purchasePackage: jest.fn(async () => ({ customerInfo: emptyCustomerInfo })),
  restorePurchases: jest.fn(async () => emptyCustomerInfo),
  addCustomerInfoUpdateListener: jest.fn(),
  removeCustomerInfoUpdateListener: jest.fn(),
};

export default Purchases;
