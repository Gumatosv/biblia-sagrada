import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { bookAbbreviations } from "../data/bookAbbreviations";
import { chapterCounts } from "../data/books";
import {
  isChapterRead,
  markChapterAsRead,
  markChapterAsUnread,
} from "../lib/readingProgress";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function ChapterTextPage() {
  const { book, chapter } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetVerse = parseInt(searchParams.get("v"), 10);
  const { session, refreshLastRead } = useAuth();
  const { theme } = useTheme();

  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isRead, setIsRead] = useState(false);
  const [savingProgress, setSavingProgress] = useState(false);

  const currentChapter = parseInt(chapter, 10);
  const totalChapters = chapterCounts[book];
  const hasPrevious = currentChapter > 1;
  const hasNext = currentChapter < totalChapters;

  useEffect(() => {
    const abbrev = bookAbbreviations[book];

    if (!abbrev) {
      setError("Livro não encontrado.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    fetch("/bible-nvi.json")
      .then((res) => {
        if (!res.ok) throw new Error("Não foi possível carregar a Bíblia.");
        return res.json();
      })
      .then((data) => {
        const bookData = data.find((b) => b.abbrev === abbrev);
        if (!bookData) {
          throw new Error("Livro não encontrado no arquivo.");
        }

        const chapterIndex = currentChapter - 1;
        const chapterVerses = bookData.chapters[chapterIndex];

        if (!chapterVerses) {
          throw new Error("Capítulo não encontrado.");
        }

        setVerses(chapterVerses);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [book, chapter, currentChapter]);

  useEffect(() => {
    if (!loading && !error && targetVerse) {
      const el = document.getElementById(`verse-${targetVerse}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [loading, error, targetVerse, verses]);

  useEffect(() => {
    if (!session) {
      setIsRead(false);
      return;
    }

    isChapterRead(session.user.id, book, currentChapter).then(setIsRead);
  }, [session, book, currentChapter]);

  async function handleToggleRead() {
    if (!session) {
      navigate("/login");
      return;
    }

    setSavingProgress(true);

    if (isRead) {
      const success = await markChapterAsUnread(session.user.id, book, currentChapter);
      if (success) setIsRead(false);
    } else {
      const success = await markChapterAsRead(session.user.id, book, currentChapter);
      if (success) setIsRead(true);
    }

    refreshLastRead();
    setSavingProgress(false);
  }

  function goToChapter(newChapter) {
    navigate(`/leitura/${encodeURIComponent(book)}/${newChapter}`);
    window.scrollTo(0, 0);
  }

  const backgroundStyle =
    theme === "dark"
      ? { backgroundImage: "linear-gradient(135deg, #000000 0%, #0a1128 45%, #001233 100%)" }
      : { backgroundImage: "linear-gradient(135deg, #fdfaf3 0%, #f7efdf 50%, #f5ead6 100%)" };

  return (
    <div className="min-h-screen w-full p-6 sm:p-10" style={backgroundStyle}>
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate(`/leitura/${encodeURIComponent(book)}`)}
          className="text-stone-500 dark:text-white/50 text-sm mb-6 hover:text-stone-800 dark:hover:text-white/80 transition-colors"
        >
          ← Voltar para capítulos
        </button>

        <div className="flex items-center justify-between mb-8 gap-4">
          <h1 className="font-serif text-3xl sm:text-4xl text-stone-900 dark:text-white">
            {book} {chapter}
          </h1>

          <button
            onClick={handleToggleRead}
            disabled={savingProgress}
            className={`flex items-center gap-2 text-sm rounded-full px-4 py-2.5 border transition-colors shrink-0 disabled:opacity-50 ${
              isRead
                ? "bg-amber-500/20 border-amber-400/40 text-amber-700 dark:text-amber-200"
                : "bg-white/60 dark:bg-white/5 border-stone-300 dark:border-white/15 text-stone-600 dark:text-white/70 hover:bg-white dark:hover:bg-white/10 hover:border-stone-400 dark:hover:border-white/30"
            }`}
          >
            <Check className="w-4 h-4" strokeWidth={2} />
            {isRead ? "Lido" : "Marcar como lido"}
          </button>
        </div>

        {loading && <p className="text-stone-500 dark:text-white/60">Carregando...</p>}
        {error && <p className="text-red-500 dark:text-red-400">{error}</p>}

        {!loading && !error && (
          <>
            <div className="space-y-3 mb-10">
              {verses.map((text, index) => {
                const verseNumber = index + 1;
                const isTarget = verseNumber === targetVerse;
                return (
                  <p
                    key={index}
                    id={`verse-${verseNumber}`}
                    className={`text-stone-800 dark:text-white/80 leading-relaxed rounded-lg transition-colors ${
                      isTarget ? "bg-amber-200/40 dark:bg-amber-300/10 -mx-3 px-3 py-2" : ""
                    }`}
                  >
                    <span className="text-amber-600 dark:text-amber-300 font-medium mr-2">{verseNumber}</span>
                    {text}
                  </p>
                );
              })}
            </div>

            <div className="flex items-center justify-between border-t border-stone-300 dark:border-white/10 pt-6">
              <button
                onClick={() => goToChapter(currentChapter - 1)}
                disabled={!hasPrevious}
                className="flex items-center gap-2 text-stone-700 dark:text-white/80 border border-stone-300 dark:border-white/15 bg-white/60 dark:bg-white/5 rounded-full px-5 py-2.5 hover:border-amber-400 dark:hover:border-amber-300/40 hover:bg-white dark:hover:bg-white/10 transition-colors disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
                Anterior
              </button>

              <button
                onClick={() => goToChapter(currentChapter + 1)}
                disabled={!hasNext}
                className="flex items-center gap-2 text-stone-700 dark:text-white/80 border border-stone-300 dark:border-white/15 bg-white/60 dark:bg-white/5 rounded-full px-5 py-2.5 hover:border-amber-400 dark:hover:border-amber-300/40 hover:bg-white dark:hover:bg-white/10 transition-colors disabled:opacity-30 disabled:pointer-events-none"
              >
                Próximo
                <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}