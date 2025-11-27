import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as IAP from "react-native-iap";
import { z } from "zod";

// Schema for validating product ID
const productIdSchema = z.string().min(1);

// Product IDs from App Store Connect / Google Play Console
const PRODUCT_IDS = {
  premium: productIdSchema.parse(
    Platform.select({
      ios: "com.paperstreetapp.keeptend.premium",
      android: "com.paperstreetapp.keeptend.premium",
    })
  ),
};

export class InAppPurchaseService {
  private connected = false;

  /**
   * Initialize IAP connection
   * Call this when app starts
   */
  async initialize() {
    try {
      await IAP.initConnection();
      this.connected = true;
      console.log("IAP connection initialized");

      // Listen for purchases (handles interrupted purchases)
      IAP.purchaseUpdatedListener((purchase) => {
        this.handlePurchaseUpdate(purchase);
      });

      // Listen for errors
      IAP.purchaseErrorListener((error) => {
        console.error("IAP Error:", error);
      });
    } catch (error) {
      console.error("Failed to initialize IAP:", error);
    }
  }

  /**
   * Get available products from store
   */
  async getProducts() {
    try {
      const products = await IAP.fetchProducts({
        skus: [PRODUCT_IDS.premium],
      });
      return products;
    } catch (error) {
      console.error("Failed to get products:", error);
      return [];
    }
  }

  /**
   * Purchase premium
   */
  async purchasePremium() {
    try {
      if (!this.connected) {
        throw new Error("IAP not connected. Call initialize() first.");
      }

      // Schema for request props validation
      const requestPropsSchema = z.object({
        ios: z.object({ sku: z.string() }).optional(),
        android: z.object({ skus: z.array(z.string()) }).optional(),
      });

      // Build platform-specific request
      const requestProps = requestPropsSchema.parse(
        Platform.select({
          ios: { ios: { sku: PRODUCT_IDS.premium } },
          android: { android: { skus: [PRODUCT_IDS.premium] } },
        })
      );

      // Request purchase from Apple/Google
      const purchase = await IAP.requestPurchase({
        request: requestProps,
        type: "in-app",
      });

      return purchase;
    } catch (error) {
      console.error("Purchase failed:", error);
      throw error;
    }
  }

  /**
   * Handle purchase update (called automatically)
   */
  private async handlePurchaseUpdate(purchase: IAP.Purchase): Promise<boolean> {
    try {
      const receipt = purchase.purchaseToken;

      if (receipt) {
        // Validate with your backend
        const isValid = await this.validateReceipt(receipt);

        if (isValid) {
          // Save premium status locally
          await AsyncStorage.setItem("isPremium", "true");
          await AsyncStorage.setItem("premiumReceipt", receipt);

          // Acknowledge purchase (required by Apple/Google)
          if (Platform.OS === "ios") {
            await IAP.finishTransaction({ purchase, isConsumable: false });
          } else {
            await IAP.acknowledgePurchaseAndroid(purchase.purchaseToken || "");
          }

          console.log("Premium unlocked!");
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Failed to handle purchase:", error);
      return false;
    }
  }

  /**
   * Validate receipt with your backend
   */
  private async validateReceipt(receipt: string): Promise<boolean> {
    try {
      const deviceId = await import("./device-id").then((m) => m.getDeviceId());

      const response = await fetch(
        "https://www.keeptend.com/api/premium/validate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Device-ID": deviceId,
          },
          body: JSON.stringify({
            receipt,
            platform: Platform.OS,
          }),
        }
      );

      const data = await response.json();
      return data.valid;
    } catch (error) {
      console.error("Receipt validation failed:", error);
      return false;
    }
  }

  /**
   * Restore previous purchases
   */
  async restorePurchases(): Promise<boolean> {
    try {
      const purchases = await IAP.getAvailablePurchases();

      // Find premium purchase
      const premiumPurchase = purchases.find(
        (p) => p.productId === PRODUCT_IDS.premium
      );

      if (premiumPurchase) {
        // Validate and restore
        const success = await this.handlePurchaseUpdate(premiumPurchase);
        return success;
      }

      return false;
    } catch (error) {
      console.error("Restore failed:", error);
      return false;
    }
  }

  /**
   * Check if user has premium
   */
  async hasPremium(): Promise<boolean> {
    const isPremium = await AsyncStorage.getItem("isPremium");
    return isPremium === "true";
  }

  /**
   * Cleanup
   */
  async disconnect() {
    try {
      await IAP.endConnection();
      this.connected = false;
    } catch (error) {
      console.error("Failed to disconnect IAP:", error);
    }
  }
}

// Export singleton instance
export const iapService = new InAppPurchaseService();
