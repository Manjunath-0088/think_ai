import { apiRequest } from '@/api/http';
import { authenticate, registerAccount } from '@/api/auth';

jest.mock('@/api/http', () => ({ apiRequest: jest.fn() }));

const apiRequestMock = apiRequest as jest.MockedFunction<typeof apiRequest>;

beforeEach(() => apiRequestMock.mockReset());

it('authenticates through the existing login endpoint and normalizes identity', async () => {
  apiRequestMock.mockResolvedValue({
    success: true,
    token: 'signed-token',
    user: { id: 42, email: 'learner@example.test', role: 'Learner', name: 'Learner' },
  } as never);

  const result = await authenticate(' Learner@Example.Test ', 'password');

  expect(apiRequestMock).toHaveBeenCalledWith('/auth/login', {
    method: 'POST',
    body: { email: 'learner@example.test', password: 'password' },
    signal: undefined,
  });
  expect(result).toMatchObject({ token: 'signed-token', user: { id: 42, role: 'Learner' } });
});

it('registers through the existing website endpoint and returns its token', async () => {
  apiRequestMock.mockResolvedValue({
    success: true,
    token: 'new-account-token',
    user: { id: 43, email: 'new@example.test', role: 'Learner', name: 'New Learner' },
  } as never);

  const result = await registerAccount(' New Learner ', 'NEW@example.test', 'password');

  expect(apiRequestMock).toHaveBeenCalledWith('/auth/register', {
    method: 'POST',
    body: { name: 'New Learner', email: 'new@example.test', password: 'password' },
    signal: undefined,
  });
  expect(result.token).toBe('new-account-token');
  expect(result.user).toMatchObject({ id: 43, email: 'new@example.test', role: 'Learner' });
});

it('rejects an invalid auth response without persisting an unusable session', async () => {
  apiRequestMock.mockResolvedValue({ success: true, user: { id: 4 } } as never);

  await expect(authenticate('x@example.test', 'password')).rejects.toThrow(
    'The sign-in service returned an invalid response.',
  );
});
