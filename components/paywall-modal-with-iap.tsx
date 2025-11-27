import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { iapService } from "../utils/iap";

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void; // Called after successful purchase
  remaining?: number;
  resetDate?: string;
}

export default function PaywallModalWithIAP({
  visible,
  onClose,
  onSuccess,
  remaining = 0,
  resetDate,
}: PaywallModalProps) {
  const [loading, setLoading] = useState(false);
  const [price, setPrice] = useState("$4.99");

  useEffect(() => {
    if (visible) {
      // Get actual price from App Store
      loadPrice();
    }
  }, [visible]);

  const loadPrice = async () => {
    try {
      const products = await iapService.getProducts();
      if ((products?.length ?? 0) > 0) {
        const price = products?.find(
          (p) => p.displayName === "KeepTend Premium Lifetime"
        )?.price;
        if (!price) return;
        setPrice(price.toString()); // e.g., "$4.99" or "€4.99"
      }
    } catch (error) {
      console.error("Failed to load price:", error);
    }
  };

  const handlePurchase = async () => {
    setLoading(true);
    try {
      await iapService.purchasePremium();

      // Purchase initiated - Apple payment sheet will appear
      // When complete, iapService will validate and call onSuccess

      Alert.alert(
        "Success!",
        "Premium unlocked! Enjoy unlimited AI requests.",
        [
          {
            text: "OK",
            onPress: () => {
              onSuccess();
              onClose();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error("Purchase error:", error);

      // Handle user cancellation gracefully
      if (error.code === "E_USER_CANCELLED") {
        // User dismissed the payment sheet - no error needed
        return;
      }

      Alert.alert(
        "Purchase Failed",
        error.message || "Something went wrong. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      const restored = await iapService.restorePurchases();

      if (restored) {
        Alert.alert(
          "Restored!",
          "Your premium subscription has been restored.",
          [
            {
              text: "OK",
              onPress: () => {
                onSuccess();
                onClose();
              },
            },
          ]
        );
      } else {
        Alert.alert(
          "No Purchases Found",
          "We could not find any previous purchases to restore.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      Alert.alert("Restore Failed", "Please try again later.", [
        { text: "OK" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Free Limit Reached</Text>

          <Text style={styles.subtitle}>
            {`You've used all ${
              remaining === 0 ? "10" : remaining
            } of your free requests this month.`}
          </Text>

          {resetDate && (
            <Text style={styles.reset}>
              Free tier resets: {new Date(resetDate).toLocaleDateString()}
            </Text>
          )}

          <View style={styles.benefits}>
            <Text style={styles.benefitTitle}>Premium Benefits:</Text>
            <Text style={styles.benefit}>✓ Unlimited AI analysis</Text>
            <Text style={styles.benefit}>✓ Unlimited name generation</Text>
            <Text style={styles.benefit}>✓ Priority support</Text>
            <Text style={styles.benefit}>✓ Future premium features</Text>
          </View>

          <Text style={styles.price}>{price} one-time payment</Text>

          <TouchableOpacity
            style={[styles.upgradeButton, loading && styles.buttonDisabled]}
            onPress={handlePurchase}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestore}
            disabled={loading}
          >
            <Text style={styles.restoreButtonText}>Restore Purchases</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            disabled={loading}
          >
            <Text style={styles.closeButtonText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modal: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 12,
    textAlign: "center",
  },
  reset: {
    fontSize: 14,
    color: "#999",
    marginBottom: 20,
    textAlign: "center",
  },
  benefits: {
    marginBottom: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  benefit: {
    fontSize: 15,
    marginBottom: 8,
    color: "#333",
  },
  price: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
    color: "#4CAF50",
  },
  upgradeButton: {
    backgroundColor: "#4CAF50",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  upgradeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  restoreButton: {
    padding: 12,
    marginBottom: 8,
  },
  restoreButtonText: {
    color: "#4CAF50",
    fontSize: 15,
    textAlign: "center",
    fontWeight: "600",
  },
  closeButton: {
    padding: 12,
  },
  closeButtonText: {
    color: "#666",
    fontSize: 15,
    textAlign: "center",
  },
});
