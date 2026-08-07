import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function UserMenu() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    setOpen(false);
    navigate("/");
  }

  function goTo(path) {
    setOpen(false);
    navigate(path);
  }

  return (
    <div ref={menuRef} className="fixed top-6 left-6 z-50">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-11 h-11 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
      >
        <User className="w-5 h-5 text-white" strokeWidth={1.5} />
      </button>

      {open && (
        <div className="absolute top-14 left-0 w-48 rounded-xl border border-white/15 bg-[#0a1128]/95 backdrop-blur-sm shadow-xl overflow-hidden">
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
                onClick={() => goTo("/login")}
                className="w-full text-left px-4 py-3 text-sm text-white/80 hover:bg-white/10 transition-colors"
              >
                Entrar
              </button>
              <button
                onClick={() => goTo("/cadastro")}
                className="w-full text-left px-4 py-3 text-sm text-white/80 hover:bg-white/10 transition-colors border-t border-white/10"
              >
                Cadastrar
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}