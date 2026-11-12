import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

/** Compact learner banner matching the original mobile design. */
export function ThinkzHomeHero({ onBrowse }: { onBrowse: () => void; onLearning: () => void }) {
  const { width, fontScale } = useWindowDimensions();
  const stacked = width < 340 || fontScale > 1.3;
  return (
    <View style={[styles.banner, stacked && styles.stacked]} testID="thinkz-home-hero">
      <View style={styles.copy}>
        <Text accessibilityRole="header" style={styles.title}>Learn. Practice.{'\n'}Grow.</Text>
        <Text style={styles.subtitle}>Build new skills with{'\n'}Thinkz AI</Text>
        <Pressable accessibilityRole="button" onPress={onBrowse} testID="browse-tab" style={styles.button}><Text style={styles.buttonLabel}>Explore Courses →</Text></Pressable>
      </View>
      <View accessible={false} pointerEvents="none" style={styles.art}>
        <View style={[styles.book, { bottom: 6 }]} /><View style={[styles.book, { bottom: 27, width: 98 }]} />
        <View style={styles.capBase} /><View style={styles.capTop} /><View style={styles.tassel} />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  banner: { marginHorizontal: 16, marginVertical: 12, padding: 18, minHeight: 180, borderRadius: 15, backgroundColor: '#A435F0', flexDirection: 'row', alignItems: 'center', gap: 8 },
  stacked: { flexDirection: 'column', alignItems: 'stretch' },
  copy: { flex: 1, minWidth: 0 },
  title: { fontSize: 24, lineHeight: 28, color: '#FFFFFF', fontWeight: '700' },
  subtitle: { fontSize: 13, lineHeight: 17, color: '#FFFFFF', marginVertical: 9 },
  button: { backgroundColor: '#FFFFFF', borderRadius: 22, paddingHorizontal: 12, paddingVertical: 9, minHeight: 36, alignSelf: 'flex-start' },
  buttonLabel: { color: '#251332', fontSize: 11, fontWeight: '700' },
  art: { width: 115, height: 135, alignItems: 'center', alignSelf: 'center' },
  book: { position: 'absolute', width: 108, height: 23, backgroundColor: '#FFFFFF', borderBottomWidth: 5, borderBottomColor: '#F7BA43', borderRadius: 3, transform: [{ rotate: '8deg' }] },
  capBase: { position: 'absolute', top: 48, width: 66, height: 28, borderRadius: 10, backgroundColor: '#182340' },
  capTop: { position: 'absolute', top: 26, width: 78, height: 48, backgroundColor: '#242C4B', transform: [{ rotate: '-16deg' }, { skewX: '25deg' }], borderRadius: 4 },
  tassel: { position: 'absolute', top: 47, right: 17, width: 4, height: 43, backgroundColor: '#FFC845', borderRadius: 3 },
});
