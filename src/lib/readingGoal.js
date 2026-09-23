import { supabase } from "./supabase";
 
// Busca a meta de leitura atual do usuário (ou null se não tiver nenhuma)
export async function getReadingGoal(userId) {
  const { data, error } = await supabase
    .from("metas_leitura")
    .select("escopo, data_alvo")
    .eq("user_id", userId)
    .maybeSingle();
 
  if (error) {
    console.error("Erro ao buscar meta de leitura:", error);
    return null;
  }
 
  return data;
}
 
// Cria ou atualiza a meta de leitura do usuário (um usuário só tem uma meta ativa)
export async function saveReadingGoal(userId, escopo, dataAlvo) {
  const { error } = await supabase
    .from("metas_leitura")
    .upsert(
      {
        user_id: userId,
        escopo,
        data_alvo: dataAlvo,
        atualizado_em: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
 
  if (error) {
    console.error("Erro ao salvar meta de leitura:", error);
    return false;
  }
 
  return true;
}
 
// Remove a meta de leitura do usuário
export async function deleteReadingGoal(userId) {
  const { error } = await supabase
    .from("metas_leitura")
    .delete()
    .eq("user_id", userId);
 
  if (error) {
    console.error("Erro ao remover meta de leitura:", error);
    return false;
  }
 
  return true;
}