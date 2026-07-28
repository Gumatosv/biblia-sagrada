import { Search } from "lucide-react";
import { useState } from "react";

export default function SearchBar({ onSearch }) {
  const [query, setQuery] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 max-w-xl w-full mx-auto mt-10 rounded-full border border-white/15 bg-white/5 backdrop-blur-sm px-5 py-3 transition-colors focus-within:border-amber-300/40"
    >
      <Search className="w-5 h-5 text-white/50 shrink-0" strokeWidth={1.5} />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar por versículo, capítulo ou livro..."
        className="flex-1 bg-transparent text-white placeholder-white/40 outline-none text-sm sm:text-base"
      />
      <button
        type="submit"
        className="text-sm text-amber-200 border border-amber-300/30 rounded-full px-4 py-1.5 hover:bg-amber-300/10 transition-colors shrink-0"
      >
        Buscar
      </button>
    </form>
  );
}