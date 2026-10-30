import { api } from './lib/api';
import { auth } from './lib/auth';
import { getAllReadChapters, markChapterAsRead } from './lib/readingProgress';
beforeEach(() => { global.fetch = jest.fn(); });
afterEach(() => { jest.restoreAllMocks(); });
test.each([null, {}, { session: {} }])('invalid session response %p safely returns a signed-out session', async payload => {
  fetch.mockResolvedValue({ ok: true, json: async () => payload });
  const result = await auth.getSession();
  expect(result.data).toEqual({ session: null });
  expect(result.error).toBeInstanceOf(Error);
});
test('HTML fallback is reported as an API error without crashing session initialization', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => { throw new SyntaxError('Unexpected token <'); } });
  const result = await auth.getSession();
  expect(result.data.session).toBeNull();
  expect(result.error.message).toContain('servidor');
});
test('an unavailable API safely returns a signed-out session', async () => {
  fetch.mockRejectedValue(new TypeError('Failed to fetch'));
  expect((await auth.getSession()).data.session).toBeNull();
});
test('a valid signed-out response and nullable endpoints remain supported', async () => {
  fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ session: null }) });
  expect(await auth.getSession()).toEqual({ data: { session: null }, error: null });
  fetch.mockResolvedValueOnce({ ok: true, json: async () => null });
  expect(await api('/goal')).toBeNull();
});
test('API sends cookies and reports server errors', async () => {
  fetch.mockResolvedValue({ ok: false, json: async () => ({ message: 'Entre na sua conta.' }) });
  await expect(api('/progress')).rejects.toThrow('Entre na sua conta.');
  expect(fetch).toHaveBeenCalledWith('/api/progress', expect.objectContaining({ credentials: 'same-origin' }));
});
test('progress keeps all chapters beyond the previous 1000 row limit', async () => {
  const progress = { livro: Array.from({ length: 1189 }, (_, i) => i + 1) };
  fetch.mockResolvedValue({ ok: true, json: async () => progress });
  expect((await getAllReadChapters('user')).livro).toHaveLength(1189);
});
test('writes never accept a client supplied user id', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
  expect(await markChapterAsRead('another-user', 'Salmos', '12')).toBe(true);
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ livro: 'Salmos', capitulo: 12 });
});
test('authentication notifies listeners only after success and supports unsubscribe', async () => {
  const session = { user: { id: 'user' } };
  const listener = jest.fn();
  const subscription = auth.onAuthStateChange(listener).data.subscription;
  fetch.mockResolvedValueOnce({ ok: false, json: async () => ({ message: 'Senha incorreta' }) });
  expect((await auth.signInWithPassword({})).error.message).toBe('Senha incorreta');
  expect(listener).not.toHaveBeenCalled();
  fetch.mockResolvedValue({ ok: true, json: async () => ({ session }) });
  await auth.signInWithPassword({});
  expect(listener).toHaveBeenCalledWith('SESSION_CHANGED', session);
  subscription.unsubscribe();
  await auth.signInWithPassword({});
  expect(listener).toHaveBeenCalledTimes(1);
});
