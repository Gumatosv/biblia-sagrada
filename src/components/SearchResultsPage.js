import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { searchVerses } from "../utils/verseSearch";
import SearchBar from "./SearchBar";

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!query) {
      setResults([]);
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
        setResults(searchVerses(query, data));
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [query]);

  function handleNewSearch(newQuery) {
    setSearchParams({ q: newQuery });
  }

  function goToVerse(result) {
    navigate(`/leitura/${encodeURIComponent(result.book)}/${result.chapter}?v=${result.verse}`);
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
          onClick={() => navigate("/")}
          className="text-white/50 text-sm mb-6 hover:text-white/80 transition-colors"
        >
          ← Voltar
        </button>

        <h1 className="font-serif text-3xl sm:text-4xl text-white mb-6">
          Resultados para "{query}"
        </h1>

        <SearchBar onSearch={handleNewSearch} />

        <div className="mt-10 space-y-4">
          {loading && <p className="text-white/60">Buscando...</p>}
          {error && <p className="text-red-400">{error}</p>}
          {!loading && !error && results.length === 0 && (
            <p className="text-white/60">Nenhum versículo encontrado.</p>
          )}

          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => goToVerse(r)}
              className="block w-full text-left rounded-2xl border border-white/10 bg-white/5 px-5 py-4 hover:border-amber-300/40 hover:bg-white/10 transition-colors"
            >
              <p className="text-amber-200 text-sm font-medium mb-1">
                {r.book} {r.chapter}:{r.verse}
              </p>
              <p className="text-white/80 text-sm leading-relaxed">{r.text}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}