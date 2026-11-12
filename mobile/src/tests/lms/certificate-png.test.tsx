import { act } from '@testing-library/react-native';
import { create, type ReactTestRenderer } from 'react-test-renderer';
import { PdfPreview as WebPreview } from '@/lms/PdfPreview.web';
import { PdfPreview as NativePreview } from '@/lms/PdfPreview';
import { isCertificatePng } from '@/lms/certificatePng';
import { shareIssuedCertificatePng } from '@/lms/certificateShare';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
jest.mock('react-native-webview', () => ({ WebView: 'WebView' }));
jest.mock('expo-file-system/legacy', () => ({ cacheDirectory: 'file:///cache/', EncodingType: { Base64: 'base64' }, writeAsStringAsync: jest.fn(), deleteAsync: jest.fn() }));
jest.mock('expo-sharing', () => ({ isAvailableAsync: jest.fn(async () => true), shareAsync: jest.fn() }));
const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aKb8AAAAASUVORK5CYII=';
test.each(['javascript:alert(1)', 'data:image/svg+xml;base64,iVBORw0KGgo=', 'data:image/png;base64,<script>', null])('rejects non-PNG messages %s', value => expect(isCertificatePng(value)).toBe(false));
test('native preview accepts only validated PNG messages from its own PDF renderer', () => {
  const callback = jest.fn(); let tree!: ReactTestRenderer;
  act(() => { tree = create(<NativePreview url="data:application/pdf;base64,JVBERg==" onPng={callback} />); });
  const view = tree.root.findByType('WebView' as any);
  act(() => { view.props.onMessage({ nativeEvent: { data: 'invalid JSON' } }); view.props.onMessage({ nativeEvent: { data: JSON.stringify({ type: 'certificatePng', dataUrl: 'javascript:alert(1)' }) } }); });
  expect(callback).not.toHaveBeenCalled();
  act(() => view.props.onMessage({ nativeEvent: { data: JSON.stringify({ type: 'certificatePng', dataUrl: png }) } }));
  expect(callback).toHaveBeenCalledWith(png); act(() => tree.unmount());
});
test('web PDF frame remains opaque to app storage and ignores forged image messages from other frames', () => {
  const beforeAdd = window.addEventListener, beforeRemove = window.removeEventListener;
  let listener: ((e: any) => void) | undefined;
  window.addEventListener = jest.fn((_type: string, fn: any) => { listener = fn; }) as any;
  window.removeEventListener = jest.fn();
  try {
    const frame = { contentWindow: {} }, callback = jest.fn(); let tree: ReturnType<typeof create>;
    act(() => { tree = create(<WebPreview url="data:application/pdf;base64,JVBERg==" onPng={callback} />, { createNodeMock: () => frame }); });
    expect(tree!.root.findByType('iframe').props.sandbox).toBe('allow-scripts');
    act(() => listener?.({ source: {}, data: { type: 'certificatePng', dataUrl: png } })); expect(callback).not.toHaveBeenCalled();
    act(() => listener?.({ source: frame.contentWindow, data: { type: 'certificatePng', dataUrl: png } })); expect(callback).toHaveBeenCalledWith(png);
    act(() => tree!.unmount());
  } finally { window.addEventListener = beforeAdd; window.removeEventListener = beforeRemove; }
});
test('native sharing uses pixels rendered from the issued PDF and cleans its temporary PNG', async () => {
  await shareIssuedCertificatePng(png, 21);
  expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(expect.stringMatching(/certificate-21-\d+\.png$/), png.split(',')[1], { encoding: 'base64' });
  expect(Sharing.shareAsync).toHaveBeenCalledWith(expect.stringMatching(/certificate-21-\d+\.png$/), expect.objectContaining({ mimeType: 'image/png' }));
  expect(FileSystem.deleteAsync).toHaveBeenCalledWith(expect.stringMatching(/certificate-21-\d+\.png$/), { idempotent: true });
});
