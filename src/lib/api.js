export async function api(path, { method = 'GET', body } = {}) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      method, credentials: 'same-origin',
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch { throw new Error('Falha ao conectar ao servidor. Tente novamente.'); }
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('Resposta inválida da API. Verifique se o servidor está iniciado.');
  }
  if (!response.ok) throw new Error(data?.message || 'Falha ao concluir a chamada ao servidor.');
  return data;
}
