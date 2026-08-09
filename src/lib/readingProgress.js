import { supabase } from "./supabase";

export async function isChapterRead(userId, livro, capitulo) {
  const { data, error } = await supabase
    .from("capitulos_lidos")
    .select("id")
    .eq("user_id", userId)
    .eq("livro", livro)
    .eq("capitulo", capitulo)
    .maybeSingle();

  if (error) {
    console.error("Erro ao verificar capítulo lido:", error);
    return false;
  }

  return Boolean(data);
}

export async function markChapterAsRead(userId, livro, capitulo) {
  const { error } = await supabase
    .from("capitulos_lidos")
    .insert({ user_id: userId, livro, capitulo });

  if (error) {
    console.error("Erro ao marcar capítulo como lido:", error);
    return false;
  }

  return true;
}

export async function markChapterAsUnread(userId, livro, capitulo) {
  const { error } = await supabase
    .from("capitulos_lidos")
    .delete()
    .eq("user_id", userId)
    .eq("livro", livro)
    .eq("capitulo", capitulo);

  if (error) {
    console.error("Erro ao desmarcar capítulo:", error);
    return false;
  }

  return true;
}

export async function getAllReadChapters(userId) {
  const { data, error } = await supabase
    .from("capitulos_lidos")
    .select("livro, capitulo")
    .eq("user_id", userId);

  if (error) {
    console.error("Erro ao buscar progresso:", error);
    return {};
  }

  // Organiza em formato: { "Gênesis": [1, 2, 5], "Êxodo": [1] }
  const byBook = {};
  for (const row of data) {
    if (!byBook[row.livro]) byBook[row.livro] = [];
    byBook[row.livro].push(row.capitulo);
  }

  return byBook;
}

export async function markBookAsRead(userId, livro, totalChapters) {
  const rows = Array.from({ length: totalChapters }, (_, i) => ({
    user_id: userId,
    livro,
    capitulo: i + 1,
  }));

  const { error } = await supabase
    .from("capitulos_lidos")
    .upsert(rows, { onConflict: "user_id,livro,capitulo" });

  if (error) {
    console.error("Erro ao marcar livro como lido:", error);
    return false;
  }

  return true;
}

export async function markBookAsUnread(userId, livro) {
  const { error } = await supabase
    .from("capitulos_lidos")
    .delete()
    .eq("user_id", userId)
    .eq("livro", livro);

  if (error) {
    console.error("Erro ao desmarcar livro:", error);
    return false;
  }

  return true;
  
}
export async function getLastRead(userId) {
  const { data, error } = await supabase
    .from("capitulos_lidos")
    .select("livro, capitulo, lido_em")
    .eq("user_id", userId)
    .order("lido_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar último lido:", error);
    return null;
  }

  return data;
}