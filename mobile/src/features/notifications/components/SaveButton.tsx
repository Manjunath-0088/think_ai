import { ActivityIndicator, Button, View } from 'react-native';

export function SaveButton({ saving, onPress }: { saving: boolean; onPress: () => void }) {
  return (
    <View>
      {saving ? (
        <ActivityIndicator />
      ) : (
        <Button title="Save Preferences" onPress={onPress} accessibilityLabel="save-preferences" />
      )}
    </View>
  );
}
