import { EntitlementsProvider, useEntitlements } from "@/contexts/entitlements-context";
import {
  __setEntitlementsForTests,
  createFakeEntitlements,
  createRevenueCatEntitlements,
  type Entitlement,
  type EntitlementFailure,
  type Result,
} from "@/src/entitlements";
import { act, renderHook, waitFor } from "@testing-library/react-native";

let pro: Entitlement = {
  isPro: true,
  productId: "pro_monthly",
  expiresAt: 1767225600000,
  willRenew: true,
  managementUrl: "https://example.test/manage",
};

function wrapper({ children }: { children: React.ReactNode }) {
  return <EntitlementsProvider>{children}</EntitlementsProvider>;
}

function renderEntitlements() {
  return renderHook(() => useEntitlements(), { wrapper });
}

afterEach(() => {
  // The seam is module-global; put the default back so no test inherits a previous fake.
  __setEntitlementsForTests(createRevenueCatEntitlements());
});

test("reports the seam's entitlement once loaded", async () => {
  __setEntitlementsForTests(createFakeEntitlements({ entitlement: { ok: true, value: pro } }));

  let { result } = renderEntitlements();

  expect(result.current.status).toBe("loading");
  expect(result.current.entitlement).toBeNull();
  await waitFor(() => expect(result.current.status).toBe("ready"));
  expect(result.current.entitlement).toEqual(pro);
});

test("reports unavailable when the seam is unconfigured", async () => {
  __setEntitlementsForTests(
    createFakeEntitlements({ entitlement: { ok: false, failure: { kind: "no-config" } } })
  );

  let { result } = renderEntitlements();

  await waitFor(() => expect(result.current.status).toBe("unavailable"));
  expect(result.current.entitlement).toBeNull();
});

test("a change the vendor pushes updates the hook without a refresh", async () => {
  let fake = createFakeEntitlements();
  __setEntitlementsForTests(fake);
  let { result } = renderEntitlements();
  await waitFor(() => expect(result.current.status).toBe("ready"));
  expect(result.current.entitlement?.isPro).toBe(false);

  act(() => fake.emit(pro));

  expect(result.current.entitlement).toEqual(pro);
});

test("purchase forwards the seam's result and updates the entitlement on success", async () => {
  __setEntitlementsForTests(createFakeEntitlements());
  let { result } = renderEntitlements();
  await waitFor(() => expect(result.current.status).toBe("ready"));

  let purchase = await act(() =>
    result.current.purchase({ priceLabel: "$4.99", productId: "pro_monthly" })
  );

  if (!purchase.ok) throw new Error("expected ok");
  expect(purchase.value.isPro).toBe(true);
  expect(purchase.value.productId).toBe("pro_monthly");
  expect(result.current.entitlement).toEqual(purchase.value);
});

test("a failed purchase forwards the failure and leaves the entitlement alone", async () => {
  __setEntitlementsForTests(
    createFakeEntitlements({ purchase: { ok: false, failure: { kind: "cancelled" } } })
  );
  let { result } = renderEntitlements();
  await waitFor(() => expect(result.current.status).toBe("ready"));
  let before = result.current.entitlement;

  let purchase = await act(() =>
    result.current.purchase({ priceLabel: "$4.99", productId: "pro_monthly" })
  );

  expect(purchase).toEqual({ ok: false, failure: { kind: "cancelled" } });
  expect(result.current.entitlement).toBe(before);
});

test("restore forwards the seam's result and updates the entitlement on success", async () => {
  __setEntitlementsForTests(createFakeEntitlements({ restore: { ok: true, value: pro } }));
  let { result } = renderEntitlements();
  await waitFor(() => expect(result.current.status).toBe("ready"));
  expect(result.current.entitlement?.isPro).toBe(false);

  let restore = await act(() => result.current.restore());

  expect(restore).toEqual({ ok: true, value: pro });
  expect(result.current.entitlement).toEqual(pro);
});

test("refresh re-reads the seam and forwards its result", async () => {
  let fake = createFakeEntitlements();
  let current: Result<Entitlement, EntitlementFailure> = await fake.getEntitlement();
  __setEntitlementsForTests({ ...fake, getEntitlement: async () => current });
  let { result } = renderEntitlements();
  await waitFor(() => expect(result.current.status).toBe("ready"));
  expect(result.current.entitlement?.isPro).toBe(false);

  current = { ok: true, value: pro };
  let refresh = await act(() => result.current.refresh());

  expect(refresh).toEqual({ ok: true, value: pro });
  expect(result.current.entitlement).toEqual(pro);
});

test("unmounting the provider unsubscribes from vendor changes", async () => {
  let fake = createFakeEntitlements();
  let unsubscribed = false;
  __setEntitlementsForTests({
    ...fake,
    subscribe(onChange) {
      let off = fake.subscribe(onChange);
      return () => {
        unsubscribed = true;
        off();
      };
    },
  });
  let { result, unmount } = renderEntitlements();
  await waitFor(() => expect(result.current.status).toBe("ready"));

  unmount();

  expect(unsubscribed).toBe(true);
});
