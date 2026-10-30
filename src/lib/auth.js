import { api } from './api';
const listeners = new Set();
const notify = session => listeners.forEach(callback => callback('SESSION_CHANGED', session));
function validateSession(data, allowSignedOut = false) {
  if (!data || typeof data !== 'object' || !Object.prototype.hasOwnProperty.call(data, 'session') ||
      (!(allowSignedOut && data.session === null) && !data.session?.user?.id)) {
    throw new Error('Resposta de autenticação inválida. Verifique se a API está iniciada.');
  }
  return data;
}
async function authenticate(path, credentials) {
  try {
    const data = validateSession(await api(path, { method: 'POST', body: credentials }));
    notify(data.session);
    return { data, error: null };
  } catch (error) { return { data: {}, error }; }
}
export const auth = {
  async getSession() {
    try { return { data: validateSession(await api('/auth/session'), true), error: null }; }
    catch (error) { return { data: { session: null }, error }; }
  },
  onAuthStateChange(callback) {
    listeners.add(callback);
    return { data: { subscription: { unsubscribe: () => listeners.delete(callback) } } };
  },
  signInWithPassword: credentials => authenticate('/auth/login', credentials),
  signUp: credentials => authenticate('/auth/signup', credentials),
  async signOut() {
    try { await api('/auth/logout', { method: 'POST' }); notify(null); return { error: null }; }
    catch (error) { window.alert(error.message); return { error }; }
  },
};
