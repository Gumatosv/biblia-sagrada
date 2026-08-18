import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Lock, Eye, EyeOff, Calendar, CreditCard } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useTheme } from "../context/ThemeContext";

export default function SignupPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    sobrenome: "",
    email: "",
    password: "",
    cpf: "",
    dataNasc: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(field) {
    return (e) => setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const { nome, sobrenome, email, password, cpf, dataNasc } = formData;

    if (!nome || !sobrenome || !email || !password || !cpf || !dataNasc) {
      setError("Preencha todos os campos.");
      return;
    }

    setLoading(true);

    // Passo 1: cria o usuário (email + senha) no auth.users
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setLoading(false);
      setError(signUpError.message);
      return;
    }

    const userId = signUpData.user?.id;

    if (!userId) {
      setLoading(false);
      setError("Não foi possível criar a conta. Tente novamente.");
      return;
    }

    // Passo 2: insere os dados extras na tabela profile
    const { error: profileError } = await supabase.from("profile").insert({
      id: userId,
      nome,
      sobrenome,
      email,
      cpf,
      data_nasc: dataNasc,
    });

    setLoading(false);

    if (profileError) {
      setError("Conta criada, mas houve um erro ao salvar seus dados: " + profileError.message);
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
            Criar conta
          </h1>

          <div className="space-y-3 mb-2">
            <div className="flex items-center gap-3 rounded-full border border-stone-300 bg-white px-5 py-3.5 focus-within:border-amber-500">
              <User className="w-4 h-4 text-stone-400 shrink-0" />
              <input
                type="text"
                placeholder="Nome"
                value={formData.nome}
                onChange={handleChange("nome")}
                className="w-full bg-transparent outline-none text-stone-700 placeholder:text-stone-400 text-sm"
              />
            </div>

            <div className="flex items-center gap-3 rounded-full border border-stone-300 bg-white px-5 py-3.5 focus-within:border-amber-500">
              <User className="w-4 h-4 text-stone-400 shrink-0" />
              <input
                type="text"
                placeholder="Sobrenome"
                value={formData.sobrenome}
                onChange={handleChange("sobrenome")}
                className="w-full bg-transparent outline-none text-stone-700 placeholder:text-stone-400 text-sm"
              />
            </div>

            <div className="flex items-center gap-3 rounded-full border border-stone-300 bg-white px-5 py-3.5 focus-within:border-amber-500">
              <Mail className="w-4 h-4 text-stone-400 shrink-0" />
              <input
                type="email"
                placeholder="E-mail"
                value={formData.email}
                onChange={handleChange("email")}
                className="w-full bg-transparent outline-none text-stone-700 placeholder:text-stone-400 text-sm"
              />
            </div>

            <div className="flex items-center gap-3 rounded-full border border-stone-300 bg-white px-5 py-3.5 focus-within:border-amber-500">
              <Lock className="w-4 h-4 text-stone-400 shrink-0" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Senha"
                value={formData.password}
                onChange={handleChange("password")}
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

            <div className="flex items-center gap-3 rounded-full border border-stone-300 bg-white px-5 py-3.5 focus-within:border-amber-500">
              <CreditCard className="w-4 h-4 text-stone-400 shrink-0" />
              <input
                type="text"
                placeholder="CPF"
                value={formData.cpf}
                onChange={handleChange("cpf")}
                className="w-full bg-transparent outline-none text-stone-700 placeholder:text-stone-400 text-sm"
              />
            </div>

            <div className="flex items-center gap-3 rounded-full border border-stone-300 bg-white px-5 py-3.5 focus-within:border-amber-500">
              <Calendar className="w-4 h-4 text-stone-400 shrink-0" />
              <input
                type="date"
                value={formData.dataNasc}
                onChange={handleChange("dataNasc")}
                className="w-full bg-transparent outline-none text-stone-700 placeholder:text-stone-400 text-sm"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm mt-3 mb-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 rounded-full bg-stone-800 hover:bg-stone-900 disabled:opacity-50 text-white font-medium tracking-wide py-3.5 transition-colors"
          >
            {loading ? "Criando conta..." : "CRIAR CONTA"}
          </button>

          <p className="text-center text-sm text-stone-600 mt-7">
            Já tem conta?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-amber-700 underline underline-offset-2 hover:text-amber-800 font-medium"
            >
              Entrar
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}