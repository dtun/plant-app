import { Alert } from "react-native";
import { iapService } from "./iap";

interface PaywallOptions {
  remaining: number;
  resetDate?: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

/**
 * Show native paywall alert when user hits rate limit
 */
export async function showPaywall(options: PaywallOptions): Promise<void> {
  const { remaining, resetDate, onSuccess, onCancel } = options;

  // Get actual price from App Store
  let price = "$4.99";
  try {
    const products = await iapService.getProducts();
    if (products && products.length > 0 && products[0]?.displayPrice) {
      price = products[0].displayPrice;
    }
  } catch (error) {
    console.error("Failed to load price:", error);
  }

  // Format reset date
  const resetText = resetDate
    ? `\n\nYour free tier resets on ${new Date(resetDate).toLocaleDateString()}`
    : "";

  Alert.alert(
    "🌱 Free Limit Reached",
    `You've used all ${
      remaining === 0 ? 10 : remaining
    } of your free requests this month.${resetText}\n\n✓ Unlimited AI analysis\n✓ Unlimited name generation\n✓ Priority support\n✓ Future premium features`,
    [
      {
        text: "Maybe Later",
        style: "cancel",
        onPress: onCancel,
      },
      {
        text: "Restore Purchases",
        onPress: () => handleRestore(onSuccess, onCancel),
      },
      {
        text: `Upgrade (${price})`,
        style: "default",
        onPress: () => handlePurchase(onSuccess, onCancel),
      },
    ],
    { cancelable: true, onDismiss: onCancel }
  );
}

/**
 * Handle purchase flow
 */
async function handlePurchase(
  onSuccess: () => void,
  onCancel?: () => void
): Promise<void> {
  try {
    await iapService.purchasePremium();

    // Purchase initiated - Apple will handle payment
    // Success will be handled by purchase listener
    Alert.alert(
      "✅ Premium Unlocked!",
      "You now have unlimited AI requests. Thank you for your support!",
      [
        {
          text: "OK",
          onPress: onSuccess,
        },
      ]
    );
  } catch (error) {
    const typedError = error as { code?: string; message?: string };

    // User cancelled - don't show error
    if (typedError.code === "E_USER_CANCELLED") {
      onCancel?.();
      return;
    }

    // Show error for other failures
    Alert.alert(
      "Purchase Failed",
      typedError.message || "Something went wrong. Please try again.",
      [
        {
          text: "OK",
          onPress: onCancel,
        },
      ]
    );
  }
}

/**
 * Handle restore purchases
 */
async function handleRestore(
  onSuccess: () => void,
  onCancel?: () => void
): Promise<void> {
  try {
    const restored = await iapService.restorePurchases();

    if (restored) {
      Alert.alert(
        "✅ Restored!",
        "Your premium subscription has been restored.",
        [
          {
            text: "OK",
            onPress: onSuccess,
          },
        ]
      );
    } else {
      Alert.alert(
        "No Purchases Found",
        "We couldn't find any previous purchases to restore.",
        [
          {
            text: "OK",
            onPress: onCancel,
          },
        ]
      );
    }
  } catch {
    Alert.alert("Restore Failed", "Please try again later.", [
      {
        text: "OK",
        onPress: onCancel,
      },
    ]);
  }
}

/**
 * Check if user has premium (helper function)
 */
export async function checkPremium(): Promise<boolean> {
  return iapService.hasPremium();
}
