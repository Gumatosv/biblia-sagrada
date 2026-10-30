import { useEffect, useState } from "react";
import { getReadingGoal, saveReadingGoal, deleteReadingGoal } from "../lib/readingGoal";
 
const ESCOPO_LABELS = {
  biblia: "Bíblia inteira",
  antigo: "Antigo Testamento",
  novo: "Novo Testamento",
};
 
function formatDateBR(isoDate) {
  const [ano, mes, dia] = isoDate.split("-");
  return `${dia}/${mes}/${ano}`;
}
 
function todayISO() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().split("T")[0];
}
 
// Quantos dias faltam até a data alvo (pode ser 0 ou negativo)
function diasRestantes(dataAlvoISO) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
 
  const alvo = new Date(dataAlvoISO + "T00:00:00");
  alvo.setHours(0, 0, 0, 0);
 
  const diffMs = alvo.getTime() - hoje.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}
 
export default function ReadingGoalCard({ userId, totals }) {
  // totals = { biblia: {total, read}, antigo: {total, read}, novo: {total, read} }
  const [loading, setLoading] = useState(true);
  const [goal, setGoal] = useState(null); // { escopo, data_alvo } | null
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
 
  const [formEscopo, setFormEscopo] = useState("biblia");
  const [formData, setFormData] = useState("");
 
  useEffect(() => {
    let active = true;
    setGoal(null);
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    getReadingGoal(userId).then((data) => {
      if (!active) return;
      setGoal(data);
      if (data) {
        setFormEscopo(data.escopo);
        setFormData(data.data_alvo);
      }
      setLoading(false);
    }).catch(error => {
      if (active) { window.alert(error.message); setLoading(false); }
    });
    return () => { active = false; };
  }, [userId]);
 
  async function handleSave() {
    if (!formData) return;
    setSaving(true);
    const ok = await saveReadingGoal(userId, formEscopo, formData);
    if (ok) {
      setGoal({ escopo: formEscopo, data_alvo: formData });
      setEditing(false);
    }
    setSaving(false);
  }
 
  async function handleRemove() {
    setSaving(true);
    const ok = await deleteReadingGoal(userId);
    if (ok) {
      setGoal(null);
      setEditing(false);
    }
    setSaving(false);
  }
 
  if (loading) return null;
 
  // --- Modo edição (definindo ou alterando a meta) ---
  if (editing || !goal) {
    return (
      <div className="rounded-2xl border border-stone-300 dark:border-white/10 bg-white/60 dark:bg-white/5 px-6 py-6 mb-10">
        <h2 className="text-stone-700 dark:text-white/80 text-sm font-medium mb-4">
          {goal ? "Alterar meta de leitura" : "Definir meta de leitura"}
        </h2>
 
        <div className="mb-4">
          <label className="block text-stone-500 dark:text-white/50 text-xs mb-2">
            O que você quer terminar?
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(ESCOPO_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFormEscopo(key)}
                className={`text-xs rounded-full px-4 py-2 border transition-colors ${
                  formEscopo === key
                    ? "bg-amber-400/20 border-amber-400/40 text-amber-700 dark:text-amber-200"
                    : "bg-white/60 dark:bg-white/5 border-stone-300 dark:border-white/15 text-stone-600 dark:text-white/70 hover:bg-white dark:hover:bg-white/10"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
 
        <div className="mb-5">
          <label className="block text-stone-500 dark:text-white/50 text-xs mb-2">
            Até quando você quer terminar?
          </label>
          <input
            type="date"
            min={todayISO()}
            value={formData}
            onChange={(e) => setFormData(e.target.value)}
            className="rounded-lg border border-stone-300 dark:border-white/15 bg-white dark:bg-black/30 text-stone-700 dark:text-white/80 text-sm px-3 py-2"
          />
        </div>
 
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={!formData || saving}
            className="rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-700 dark:text-amber-200 text-xs px-5 py-2 hover:bg-amber-400/30 transition-colors disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar meta"}
          </button>
          {goal && (
            <button
              onClick={() => {
                setEditing(false);
                setFormEscopo(goal.escopo);
                setFormData(goal.data_alvo);
              }}
              disabled={saving}
              className="rounded-full border border-stone-300 dark:border-white/15 text-stone-500 dark:text-white/50 text-xs px-5 py-2 hover:text-stone-800 dark:hover:text-white/80 transition-colors"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    );
  }
 
  // --- Modo exibição (já existe uma meta salva) ---
  const escopoTotals = totals[goal.escopo] || { total: 0, read: 0 };
  const restantes = Math.max(escopoTotals.total - escopoTotals.read, 0);
  const dias = diasRestantes(goal.data_alvo);
 
  let mensagem;
  if (restantes === 0) {
    mensagem = "🎉 Você já concluiu essa meta!";
  } else if (dias < 0) {
    mensagem = `A data já passou e ainda faltam ${restantes} capítulo${restantes > 1 ? "s" : ""}.`;
  } else if (dias === 0) {
    mensagem = `Hoje é o último dia! Leia os ${restantes} capítulo${restantes > 1 ? "s" : ""} que faltam hoje.`;
  } else {
    const porDia = Math.ceil(restantes / dias);
    mensagem = `Leia ${porDia} capítulo${porDia > 1 ? "s" : ""} por dia para terminar a tempo.`;
  }
 
  return (
    <div className="rounded-2xl border border-amber-400/30 dark:border-amber-300/20 bg-amber-100/40 dark:bg-amber-300/5 px-6 py-6 mb-10">
      <div className="flex items-center justify-between mb-1">
        <span className="text-stone-700 dark:text-white/80 text-sm font-medium">
          Meta: {ESCOPO_LABELS[goal.escopo]}
        </span>
        <span className="text-amber-700 dark:text-amber-200 text-sm font-medium">
          até {formatDateBR(goal.data_alvo)}
        </span>
      </div>
 
      <p className="text-stone-600 dark:text-white/70 text-sm mb-4">{mensagem}</p>
 
      <p className="text-stone-500 dark:text-white/50 text-xs mb-4">
        {escopoTotals.read}/{escopoTotals.total} capítulos lidos · {restantes} restantes
      </p>
 
      <div className="flex gap-2">
        <button
          onClick={() => setEditing(true)}
          className="rounded-full border border-stone-300 dark:border-white/15 text-stone-500 dark:text-white/50 text-xs px-4 py-2 hover:text-stone-800 dark:hover:text-white/80 transition-colors"
        >
          Alterar meta
        </button>
        <button
          onClick={handleRemove}
          disabled={saving}
          className="rounded-full border border-stone-300 dark:border-white/15 text-stone-500 dark:text-white/50 text-xs px-4 py-2 hover:text-red-600 dark:hover:text-red-300 transition-colors disabled:opacity-50"
        >
          Remover meta
        </button>
      </div>
    </div>
  );
}
