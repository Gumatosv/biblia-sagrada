import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { bookAbbreviations } from "../data/bookAbbreviations";
import { chapterCounts } from "../data/books";
import { supabase } from "../lib/supabase";
import {
  isChapterRead,
  markChapterAsRead,
  markChapterAsUnread,
} from "../lib/readingProgress";

export default function ChapterTextPage() {
  const { book, chapter } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetVerse = parseInt(searchParams.get("v"), 10);

  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [session, setSession] = useState(null);
  const [isRead, setIsRead] = useState(false);
  const [savingProgress, setSavingProgress] = useState(false);

  const currentChapter = parseInt(chapter, 10);
  const totalChapters = chapterCounts[book];
  const hasPrevious = currentChapter > 1;
  const hasNext = currentChapter < totalChapters;

  // Busca o texto do capítulo
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

  // Rola até o versículo buscado
  useEffect(() => {
    if (!loading && !error && targetVerse) {
      const el = document.getElementById(`verse-${targetVerse}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [loading, error, targetVerse, verses]);

  // Verifica se o usuário está logado
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Verifica se esse capítulo já foi lido (só se estiver logado)
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

    setSavingProgress(false);
  }

  function goToChapter(newChapter) {
    navigate(`/leitura/${encodeURIComponent(book)}/${newChapter}`);
    window.scrollTo(0, 0);
  }

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
          onClick={() => navigate(`/leitura/${encodeURIComponent(book)}`)}
          className="text-white/50 text-sm mb-6 hover:text-white/80 transition-colors"
        >
          ← Voltar para capítulos
        </button>

        <div className="flex items-center justify-between mb-8 gap-4">
          <h1 className="font-serif text-3xl sm:text-4xl text-white">
            {book} {chapter}
          </h1>

          <button
            onClick={handleToggleRead}
            disabled={savingProgress}
            className={`flex items-center gap-2 text-sm rounded-full px-4 py-2.5 border transition-colors shrink-0 disabled:opacity-50 ${
              isRead
                ? "bg-amber-500/20 border-amber-400/40 text-amber-200"
                : "bg-white/5 border-white/15 text-white/70 hover:bg-white/10 hover:border-white/30"
            }`}
          >
            <Check className="w-4 h-4" strokeWidth={2} />
            {isRead ? "Lido" : "Marcar como lido"}
          </button>
        </div>

        {loading && <p className="text-white/60">Carregando...</p>}
        {error && <p className="text-red-400">{error}</p>}

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
                    className={`text-white/80 leading-relaxed rounded-lg transition-colors ${
                      isTarget ? "bg-amber-300/10 -mx-3 px-3 py-2" : ""
                    }`}
                  >
                    <span className="text-amber-300 font-medium mr-2">{verseNumber}</span>
                    {text}
                  </p>
                );
              })}
            </div>

            <div className="flex items-center justify-between border-t border-white/10 pt-6">
              <button
                onClick={() => goToChapter(currentChapter - 1)}
                disabled={!hasPrevious}
                className="flex items-center gap-2 text-white/80 border border-white/15 bg-white/5 rounded-full px-5 py-2.5 hover:border-amber-300/40 hover:bg-white/10 transition-colors disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
                Anterior
              </button>

              <button
                onClick={() => goToChapter(currentChapter + 1)}
                disabled={!hasNext}
                className="flex items-center gap-2 text-white/80 border border-white/15 bg-white/5 rounded-full px-5 py-2.5 hover:border-amber-300/40 hover:bg-white/10 transition-colors disabled:opacity-30 disabled:pointer-events-none"
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