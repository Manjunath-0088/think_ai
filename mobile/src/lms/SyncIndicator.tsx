import { Text } from "react-native";
import { useLms } from "./LmsProvider";
import { useLmsStyles } from "./ui";
export function LmsSyncIndicator() {
  const styles = useLmsStyles();
  const { ready, syncStatus } = useLms();
  return ready ? (
    <Text accessibilityLiveRegion="polite" style={styles.muted}>
      {syncStatus}
    </Text>
  ) : null;
}
