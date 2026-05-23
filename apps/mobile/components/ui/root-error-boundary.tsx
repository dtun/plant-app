/**
 * RootErrorBoundary
 *
 * Last-resort catch-all for any unhandled render-phase throw in the app.
 * Sits at the outermost layer of the tree in app/_layout.tsx.
 *
 * Prefer more specific boundaries (e.g. StorageErrorBoundary) for known
 * failure points. This exists so the user always sees *something* instead
 * of a blank screen.
 */

import { Component, type ReactNode } from "react";
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class RootErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("[RootErrorBoundary] Unhandled render error:", error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.emoji}>⚠️</Text>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>
              KeepTend hit an unexpected error. Your plant data is safe — please try restarting the
              app.
            </Text>
            <TouchableOpacity
              style={styles.button}
              onPress={this.handleRetry}
              accessibilityRole="button"
              accessibilityLabel="Dismiss error and retry"
            >
              <Text style={styles.buttonLabel}>Retry</Text>
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
