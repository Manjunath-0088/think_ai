export function isCertificatePng(value: unknown): value is string {
  return typeof value === 'string' && value.length < 12 * 1024 * 1024 &&
    /^data:image\/png;base64,iVBORw0KGgo[A-Za-z0-9+/]*={0,2}$/.test(value);
}
