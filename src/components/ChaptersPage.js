import { useParams, useNavigate } from "react-router-dom";
import { chapterCounts } from "../data/books";

export default function ChaptersPage() {
  const { book } = useParams();
  const navigate = useNavigate();

  const totalChapters = chapterCounts[book];
  const chapters = Array.from({ length: totalChapters }, (_, i) => i + 1);

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
          onClick={() => navigate("/leitura")}
          className="text-white/50 text-sm mb-6 hover:text-white/80 transition-colors"
        >
          ← Voltar para livros
        </button>
        <h1 className="font-serif text-3xl sm:text-4xl text-white mb-8">
          {book}
        </h1>

        <div className="grid grid-cols-5 sm:grid-cols-8 gap-3">
          {chapters.map((chapter) => (
            <button
              key={chapter}
              onClick={() => navigate(`/leitura/${encodeURIComponent(book)}/${chapter}`)}
              className="aspect-square flex items-center justify-center text-white/80 border border-white/15 bg-white/5 rounded-lg hover:border-amber-300/40 hover:bg-white/10 transition-colors"
            >
              {chapter}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}