import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import type { ComponentProps } from 'react';
import { palette } from '@/theme/tokens';

export type AppIconName = ComponentProps<typeof FontAwesome5>['name'];

/** Bundled Font Awesome Free icons: available offline on web and native. */
export function AppIcon({ name, size = 20, color = palette.textPrimary }: {
  name: AppIconName;
  size?: number;
  color?: string;
}) {
  return <FontAwesome5 name={name} size={size} color={color} solid accessible={false} />;
}

export function actionIcon(title: string): AppIconName | undefined {
  const label = title.toLowerCase();
  if (label.includes('sign out')) return 'sign-out-alt';
  if (label.includes('playground')) return 'code';
  if (label.includes('history')) return 'history';
  if (label.includes('copy')) return 'copy';
  if (label.includes('share')) return 'share-alt';
  if (label.includes('download')) return 'download';
  if (label.includes('certificate')) return 'award';
  if (label.includes('profile') || label.includes('account')) return 'user-circle';
  if (label.includes('analytics') || label.includes('report')) return 'chart-bar';
  if (label.includes('community')) return 'comments';
  if (label.includes('delete') || label.includes('discard') || label.startsWith('clear')) return 'trash-alt';
  if (label.startsWith('run') || label.includes('continue learning') || label.includes('play offline')) return 'play';
  if (label.startsWith('save')) return 'save';
  if (label.includes('submit') || label.includes('submission')) return 'paper-plane';
  if (label.includes('retry') || label.includes('refresh') || label.includes('retake')) return 'redo-alt';
  if (label === 'next') return 'arrow-right';
  if (label === 'previous') return 'arrow-left';
  return undefined;
}

export function screenIcon(title: string): AppIconName {
  const label = title.toLowerCase();
  if (label.includes('code') || label.includes('playground')) return 'code';
  if (label.includes('history')) return 'history';
  if (label.includes('download')) return 'download';
  if (label.includes('certificate')) return 'award';
  if (label.includes('profile') || label.includes('account') || label.includes('settings')) return 'user-circle';
  if (label.includes('analytics') || label.includes('admin')) return 'chart-bar';
  if (label.includes('result')) return 'clipboard-check';
  if (label.includes('assessment')) return 'tasks';
  return 'book-open';
}
