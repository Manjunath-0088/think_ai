import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useNotificationPreferences } from '../hooks/useNotificationPreferences';
import { ChannelToggles } from '../components/ChannelToggles';
import { PreferenceGroup } from '../components/PreferenceGroup';
import { EventGroup } from '../types';

interface NotificationDropdownProps {
  visible: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<View>;
}

const GROUPS: EventGroup[] = ['replies', 'mentions', 'sessions', 'payments'];

export function NotificationDropdown({ visible, onClose, anchorRef }: NotificationDropdownProps) {
  const navigation = useNavigation<any>();
  const {
    prefs,
    loading,
    hasUnsavedChanges,
    error,
    setGroupChannel,
    save,
  } = useNotificationPreferences();
  const [showWarning, setShowWarning] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const pendingNav = useRef<any>(null);

  useEffect(() => {
    if (toast === null) return undefined;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const onSave = async () => {
    const ok = await save();
    setToast(ok ? 'Notification preferences saved.' : 'Could not save preferences.');
  };

  const groups = ['replies', 'mentions', 'sessions', 'payments'];

  if (!visible) return null;

  return (
    <View style={styles.overlay} onTouchStart={onClose} pointerEvents="box-none">
      <View
        ref={anchorRef}
        style={styles.dropdown}
        pointerEvents="box-only"
        testID="notification-dropdown">
        {loading ? (
          <View accessibilityLiveRegion="polite" style={styles.loading}>
            <ActivityIndicator
              accessibilityLabel="Loading notification preferences"
              testID="prefs-loading"
            />
            <Text style={styles.loadingText}>Loading preferences...</Text>
          </View>
        ) : null}
        {['replies', 'mentions', 'sessions', 'payments'].map((g) => (
          <PreferenceGroup
            key={g}
            group={g}
            value={prefs[g]}
            onChannelChange={(c, v) => setGroupChannel(g, c, v)}
          />
        ))}
        {error ? (
          <Text accessibilityLiveRegion="assertive" style={styles.error} testID="prefs-error">
            {error}
          </Text>
        ) : null}
        <View style={styles.saveRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save preferences"
            onPress={async () => {
              const ok = await save();
              setToast(ok ? 'Notification preferences saved.' : 'Could not save preferences.');
            }}
            style={styles.saveButton}
            testID="prefs-save-button">
            <Text style={styles.saveButtonText}>Save</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={onClose}
            style={styles.closeButton}
            testID="prefs-close-button">
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
        </View>
        {toast ? (
          <Text accessibilityLiveRegion="polite" style={styles.toast} testID="prefs-save-toast">
            {toast}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  dropdown: {
    position: 'absolute',
    top: 60,
    right: 16,
    width: 320,
    maxHeight: 400,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9DEEA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
  },
  loadingText: {
    fontSize: 13,
    color: '#6B7280',
  },
  error: {
    marginHorizontal: 16,
    marginTop: 8,
    color: '#F87171',
    fontSize: 13,
  },
  saveRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#D9DEEA',
  },
  saveButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#6D28D9',
    marginRight: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  closeButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#EDEFF6',
    borderWidth: 1,
    borderColor: '#D9DEEA',
  },
  closeButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  toast: {
    marginHorizontal: 16,
    marginBottom: 8,
    color: '#047857',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default NotificationDropdown;