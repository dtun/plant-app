/**
 * Manual mock for react-native-purchases (native module, unavailable in Jest).
 * Auto-applied for any test that imports the package.
 */

let emptyCustomerInfo = {
  entitlements: { active: {}, all: {} },
};

let Purchases = {
  configure: jest.fn(),
  setLogLevel: jest.fn(),
  getCustomerInfo: jest.fn(async () => emptyCustomerInfo),
  getOfferings: jest.fn(async () => ({ current: null, all: {} })),
  purchasePackage: jest.fn(async () => ({ customerInfo: emptyCustomerInfo })),
  restorePurchases: jest.fn(async () => emptyCustomerInfo),
  addCustomerInfoUpdateListener: jest.fn(),
  removeCustomerInfoUpdateListener: jest.fn(),
};

export default Purchases;
