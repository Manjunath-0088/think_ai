import { useTheme } from "@/theme/ThemeProvider";
import { useThemedStyles } from "@/theme/useThemedStyles";
import type { Palette } from "@/theme/tokens";
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useOptionalSafeAreaInsets } from '@/hooks/useOptionalSafeAreaInsets';
import { hitSlop, radii, spacing, typography } from '@/theme/tokens';
import type { ForumCategory } from '@/types';
export interface CreatePostModalProps {
  /** Category selected when the sheet opens (e.g. the active forum filter). */
  initialCategoryId?: string;
  visible: boolean;
  categories: ForumCategory[];
  availableTags: string[];
  isSubmitting?: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (input: {
    title: string;
    body: string;
    categoryId: string;
    tags: string[];
  }) => void;
  testID?: string;
}
export const TITLE_MIN_LENGTH = 6;
export const TITLE_MAX_LENGTH = 150;
/** Mirrors `POST /api/discussions` in `postgresCommunityService.createDiscussion`. */
export const BODY_MIN_LENGTH = 10;
export const BODY_MAX_LENGTH = 5000;
export function CreatePostModal({
  visible,
  categories,
  availableTags,
  initialCategoryId,
  isSubmitting = false,
  errorMessage = null,
  onClose,
  onSubmit,
  testID = 'create-post-modal'
}: CreatePostModalProps) {
  const {
    palette
  } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useOptionalSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [categoryId, setCategoryId] = useState<string>(initialCategoryId ?? categories[0]?.id ?? '');
  const [tags, setTags] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  useEffect(() => {
    if (visible) {
      setValidationError(null);
    }
  }, [visible]);

  // The screen mounts this sheet before the category list resolves, so adopt the
  // first category once it arrives instead of blocking submit on an empty id.
  useEffect(() => {
    if (categoryId === '' && categories.length > 0) {
      setCategoryId(initialCategoryId ?? categories[0]?.id ?? '');
    }
  }, [categories, categoryId, initialCategoryId]);
  const trimmedTitle = title.trim();
  const trimmedBody = body.trim();
  const canSubmit =
    trimmedTitle.length >= TITLE_MIN_LENGTH &&
    trimmedTitle.length <= TITLE_MAX_LENGTH &&
    trimmedBody.length >= BODY_MIN_LENGTH &&
    trimmedBody.length <= BODY_MAX_LENGTH &&
    categories.some(category => category.id === categoryId);
  const toggleTag = (tag: string) => {
    setTags(current => current.includes(tag) ? current.filter(entry => entry !== tag) : [...current, tag]);
  };
  const handleSubmit = () => {
    if (isSubmitting) return;
    if (!canSubmit) {
      if (trimmedTitle.length < TITLE_MIN_LENGTH || categoryId === '') {
        setValidationError(`Add a title of at least ${TITLE_MIN_LENGTH} characters and pick a category.`);
        return;
      }
      if (trimmedTitle.length > TITLE_MAX_LENGTH) {
        setValidationError(`Keep the title under ${TITLE_MAX_LENGTH} characters.`);
        return;
      }
      if (trimmedBody.length < BODY_MIN_LENGTH) {
        setValidationError(`Add a body of at least ${BODY_MIN_LENGTH} characters.`);
        return;
      }
      setValidationError(`Keep the body under ${BODY_MAX_LENGTH} characters.`);
      return;
    }
    onSubmit({
      title: trimmedTitle,
      body: trimmedBody,
      categoryId,
      tags
    });
  };
  return <Modal animationType="slide" statusBarTranslucent onRequestClose={() => { if (!isSubmitting) onClose(); }} transparent visible={visible}>
      <View style={styles.backdrop} testID={`${testID}-backdrop`}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.sheetWrap}>
          <View accessibilityViewIsModal style={[styles.sheet, { paddingBottom: spacing.lg + insets.bottom }]} testID={testID}>
            <View style={styles.header}>
              <Text accessibilityRole="header" style={styles.headerTitle}>
                New thread
              </Text>
              <Pressable accessibilityLabel="Close" accessibilityRole="button" hitSlop={hitSlop} disabled={isSubmitting} onPress={onClose} testID={`${testID}-close`}>
                <Text style={styles.close}>✕</Text>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.body} keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled" testID={`${testID}-body`}>
              <Text style={styles.label}>Title</Text>
              <TextInput accessibilityLabel="Thread title" maxLength={TITLE_MAX_LENGTH} onChangeText={setTitle} placeholder="What do you want to discuss?" placeholderTextColor={palette.textMuted} style={styles.input} testID={`${testID}-title`} value={title} />

              <Text style={styles.label}>Body</Text>
              <TextInput accessibilityLabel="Thread body" maxLength={BODY_MAX_LENGTH} multiline onChangeText={setBody} placeholder="Add context, code or links…" placeholderTextColor={palette.textMuted} style={[styles.input, styles.textarea]} testID={`${testID}-body-input`} value={body} />
              <Text style={styles.hint} testID={`${testID}-body-hint`}>
                {trimmedBody.length}/{BODY_MIN_LENGTH} characters minimum
              </Text>

              <Text style={styles.label}>Category</Text>
              <View style={styles.chipRow} testID={`${testID}-categories`}>
                {categories.map(category => {
                const isSelected = category.id === categoryId;
                return <Pressable accessibilityLabel={category.name} accessibilityRole="radio" accessibilityState={{
                  selected: isSelected
                }} hitSlop={hitSlop} key={category.id} onPress={() => setCategoryId(category.id)} style={[styles.chip, isSelected && styles.chipSelected]} testID={`${testID}-category-${category.id}`}>
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {category.name}
                      </Text>
                    </Pressable>;
              })}
              </View>

              <Text style={styles.label}>Tags</Text>
              <View style={styles.chipRow} testID={`${testID}-tags`}>
                {availableTags.map(tag => {
                const isSelected = tags.includes(tag);
                return <Pressable accessibilityLabel={tag} accessibilityRole="checkbox" accessibilityState={{
                  checked: isSelected
                }} hitSlop={hitSlop} key={tag} onPress={() => toggleTag(tag)} style={[styles.chip, isSelected && styles.chipSelected]} testID={`${testID}-tag-${tag}`}>
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {tag}
                      </Text>
                    </Pressable>;
              })}
              </View>

              {validationError ? <Text accessibilityLiveRegion="polite" style={styles.error} testID={`${testID}-validation-error`}>
                  {validationError}
                </Text> : null}
              {errorMessage ? <Text accessibilityLiveRegion="assertive" style={styles.error} testID={`${testID}-error`}>
                  {errorMessage}
                </Text> : null}
            </ScrollView>

            <Pressable accessibilityRole="button" accessibilityState={{
            disabled: isSubmitting
          }} disabled={isSubmitting} onPress={handleSubmit} style={[styles.submit, isSubmitting && styles.submitDisabled]} testID={`${testID}-submit`}>
              <Text style={styles.submitText}>
                {isSubmitting ? 'Posting…' : 'Post thread'}
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>;
}
const createStyles = (palette: Palette) => StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: palette.overlay
  },
  sheetWrap: {
    maxHeight: '90%'
  },
  sheet: {
    flexShrink: 1,
    backgroundColor: palette.surfaceElevated,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingBottom: spacing.lg
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.border
  },
  headerTitle: {
    ...typography.subtitle,
    color: palette.textPrimary
  },
  close: {
    ...typography.subtitle,
    color: palette.textSecondary,
    paddingHorizontal: spacing.xs
  },
  body: {
    padding: spacing.md,
    gap: spacing.xs
  },
  label: {
    ...typography.label,
    color: palette.textSecondary,
    marginTop: spacing.sm
  },
  input: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: palette.textPrimary
  },
  textarea: {
    minHeight: 96,
    textAlignVertical: 'top'
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs
  },
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface
  },
  chipSelected: {
    backgroundColor: palette.brandAlt,
    borderColor: palette.brandAlt
  },
  chipText: {
    ...typography.caption,
    color: palette.textSecondary
  },
  chipTextSelected: {
    color: palette.textPrimary,
    fontWeight: '700'
  },
  error: {
    ...typography.caption,
    color: palette.danger,
    marginTop: spacing.sm
  },
  hint: {
    ...typography.caption,
    color: palette.textMuted,
    marginTop: spacing.xxs
  },
  submit: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: palette.brand,
    alignItems: 'center'
  },
  submitDisabled: {
    opacity: 0.6
  },
  submitText: {
    ...typography.label,
    color: '#FFFFFF',
    fontWeight: '700'
  }
});
export default CreatePostModal;
