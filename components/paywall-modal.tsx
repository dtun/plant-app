import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  remaining?: number;
  resetDate?: string;
}

export default function PaywallModal({
  visible,
  onClose,
  onUpgrade,
  remaining = 0,
  resetDate,
}: PaywallModalProps) {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Free Limit Reached</Text>

          <Text style={styles.subtitle}>
            {`You've used all {remaining === 0 ? "10" : remaining} of your free AI requests this month.`}
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

          <Text style={styles.price}>$4.99 one-time payment</Text>

          <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade}>
            <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
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
  upgradeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
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
