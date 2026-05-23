/**
 * StorageErrorBoundary
 *
 * Catches failures from createAdapter() / LiveStoreProvider init.
 * For a local-first app, storage init is the single most dangerous
 * failure point — if it throws, nothing else can render.
 *
 * Renders a user-facing recovery screen instead of a blank crash.
 */

import { Component, type ReactNode } from "react";
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class StorageErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // In production you'd forward this to a crash reporter (Sentry, etc.)
    console.error("[StorageErrorBoundary] Storage init failed:", error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.emoji}>🌱</Text>
            <Text style={styles.title}>Couldn't open your garden</Text>
            <Text style={styles.message}>
              KeepTend ran into a problem loading your plant data. This is usually temporary.
            </Text>
            <Text style={styles.detail}>{this.state.error.message}</Text>
            <TouchableOpacity
              style={styles.button}
              onPress={this.handleRetry}
              accessibilityRole="button"
              accessibilityLabel="Retry loading storage"
              accessibilityHint="Attempts to re-initialise local storage and reload the app"
            >
              <Text style={styles.buttonLabel}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAF8",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    paddingHorizontal: 32,
    alignItems: "center",
    gap: 12,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1C1C1E",
    textAlign: "center",
  },
  message: {
    fontSize: 15,
    color: "#6C6C70",
    textAlign: "center",
    lineHeight: 22,
  },
  detail: {
    fontSize: 12,
    color: "#AEAEB2",
    textAlign: "center",
    fontFamily: "monospace",
    marginTop: 4,
  },
  button: {
    marginTop: 16,
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  buttonLabel: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
  },
});
