import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, Eye, EyeOff } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useTheme } from "../context/ThemeContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Preencha e-mail e senha.");
      return;
    }

    setLoading(true);

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (loginError) {
      setError("E-mail ou senha incorretos.");
      return;
    }

    navigate("/");
  }

  const backgroundStyle =
    theme === "dark"
      ? { backgroundImage: "linear-gradient(135deg, #000000 0%, #0a1128 45%, #001233 100%)" }
      : { backgroundImage: "linear-gradient(135deg, #fdfaf3 0%, #f7efdf 50%, #f5ead6 100%)" };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6" style={backgroundStyle}>
      <div className="w-full max-w-md">
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl bg-[#fbfaf8]/95 backdrop-blur-sm shadow-2xl px-8 py-10 sm:px-10 sm:py-12"
        >
          <h1 className="font-serif text-4xl text-stone-900 mb-8">
            Bem-vindo de volta
          </h1>

          <div className="mb-4">
            <div className="flex items-center gap-3 rounded-full border border-stone-300 bg-white px-5 py-3.5 focus-within:border-amber-500">
              <User className="w-4 h-4 text-stone-400 shrink-0" />
              <input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent outline-none text-stone-700 placeholder:text-stone-400 text-sm"
              />
            </div>
          </div>

          <div className="mb-2">
            <div className="flex items-center gap-3 rounded-full border border-stone-300 bg-white px-5 py-3.5 focus-within:border-amber-500">
              <Lock className="w-4 h-4 text-stone-400 shrink-0" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent outline-none text-stone-700 placeholder:text-stone-400 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="text-stone-400 hover:text-stone-600 shrink-0"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm mt-2 mb-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 rounded-full bg-stone-800 hover:bg-stone-900 disabled:opacity-50 text-white font-medium tracking-wide py-3.5 transition-colors"
          >
            {loading ? "Entrando..." : "ENTRAR"}
          </button>

          <p className="text-center text-sm text-stone-600 mt-7">
            Não tem conta?{" "}
            <button
              type="button"
              onClick={() => navigate("/cadastro")}
              className="text-amber-700 underline underline-offset-2 hover:text-amber-800 font-medium"
            >
              Crie uma aqui
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}