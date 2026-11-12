import { resolveApiBaseUrl } from '@/api/http';

describe('resolveApiBaseUrl', () => {
  it('uses the Expo LAN host for a physical Android device', () => {
    expect(resolveApiBaseUrl('android', undefined, '10.184.219.53:8082')).toBe(
      'http://10.184.219.53:5000/api',
    );
  });

  it('accepts an Expo URL and ignores its Metro port', () => {
    expect(resolveApiBaseUrl('android', undefined, 'exp://192.168.1.22:8081')).toBe(
      'http://192.168.1.22:5000/api',
    );
  });

  it('keeps an explicit API URL ahead of the Expo host', () => {
    expect(
      resolveApiBaseUrl('android', 'https://api.thinkzai.example/api/', '10.0.0.5:8081'),
    ).toBe('https://api.thinkzai.example/api');
  });

  it('adds the backend API prefix when given a host-only URL', () => {
    expect(resolveApiBaseUrl('android', 'https://api.thinkzai.example')).toBe(
      'https://api.thinkzai.example/api',
    );
  });

  it('does not duplicate the API prefix when it is already present', () => {
    expect(resolveApiBaseUrl('android', 'https://api.thinkzai.example/api/')).toBe(
      'https://api.thinkzai.example/api',
    );
  });

  it('falls back to the emulator host if Expo has no usable LAN address', () => {
    expect(resolveApiBaseUrl('android', undefined, 'localhost:8081')).toBe(
      'http://10.0.2.2:5000/api',
    );
  });

  it('uses localhost on web and when a physical iOS host is unavailable', () => {
    expect(resolveApiBaseUrl('web')).toBe('http://localhost:5000/api');
    expect(resolveApiBaseUrl('ios', undefined, '127.0.0.1:8081')).toBe(
      'http://localhost:5000/api',
    );
  });
});
