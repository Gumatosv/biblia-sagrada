import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { oldTestament, newTestament } from "../data/books";

function CategoryAccordion({ category, books }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-3 border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition-colors"
      >
        <span className="text-white/80 text-sm font-medium">{category}</span>
        <ChevronDown
          className={`w-4 h-4 text-white/50 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          strokeWidth={1.5}
        />
      </button>

      {isOpen && (
        <div className="flex flex-wrap gap-2 px-4 pb-4">
          {books.map((book) => (
            <BookButton key={book} name={book} />
          ))}
        </div>
      )}
    </div>
  );
}

function BookButton({ name }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/leitura/${encodeURIComponent(name)}`)}
      className="text-sm text-white/80 border border-white/15 bg-white/5 rounded-full px-4 py-2 hover:border-amber-300/40 hover:bg-white/10 transition-colors"
    >
      {name}
    </button>
  );
}

function BookSection({ testamentTitle, categories }) {
  return (
    <div className="mb-10">
      <h2 className="text-sm font-medium text-amber-200 tracking-widest uppercase mb-4">
        {testamentTitle}
      </h2>
      {Object.entries(categories).map(([category, books]) => (
        <CategoryAccordion key={category} category={category} books={books} />
      ))}
    </div>
  );
}

export default function BooksPage() {
  const navigate = useNavigate();

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
          Escolha um livro
        </h1>

        <BookSection testamentTitle="Antigo testamento" categories={oldTestament} />
        <BookSection testamentTitle="Novo testamento" categories={newTestament} />
      </div>
    </div>
  );
}