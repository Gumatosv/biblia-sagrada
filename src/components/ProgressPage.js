import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import {
  getAllReadChapters,
  markBookAsRead,
  markBookAsUnread,
  markChapterAsRead,
  markChapterAsUnread,
} from "../lib/readingProgress";
import { oldTestament, newTestament, chapterCounts } from "../data/books";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import ReadingGoalCard from "./ReadingGoalCard";
 
function BookProgress({ book, readChapters, total, onToggleChapter, onToggleBook }) {
  const [isOpen, setIsOpen] = useState(false);
  const [savingBook, setSavingBook] = useState(false);
  const [pendingChapters, setPendingChapters] = useState(new Set());
 
  const readSet = new Set(readChapters);
  const readCount = readSet.size;
  const percent = total > 0 ? Math.round((readCount / total) * 100) : 0;
  const isFullyRead = readCount === total;
 
  const allChapters = Array.from({ length: total }, (_, i) => i + 1);
 
  async function handleToggleBook() {
    setSavingBook(true);
    await onToggleBook(book, isFullyRead, total);
    setSavingBook(false);
  }
 
  async function handleToggleChapter(chapter) {
    if (pendingChapters.has(chapter)) return;
 
    setPendingChapters((prev) => new Set(prev).add(chapter));
    try {
      await onToggleChapter(book, chapter, readSet.has(chapter));
    } finally {
      setPendingChapters((prev) => {
        const next = new Set(prev);
        next.delete(chapter);
        return next;
      });
    }
  }
 
  return (
    <div className="mb-3 border border-stone-300 dark:border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-stone-100 dark:hover:bg-white/5 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-stone-700 dark:text-white/80 text-sm font-medium truncate">{book}</span>
            <span className="text-stone-500 dark:text-white/50 text-xs shrink-0 ml-3">
              {readCount}/{total} ({percent}%)
            </span>
          </div>
          <div className="w-full h-1.5 bg-stone-200 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-stone-400 dark:text-white/50 ml-4 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          strokeWidth={1.5}
        />
      </button>
 
      {isOpen && (
        <div className="px-4 pb-4">
          <button
            onClick={handleToggleBook}
            disabled={savingBook}
            className={`w-full text-xs rounded-full px-4 py-2 border mb-3 transition-colors disabled:opacity-50 ${
              isFullyRead
                ? "bg-amber-500/20 border-amber-400/40 text-amber-700 dark:text-amber-200"
                : "bg-white/60 dark:bg-white/5 border-stone-300 dark:border-white/15 text-stone-600 dark:text-white/70 hover:bg-white dark:hover:bg-white/10"
            }`}
          >
            {savingBook
              ? "Salvando..."
              : isFullyRead
              ? "✓ Livro inteiro lido"
              : "Marcar livro inteiro como lido"}
          </button>
 
          <div className="flex flex-wrap gap-2">
            {allChapters.map((chapter) => {
              const read = readSet.has(chapter);
              const isPending = pendingChapters.has(chapter);
              return (
                <button
                  key={chapter}
                  onClick={() => handleToggleChapter(chapter)}
                  disabled={isPending}
                  className={`text-xs w-8 h-8 flex items-center justify-center rounded-full border transition-colors disabled:opacity-50 ${
                    read
                      ? "bg-amber-400/20 border-amber-400/40 text-amber-700 dark:text-amber-200 hover:bg-amber-400/30"
                      : "bg-white/60 dark:bg-white/5 border-stone-300 dark:border-white/10 text-stone-400 dark:text-white/40 hover:bg-white dark:hover:bg-white/10 hover:text-stone-600 dark:hover:text-white/60"
                  }`}
                >
                  {chapter}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
 
function TestamentSection({ title, categories, readData, onToggleChapter, onToggleBook }) {
  const [isOpen, setIsOpen] = useState(false);
  const books = Object.values(categories).flat();
 
  const totalChapters = books.reduce((sum, book) => sum + chapterCounts[book], 0);
  const readChapters = books.reduce(
    (sum, book) => sum + (readData[book] || []).length,
    0
  );
  const percent = totalChapters > 0 ? Math.round((readChapters / totalChapters) * 100) : 0;
 
  return (
    <div className="mb-6 border border-stone-300 dark:border-white/10 rounded-2xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-stone-100 dark:hover:bg-white/5 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-amber-600 dark:text-amber-200 text-sm font-medium tracking-widest uppercase">
              {title}
            </span>
            <span className="text-stone-500 dark:text-white/50 text-xs shrink-0 ml-3">
              {readChapters}/{totalChapters} ({percent}%)
            </span>
          </div>
          <div className="w-full h-2 bg-stone-200 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-stone-400 dark:text-white/50 ml-4 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          strokeWidth={1.5}
        />
      </button>
 
      {isOpen && (
        <div className="px-5 pb-5">
          {books.map((book) => (
            <BookProgress
              key={book}
              book={book}
              readChapters={readData[book] || []}
              total={chapterCounts[book]}
              onToggleChapter={onToggleChapter}
              onToggleBook={onToggleBook}
            />
          ))}
        </div>
      )}
    </div>
  );
}
 
export default function ProgressPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { theme } = useTheme();
  const [readData, setReadData] = useState({});
  const [loading, setLoading] = useState(true);
 
  // Guarda a versão mais recente do userId, útil para evitar
  // condições de corrida vindas de chamadas antigas.
  const userIdRef = useRef(null);
 
  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }
 
    userIdRef.current = session.user.id;
    setLoading(true);
    getAllReadChapters(session.user.id).then((data) => {
      // só aplica se ainda for o mesmo usuário (evita corrida em troca de sessão)
      if (userIdRef.current === session.user.id) {
        setReadData(data);
        setLoading(false);
      }
    });
  }, [session]);
 
  // Único ponto que atualiza o estado local (fonte única de verdade).
  // Grava no banco em segundo plano; se falhar, reverte.
  async function handleToggleChapter(book, chapter, wasRead) {
    const userId = session.user.id;
 
    // 1) Atualização otimista imediata no estado do PAI
    setReadData((prev) => {
      const current = prev[book] || [];
      const updated = wasRead
        ? current.filter((c) => c !== chapter)
        : [...current, chapter];
      return { ...prev, [book]: updated };
    });
 
    // 2) Grava no banco
    const ok = wasRead
      ? await markChapterAsUnread(userId, book, chapter)
      : await markChapterAsRead(userId, book, chapter);
 
    // 3) Se falhar, reverte
    if (!ok) {
      setReadData((prev) => {
        const current = prev[book] || [];
        const reverted = wasRead
          ? [...current, chapter]
          : current.filter((c) => c !== chapter);
        return { ...prev, [book]: reverted };
      });
    }
  }
 
  async function handleToggleBook(book, isFullyRead, total) {
    const userId = session.user.id;
    const previous = readData[book] || [];
 
    // 1) Atualização otimista
    setReadData((prev) => ({
      ...prev,
      [book]: isFullyRead ? [] : Array.from({ length: total }, (_, i) => i + 1),
    }));
 
    // 2) Grava no banco
    const ok = isFullyRead
      ? await markBookAsUnread(userId, book)
      : await markBookAsRead(userId, book, total);
 
    // 3) Se falhar, reverte
    if (!ok) {
      setReadData((prev) => ({ ...prev, [book]: previous }));
    }
  }
 
  // Totais gerais (Bíblia inteira)
  const totalChaptersInBible = Object.values(chapterCounts).reduce((sum, n) => sum + n, 0);
  const totalRead = Object.values(readData).reduce((sum, chapters) => sum + chapters.length, 0);
  const overallPercent =
    totalChaptersInBible > 0 ? Math.round((totalRead / totalChaptersInBible) * 100) : 0;
  const totalBooks = Object.keys(chapterCounts).length;
  const booksRead = Object.keys(chapterCounts).filter(
    (book) => (readData[book]?.length || 0) === chapterCounts[book]
  ).length;
 
  // Totais por testamento, usados pelo card de meta de leitura
  function totalsForCategories(categories) {
    const books = Object.values(categories).flat();
    const total = books.reduce((sum, book) => sum + chapterCounts[book], 0);
    const read = books.reduce((sum, book) => sum + (readData[book] || []).length, 0);
    return { total, read };
  }
 
  const goalTotals = {
    biblia: { total: totalChaptersInBible, read: totalRead },
    antigo: totalsForCategories(oldTestament),
    novo: totalsForCategories(newTestament),
  };
 
  const backgroundStyle =
    theme === "dark"
      ? { backgroundImage: "linear-gradient(135deg, #000000 0%, #0a1128 45%, #001233 100%)" }
      : { backgroundImage: "linear-gradient(135deg, #fdfaf3 0%, #f7efdf 50%, #f5ead6 100%)" };
 
  return (
    <div className="min-h-screen w-full p-6 sm:p-10" style={backgroundStyle}>
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate("/")}
          className="text-stone-500 dark:text-white/50 text-sm mb-6 hover:text-stone-800 dark:hover:text-white/80 transition-colors"
        >
          ← Voltar
        </button>
 
        <h1 className="font-serif text-3xl sm:text-4xl text-stone-900 dark:text-white mb-8">
          Seu progresso
        </h1>
 
        {!session && (
          <div className="rounded-2xl border border-stone-300 dark:border-white/10 bg-white/60 dark:bg-white/5 px-6 py-8 text-center">
            <p className="text-stone-600 dark:text-white/70 mb-4">
              Faça login para acompanhar seu progresso de leitura.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="rounded-full border border-stone-300 dark:border-white/10 text-stone-500 dark:text-white/40 font-normal tracking-wide px-6 py-2.5 hover:text-stone-800 dark:hover:text-white/60 hover:border-stone-400 dark:hover:border-white/20 transition-colors"
            >
              Entrar
            </button>
          </div>
        )}
 
        {session && loading && <p className="text-stone-500 dark:text-white/60">Carregando...</p>}
 
        {session && !loading && (
          <>
            <div className="rounded-2xl border border-amber-400/30 dark:border-amber-300/20 bg-amber-100/40 dark:bg-amber-300/5 px-6 py-6 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-stone-700 dark:text-white/80 text-sm font-medium">Progresso total da Bíblia</span>
                <span className="text-amber-700 dark:text-amber-200 text-sm font-medium">
                  {totalRead}/{totalChaptersInBible} ({overallPercent}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-stone-200 dark:bg-white/10 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all"
                  style={{ width: `${overallPercent}%` }}
                />
              </div>
              <p className="text-stone-500 dark:text-white/50 text-xs">
                {booksRead}/{totalBooks} livros concluídos
              </p>
            </div>
 
            <ReadingGoalCard userId={session.user.id} totals={goalTotals} />
 
            <TestamentSection
              title="Antigo testamento"
              categories={oldTestament}
              readData={readData}
              onToggleChapter={handleToggleChapter}
              onToggleBook={handleToggleBook}
            />
            <TestamentSection
              title="Novo testamento"
              categories={newTestament}
              readData={readData}
              onToggleChapter={handleToggleChapter}
              onToggleBook={handleToggleBook}
            />
          </>
        )}
      </div>
    </div>
  );
}