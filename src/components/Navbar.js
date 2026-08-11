import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Home, BookOpen, Search, Sun, Moon } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function Navbar() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    setMenuOpen(false);
    navigate("/");
  }

  function handleSearch(e) {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/pesquisa?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <div className="w-full bg-[#f7efdf] dark:bg-[#0d1b3d] border-b border-stone-300 dark:border-white/10">
      <div className="relative w-full px-4 sm:px-8 py-4 flex items-center">
        <div className="flex items-center gap-3 relative z-10" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="text-stone-700 dark:text-white/80 hover:text-stone-900 dark:hover:text-white transition-colors"
          >
            <Menu className="w-6 h-6" strokeWidth={1.5} />
          </button>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >
            <BookOpen className="w-5 h-5 text-stone-800 dark:text-white" strokeWidth={1.5} />
            <span className="font-serif font-bold text-stone-800 dark:text-white text-lg sm:text-xl">Bibliavida</span>
          </button>

          {menuOpen && (
            <div className="absolute top-10 left-0 w-52 rounded-xl border border-stone-300 dark:border-white/15 bg-white dark:bg-[#0a1128] shadow-xl overflow-hidden z-50">
              {session ? (
                <>
                  <p className="px-4 py-3 text-xs text-stone-500 dark:text-white/50 border-b border-stone-200 dark:border-white/10 truncate">
                    {session.user.email}
                  </p>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-sm text-stone-700 dark:text-white/80 hover:bg-stone-100 dark:hover:bg-white/10 transition-colors"
                  >
                    Sair
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setMenuOpen(false); navigate("/login"); }}
                    className="w-full text-left px-4 py-3 text-sm text-stone-700 dark:text-white/80 hover:bg-stone-100 dark:hover:bg-white/10 transition-colors"
                  >
                    Entrar
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); navigate("/cadastro"); }}
                    className="w-full text-left px-4 py-3 text-sm text-stone-700 dark:text-white/80 hover:bg-stone-100 dark:hover:bg-white/10 transition-colors border-t border-stone-200 dark:border-white/10"
                  >
                    Cadastrar
                  </button>
                </>
              )}
              <button
                onClick={() => { setMenuOpen(false); navigate("/progresso"); }}
                className="w-full text-left px-4 py-3 text-sm text-stone-700 dark:text-white/80 hover:bg-stone-100 dark:hover:bg-white/10 transition-colors border-t border-stone-200 dark:border-white/10"
              >
                Progresso
              </button>
              <button
                onClick={toggleTheme}
                className="w-full flex items-center gap-2 text-left px-4 py-3 text-sm text-stone-700 dark:text-white/80 hover:bg-stone-100 dark:hover:bg-white/10 transition-colors border-t border-stone-200 dark:border-white/10"
              >
                {theme === "dark" ? (
                  <>
                    <Sun className="w-4 h-4" strokeWidth={1.5} />
                    Modo claro
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4" strokeWidth={1.5} />
                    Modo escuro
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <form
          onSubmit={handleSearch}
          className="hidden sm:flex items-center gap-2 w-full max-w-xs absolute left-1/2 -translate-x-1/2 rounded-full border border-stone-300 dark:border-white/10 bg-white/70 dark:bg-white/5 px-4 py-2.5"
        >
          <Search className="w-4 h-4 text-stone-400 dark:text-white/40 shrink-0" strokeWidth={1.5} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar..."
            className="flex-1 bg-transparent outline-none text-stone-800 dark:text-white text-sm placeholder:text-stone-400 dark:placeholder:text-white/35"
          />
        </form>
      </div>
    </div>
  );
}