import { useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';

type Props = {
  uri: string;
  accessibilityLabel?: string;
};

export function LazyThumbnail({ uri, accessibilityLabel }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const accessible = Boolean(accessibilityLabel);
  return (
    <View style={styles.wrap} testID="lazy-thumbnail">
      {!error && (
        <Image
          source={{ uri }}
          style={styles.img}
          resizeMode="cover"
          accessibilityLabel={accessibilityLabel}
          accessible={accessible}
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
        />
      )}
      {error && (
        <View
          style={[styles.img, styles.error]}
          testID="lazy-thumbnail-error"
          accessibilityLabel={accessibilityLabel}
          accessible={accessible}
        />
      )}
      {loading && <ActivityIndicator style={styles.loader} />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: 64, height: 48 },
  img: { width: 64, height: 48, borderRadius: 4 },
  error: { backgroundColor: '#f2a7a7' },
  loader: { position: 'absolute', top: 12, left: 22 },
});
