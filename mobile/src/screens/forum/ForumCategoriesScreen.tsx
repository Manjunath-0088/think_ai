import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorState, ScreenHeader } from '@/components/common';
import { useApiClient } from '@/hooks/useApiClient';
import { useSession } from '@/hooks/useSession';
import type { ScreenProps } from '@/navigation/types';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing, typography } from '@/theme/tokens';
import type { Palette } from '@/theme/tokens';
import { useThemedStyles } from '@/theme/useThemedStyles';
import type { ForumCategory } from '@/types';

const EMPTY_FORM = { name: '', color: '#6366f1', description: '' };

export function ForumCategoriesScreen({ navigation }: ScreenProps<'ForumCategories'>) {
  const styles = useThemedStyles(createStyles);
  const { palette } = useTheme();
  const client = useApiClient();
  const session = useSession();
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const canManage = ['admin', 'administrator', 'moderator', 'moderator:superuser']
    .includes((session.profile?.role ?? '').toLowerCase());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCategories(await client.fetchCommunityCategories());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load categories.');
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => { void load(); }, [load]);

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  };

  const startEdit = (category: ForumCategory) => {
    setEditingId(category.id);
    setForm({
      name: category.name,
      color: category.color || '#6366f1',
      description: category.description ?? '',
    });
    setFormError(null);
    setFormOpen(true);
  };

  const saveCategory = async () => {
    const name = form.name.trim();
    const color = form.color.trim();
    if (!name || name.length > 50) {
      setFormError('Enter a category name up to 50 characters.');
      return;
    }
    if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
      setFormError('Color must be a hex value such as #6366f1.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const input = { name, color, description: form.description.trim() };
      if (editingId) await client.updateCommunityCategory(editingId, input);
      else await client.createCommunityCategory(input);
      closeForm();
      await load();
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'Could not save category.');
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = (category: ForumCategory) => {
    Alert.alert('Delete category?', `“${category.name}” will be removed from the community.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void client.deleteCommunityCategory(category.id)
            .then(load)
            .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Could not delete category.'));
        },
      },
    ]);
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea} testID="forum-categories">
      <ScreenHeader
        right={canManage ? (
          <Pressable
            accessibilityLabel="Create category"
            accessibilityRole="button"
            onPress={() => { setForm(EMPTY_FORM); setEditingId(null); setFormError(null); setFormOpen(true); }}
            style={styles.headerButton}>
            <Text style={styles.headerButtonLabel}>New</Text>
          </Pressable>
        ) : undefined}
        subtitle="Browse community topics"
        title="Categories"
      />
      <ScrollView contentContainerStyle={styles.content}>
        {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
        {loading ? <Text style={styles.muted}>Loading categories…</Text> : null}
        {!loading && !error && categories.length === 0 ? (
          <Text style={styles.muted}>No categories are available yet.</Text>
        ) : null}
        {categories.map((category) => (
          <View key={category.id} style={styles.categoryCard}>
            <Pressable
              accessibilityLabel={`Browse ${category.name}, ${category.discussionCount ?? 0} discussions`}
              accessibilityRole="button"
              onPress={() => navigation.navigate('ForumHome', { categoryId: category.id })}
              style={({ pressed }) => [styles.categoryMain, pressed && styles.pressed]}>
              <View style={[styles.colorMark, { backgroundColor: category.color || palette.brand }]} />
              <View style={styles.categoryCopy}>
                <Text style={styles.categoryName}>{category.name}</Text>
                {category.description ? <Text style={styles.description}>{category.description}</Text> : null}
                <Text style={styles.count}>{category.discussionCount ?? 0} discussions</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
            {canManage ? (
              <View style={styles.manageRow}>
                <Pressable accessibilityRole="button" onPress={() => startEdit(category)} style={styles.manageButton}>
                  <Text style={styles.manageLabel}>Edit</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => deleteCategory(category)} style={styles.manageButton}>
                  <Text style={[styles.manageLabel, styles.danger]}>Delete</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ))}
        {formOpen && canManage ? (
          <View style={styles.form} testID="category-form">
            <Text style={styles.formTitle}>{editingId ? 'Edit category' : 'New category'}</Text>
            <TextInput
              accessibilityLabel="Category name"
              maxLength={50}
              onChangeText={(name) => setForm((prev) => ({ ...prev, name }))}
              placeholder="Name"
              placeholderTextColor={palette.textMuted}
              style={styles.input}
              value={form.name}
            />
            <TextInput
              accessibilityLabel="Category color hex code"
              autoCapitalize="none"
              maxLength={7}
              onChangeText={(color) => setForm((prev) => ({ ...prev, color }))}
              placeholder="#6366f1"
              placeholderTextColor={palette.textMuted}
              style={styles.input}
              value={form.color}
            />
            <TextInput
              accessibilityLabel="Category description"
              onChangeText={(description) => setForm((prev) => ({ ...prev, description }))}
              placeholder="Description (optional)"
              placeholderTextColor={palette.textMuted}
              style={styles.input}
              value={form.description}
            />
            {formError ? <Text accessibilityRole="alert" style={styles.error}>{formError}</Text> : null}
            <View style={styles.formActions}>
              <Pressable accessibilityRole="button" disabled={saving} onPress={() => void saveCategory()} style={styles.primaryButton}>
                <Text style={styles.primaryLabel}>{saving ? 'Saving…' : editingId ? 'Save changes' : 'Create category'}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={closeForm} style={styles.cancelButton}>
                <Text style={styles.cancelLabel}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (palette: Palette) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.background },
  content: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl, gap: spacing.sm },
  headerButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.sm },
  headerButtonLabel: { ...typography.label, color: palette.brand },
  categoryCard: { backgroundColor: palette.surface, borderColor: palette.border, borderRadius: radii.lg, borderWidth: 1, overflow: 'hidden' },
  categoryMain: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, minHeight: 78, padding: spacing.md },
  colorMark: { borderRadius: 5, height: 36, width: 7 },
  categoryCopy: { flex: 1, gap: spacing.xxs },
  categoryName: { ...typography.label, color: palette.textPrimary },
  description: { ...typography.caption, color: palette.textSecondary },
  count: { ...typography.caption, color: palette.textMuted },
  chevron: { ...typography.title, color: palette.textMuted },
  manageRow: { borderTopColor: palette.border, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: spacing.sm },
  manageButton: { alignItems: 'center', justifyContent: 'center', minHeight: 44, minWidth: 64, paddingHorizontal: spacing.sm },
  manageLabel: { ...typography.caption, color: palette.brand, fontWeight: '700' },
  danger: { color: palette.danger },
  form: { backgroundColor: palette.surface, borderColor: palette.border, borderRadius: radii.lg, borderWidth: 1, gap: spacing.sm, marginTop: spacing.sm, padding: spacing.md },
  formTitle: { ...typography.subtitle, color: palette.textPrimary },
  input: { ...typography.body, backgroundColor: palette.surfaceMuted, borderColor: palette.border, borderRadius: radii.md, borderWidth: 1, color: palette.textPrimary, minHeight: 48, paddingHorizontal: spacing.sm },
  error: { ...typography.caption, color: palette.danger },
  formActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  primaryButton: { alignItems: 'center', backgroundColor: palette.brand, borderRadius: radii.md, justifyContent: 'center', minHeight: 46, paddingHorizontal: spacing.md },
  primaryLabel: { ...typography.label, color: palette.textInverse },
  cancelButton: { alignItems: 'center', justifyContent: 'center', minHeight: 46, paddingHorizontal: spacing.md },
  cancelLabel: { ...typography.label, color: palette.textSecondary },
  muted: { ...typography.body, color: palette.textMuted, paddingVertical: spacing.md },
  pressed: { opacity: 0.7 },
});

export default ForumCategoriesScreen;
