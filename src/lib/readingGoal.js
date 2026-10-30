import { api } from './api';
export async function getReadingGoal(userId) {
  if (!userId) return null;
  return api('/goal');
}
async function update(method, body) {
  try { await api('/goal', { method, body }); return true; }
  catch (error) { console.error(error.message); return false; }
}
export const saveReadingGoal = (userId, escopo, dataAlvo) => update('PUT', { escopo, data_alvo: dataAlvo });
export const deleteReadingGoal = userId => update('DELETE');
