import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { supabase } from "../lib/supabase";
import {
  getAllReadChapters,
  markBookAsRead,
  markBookAsUnread,
  markChapterAsRead,
  markChapterAsUnread,
} from "../lib/readingProgress";
import { oldTestament, newTestament, chapterCounts } from "../data/books";

function BookProgress({ book, readChapters, total, userId, onBookToggled }) {
  const [isOpen, setIsOpen] = useState(false);
  const [savingBook, setSavingBook] = useState(false);

  const readCount = readChapters.length;
  const percent = total > 0 ? Math.round((readCount / total) * 100) : 0;
  const readSet = new Set(readChapters);
  const isFullyRead = readCount === total;

  const allChapters = Array.from({ length: total }, (_, i) => i + 1);

  async function handleToggleBook() {
    setSavingBook(true);

    if (isFullyRead) {
      await markBookAsUnread(userId, book);
    } else {
      await markBookAsRead(userId, book, total);
    }

    await onBookToggled();
    setSavingBook(false);
  }

  async function handleToggleChapter(chapter) {
    const isRead = readSet.has(chapter);

    if (isRead) {
      await markChapterAsUnread(userId, book, chapter);
    } else {
      await markChapterAsRead(userId, book, chapter);
    }

    await onBookToggled();
  }

  return (
    <div className="mb-3 border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-white/80 text-sm font-medium truncate">{book}</span>
            <span className="text-white/50 text-xs shrink-0 ml-3">
              {readCount}/{total} ({percent}%)
            </span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-white/50 ml-4 shrink-0 transition-transform duration-200 ${
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
                ? "bg-amber-500/20 border-amber-400/40 text-amber-200"
                : "bg-white/5 border-white/15 text-white/70 hover:bg-white/10"
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
              return (
                <button
                  key={chapter}
                  onClick={() => handleToggleChapter(chapter)}
                  className={`text-xs w-8 h-8 flex items-center justify-center rounded-full border transition-colors ${
                    read
                      ? "bg-amber-400/20 border-amber-400/40 text-amber-200 hover:bg-amber-400/30"
                      : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white/60"
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

function TestamentSection({ title, categories, readData, userId, onBookToggled }) {
  const [isOpen, setIsOpen] = useState(false);
  const books = Object.values(categories).flat();

  const totalChapters = books.reduce((sum, book) => sum + chapterCounts[book], 0);
  const readChapters = books.reduce(
    (sum, book) => sum + (readData[book] || []).length,
    0
  );
  const percent = totalChapters > 0 ? Math.round((readChapters / totalChapters) * 100) : 0;

  return (
    <div className="mb-6 border border-white/10 rounded-2xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-amber-200 text-sm font-medium tracking-widest uppercase">
              {title}
            </span>
            <span className="text-white/50 text-xs shrink-0 ml-3">
              {readChapters}/{totalChapters} ({percent}%)
            </span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-white/50 ml-4 shrink-0 transition-transform duration-200 ${
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
              userId={userId}
              onBookToggled={onBookToggled}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProgressPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [readData, setReadData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) {
        setLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    if (!session) return;

    setLoading(true);
    getAllReadChapters(session.user.id).then((data) => {
      setReadData(data);
      setLoading(false);
    });
  }, [session]);

  async function refreshProgress() {
    if (!session) return;
    const data = await getAllReadChapters(session.user.id);
    setReadData(data);
  }

  const totalChaptersInBible = Object.values(chapterCounts).reduce((sum, n) => sum + n, 0);
  const totalRead = Object.values(readData).reduce((sum, chapters) => sum + chapters.length, 0);
  const overallPercent =
    totalChaptersInBible > 0 ? Math.round((totalRead / totalChaptersInBible) * 100) : 0;

  return (
    <div
      className="min-h-screen w-full p-6 sm:p-10"
      style={{
        backgroundImage:
          "linear-gradient(135deg, #000000 0%, #0a1128 45%, #001233 100%)",
      }}
    >
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate("/")}
          className="text-white/50 text-sm mb-6 hover:text-white/80 transition-colors"
        >
          ← Voltar
        </button>

        <h1 className="font-serif text-3xl sm:text-4xl text-white mb-8">
          Seu progresso
        </h1>

        {!session && (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-8 text-center">
            <p className="text-white/70 mb-4">
              Faça login para acompanhar seu progresso de leitura.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="rounded-full border border-white/10 text-white/40 font-normal tracking-wide px-6 py-2.5 hover:text-white/60 hover:border-white/20 transition-colors"
            >
              Entrar
            </button>
          </div>
        )}

        {session && loading && <p className="text-white/60">Carregando...</p>}

        {session && !loading && (
          <>
            {/* Progresso geral */}
            <div className="rounded-2xl border border-amber-300/20 bg-amber-300/5 px-6 py-6 mb-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/80 text-sm font-medium">Progresso total da Bíblia</span>
                <span className="text-amber-200 text-sm font-medium">
                  {totalRead}/{totalChaptersInBible} ({overallPercent}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all"
                  style={{ width: `${overallPercent}%` }}
                />
              </div>
            </div>

            <TestamentSection
              title="Antigo testamento"
              categories={oldTestament}
              readData={readData}
              userId={session.user.id}
              onBookToggled={refreshProgress}
            />
            <TestamentSection
              title="Novo testamento"
              categories={newTestament}
              readData={readData}
              userId={session.user.id}
              onBookToggled={refreshProgress}
            />
          </>
        )}
      </div>
    </div>
  );
}