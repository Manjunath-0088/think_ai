import { Component, type PropsWithChildren } from "react";
import { Text, View } from "react-native";
import { AppButton } from "@/components/common/AppButton";
import { ThemeContext } from "@/theme/ThemeProvider";
import { createLmsStyles } from "./ui";
export class LmsErrorBoundary extends Component<
  PropsWithChildren,
  { failed: boolean }
> {
  static override contextType = ThemeContext;
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    const theme = this.context as React.ContextType<typeof ThemeContext>;
    const styles = createLmsStyles(theme.palette);
    return this.state.failed ? (
      <View
        style={[
          styles.screen,
          { padding: 24, justifyContent: "center", gap: 16 },
        ]}
      >
        <Text style={styles.heading}>This screen could not open</Text>
        <Text style={styles.muted}>
          Your saved drafts remain on this device.
        </Text>
        <AppButton
          title="Try again"
          onPress={() => this.setState({ failed: false })}
        />
      </View>
    ) : (
      this.props.children
    );
  }
}
