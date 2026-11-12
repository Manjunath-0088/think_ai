import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { useNotificationPreferences } from '../hooks/useNotificationPreferences';
import { PreferenceGroup } from '../components/PreferenceGroup';
import { SaveButton } from '../components/SaveButton';
import { UnsavedWarningModal } from '../components/UnsavedWarningModal';
import { EventGroup } from '../types';

export function NotificationPreferencesScreen() {
  const nav = useNavigation<any>();
  const {
    prefs,
    loading,
    saving,
    hasUnsavedChanges,
    setGroupChannel,
    save,
  } = useNotificationPreferences();
  const [showWarning, setShowWarning] = useState(false);
  const pendingNav = useRef<any>(null);

  useFocusEffect(() => {
    const unsubscribe = nav.addListener('beforeRemove', (e: any) => {
      if (!hasUnsavedChanges) return;
      e.preventDefault();
      pendingNav.current = e.data.action;
      setShowWarning(true);
    });
    return unsubscribe;
  });

  const onSave = async () => {
    const ok = await save();
    if (ok) Alert.alert('Saved', 'Notification preferences saved.');
  };

  const discard = () => {
    setShowWarning(false);
    const action = pendingNav.current;
    pendingNav.current = null;
    if (action) nav.dispatch(action);
  };
  const cancel = () => {
    setShowWarning(false);
    pendingNav.current = null;
  };

  const groups: EventGroup[] = ['replies', 'mentions', 'sessions', 'payments'];
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      testID="notification-preferences-screen">
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator testID="prefs-loading" />
          <Text>Loading preferences...</Text>
        </View>
      ) : null}
      {groups.map((g) => (
        <PreferenceGroup
          key={g}
          group={g}
          value={prefs[g]}
          onChannelChange={(c, v) => setGroupChannel(g, c, v)}
        />
      ))}
      <SaveButton saving={saving} onPress={onSave} />
      <UnsavedWarningModal
        visible={showWarning}
        onDiscard={discard}
        onCancel={cancel}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
