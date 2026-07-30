import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { bookAbbreviations } from "../data/bookAbbreviations";

export default function ChapterTextPage() {
  const { book, chapter } = useParams();
  console.log("Parâmetros da URL:", book, chapter);
  const navigate = useNavigate();
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

        const chapterIndex = parseInt(chapter, 10) - 1;
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
  }, [book, chapter]);

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

        <h1 className="font-serif text-3xl sm:text-4xl text-white mb-8">
          {book} {chapter}
        </h1>

        {loading && <p className="text-white/60">Carregando...</p>}
        {error && <p className="text-red-400">{error}</p>}

        {!loading && !error && (
          <div className="space-y-3">
            {verses.map((text, index) => (
              <p key={index} className="text-white/80 leading-relaxed">
                <span className="text-amber-300 font-medium mr-2">{index + 1}</span>
                {text}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}