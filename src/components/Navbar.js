import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, BookOpen, Search } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function Navbar() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const menuRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

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
    <div className="w-full bg-[#0d1b3d] border-b border-white/10">
      <div className="relative w-full px-4 sm:px-8 py-4 flex items-center">
        <div className="flex items-center gap-3 relative z-10" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="text-white/80 hover:text-white transition-colors"
          >
            <Menu className="w-6 h-6" strokeWidth={1.5} />
          </button>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >
            <BookOpen className="w-5 h-5 text-white" strokeWidth={1.5} />
            <span className="font-serif font-bold text-white text-lg sm:text-xl">Bibliavida</span>
          </button>

          {menuOpen && (
            <div className="absolute top-10 left-0 w-52 rounded-xl border border-white/15 bg-[#0a1128] shadow-xl overflow-hidden z-50">
              {session ? (
                <>
                  <p className="px-4 py-3 text-xs text-white/50 border-b border-white/10 truncate">
                    {session.user.email}
                  </p>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-sm text-white/80 hover:bg-white/10 transition-colors"
                  >
                    Sair
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setMenuOpen(false); navigate("/login"); }}
                    className="w-full text-left px-4 py-3 text-sm text-white/80 hover:bg-white/10 transition-colors"
                  >
                    Entrar
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); navigate("/cadastro"); }}
                    className="w-full text-left px-4 py-3 text-sm text-white/80 hover:bg-white/10 transition-colors border-t border-white/10"
                  >
                    Cadastrar
                  </button>
                </>
              )}
              <button
                onClick={() => { setMenuOpen(false); navigate("/progresso"); }}
                className="w-full text-left px-4 py-3 text-sm text-white/80 hover:bg-white/10 transition-colors border-t border-white/10"
              >
                Progresso
              </button>
            </div>
          )}
        </div>

        <form
          onSubmit={handleSearch}
          className="hidden sm:flex items-center gap-2 w-full max-w-xs absolute left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5"
        >
          <Search className="w-4 h-4 text-white/40 shrink-0" strokeWidth={1.5} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar..."
            className="flex-1 bg-transparent outline-none text-white text-sm placeholder:text-white/35"
          />
        </form>
      </div>
    </div>
  );
}