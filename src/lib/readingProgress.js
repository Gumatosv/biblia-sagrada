import { api } from './api';
export async function isChapterRead(userId, livro, capitulo) {
  const progress = await getAllReadChapters(userId);
  return (progress[livro] || []).includes(Number(capitulo));
}
async function update(path, method, body) {
  try { await api(path, { method, body }); return true; }
  catch (error) { console.error(error.message); return false; }
}
export const markChapterAsRead = (userId, livro, capitulo) => update('/progress/chapter', 'PUT', { livro, capitulo: Number(capitulo) });
export const markChapterAsUnread = (userId, livro, capitulo) => update('/progress/chapter', 'DELETE', { livro, capitulo: Number(capitulo) });
export const markBookAsRead = (userId, livro) => update('/progress/book', 'PUT', { livro });
export const markBookAsUnread = (userId, livro) => update('/progress/book', 'DELETE', { livro });
export async function getAllReadChapters(userId) {
  if (!userId) return {};
  return api('/progress');
}
export async function getLastRead(userId) {
  if (!userId) return null;
  return api('/progress/last');
}
