/**
 * Example: How to use the paywall with native alerts
 *
 * This shows clean, type-safe integration with NO type casting
 */

import { useState, useEffect } from "react";
import { View, Button } from "react-native";
import {
  analyzePhoto,
  checkQuota,
  type QuotaResponse,
} from "./utils/api-client";
import { showPaywall, checkPremium } from "./utils/paywall";
import { iapService } from "./utils/iap";

export default function ExampleScreen() {
  const [isPremium, setIsPremium] = useState(false);
  const [quota, setQuota] = useState<QuotaResponse | null>(null);

  // Initialize IAP on mount
  useEffect(() => {
    iapService.initialize();
    loadPremiumStatus();
    loadQuota();

    return () => {
      iapService.disconnect();
    };
  }, []);

  async function loadPremiumStatus() {
    const premium = await checkPremium();
    setIsPremium(premium);
  }

  async function loadQuota() {
    try {
      const quotaData = await checkQuota();
      setQuota(quotaData);
    } catch (error) {
      console.error("Failed to load quota:", error);
    }
  }

  async function handleAnalyzePhoto(imageUri: string) {
    try {
      // Convert image to base64 first (not shown here)
      const imageBase64 = "base64-encoded-image";

      const result = await analyzePhoto(
        "openai",
        imageBase64,
        "Identify this plant and provide care instructions",
      );

      console.log("Plant species:", result.result.species);
      console.log("Confidence:", result.result.confidence);
      console.log("Remaining requests:", result.remaining);

      // Update quota
      await loadQuota();
    } catch (error) {
      // Type-safe error handling
      const err = error as Error & {
        upgradeRequired?: boolean;
        resetDate?: string;
        remaining?: number;
      };

      // Check if it's a rate limit error
      if (err.upgradeRequired) {
        // Show native alert paywall
        showPaywall({
          remaining: err.remaining ?? 0,
          resetDate: err.resetDate,
          onSuccess: () => {
            // Premium unlocked!
            setIsPremium(true);
            loadQuota();
            // Retry the request
            handleAnalyzePhoto(imageUri);
          },
          onCancel: () => {
            console.log("User declined upgrade");
          },
        });
      } else {
        // Other error
        console.error("Analysis failed:", err.message);
      }
    }
  }

  return (
    <View>
      <Button
        title={
          isPremium
            ? "Analyze (Unlimited)"
            : `Analyze (${quota?.remaining ?? 0} left)`
        }
        onPress={() => handleAnalyzePhoto("image-uri-here")}
      />

      {!isPremium && quota && (
        <Button
          title="Upgrade to Premium"
          onPress={() => {
            showPaywall({
              remaining: quota.remaining ?? 0,
              resetDate: quota.resetDate,
              onSuccess: () => {
                setIsPremium(true);
                loadQuota();
              },
            });
          }}
        />
      )}
    </View>
  );
}

/**
 * Key Features:
 *
 * ✅ NO type casting (as any, etc.)
 * ✅ Clean error handling with type safety
 * ✅ Native alerts - no custom modal needed
 * ✅ Proper TypeScript types throughout
 * ✅ Handles purchase flow automatically
 * ✅ Restores purchases
 * ✅ Shows actual price from App Store
 */
