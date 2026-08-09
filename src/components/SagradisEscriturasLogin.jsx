import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Heart, TrendingUp, Bookmark, ChevronRight } from "lucide-react";
import { supabase } from "../lib/supabase";
import { getLastRead } from "../lib/readingProgress";

const DAILY_VERSES = [
  { book: "João", chapter: 3, verse: 16 },
  { book: "Salmos", chapter: 23, verse: 1 },
  { book: "Filipenses", chapter: 4, verse: 13 },
  { book: "Provérbios", chapter: 3, verse: 5 },
  { book: "Josué", chapter: 1, verse: 9 },
  { book: "Romanos", chapter: 8, verse: 28 },
  { book: "Isaías", chapter: 41, verse: 10 },
  { book: "Salmos", chapter: 46, verse: 1 },
  { book: "Mateus", chapter: 11, verse: 28 },
  { book: "2 Timóteo", chapter: 1, verse: 7 },
];

const features = [
  { icon: BookOpen, title: "Leitura", path: "/leitura" },
  { icon: Heart, title: "Favoritos", path: "/favoritos" },
  { icon: TrendingUp, title: "Progresso", path: "/progresso" },
];

export default function SagradisEscriturasLogin() {
  const navigate = useNavigate();
  const [verseText, setVerseText] = useState("");
  const [verseRef, setVerseRef] = useState(null);
  const [session, setSession] = useState(null);
  const [lastRead, setLastRead] = useState(null);

  useEffect(() => {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000
    );
    const picked = DAILY_VERSES[dayOfYear % DAILY_VERSES.length];
    setVerseRef(picked);

    fetch("/bible-nvi.json")
      .then((res) => res.json())
      .then((data) => {
        const abbrevMap = {
          "João": "jo", "Salmos": "sl", "Filipenses": "fp", "Provérbios": "pv",
          "Josué": "js", "Romanos": "rm", "Isaías": "is", "Mateus": "mt", "2 Timóteo": "2tm",
        };
        const bookData = data.find((b) => b.abbrev === abbrevMap[picked.book]);
        if (bookData) {
          const text = bookData.chapters[picked.chapter - 1]?.[picked.verse - 1];
          setVerseText(text || "");
        }
      });
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
  }, []);

  useEffect(() => {
    if (!session) return;
    getLastRead(session.user.id).then(setLastRead);
  }, [session]);

  return (
    <div
      className="min-h-screen w-full p-6 sm:p-10"
      style={{
        backgroundImage:
          "linear-gradient(135deg, #000000 0%, #0a1128 45%, #001233 100%)",
      }}
    >
      <div className="text-center max-w-3xl mx-auto pt-14">
        <div className="flex items-center justify-center gap-3">
          <BookOpen className="w-8 h-8 sm:w-9 sm:h-9 text-amber-300" strokeWidth={1.5} />
          <h1 className="font-serif font-bold text-5xl sm:text-6xl text-white tracking-wide">
            Bíblia sagrada
          </h1>
        </div>

        {verseRef && verseText && (
          <button
            onClick={() => navigate(`/leitura/${encodeURIComponent(verseRef.book)}/${verseRef.chapter}?v=${verseRef.verse}`)}
            className="block w-full text-left mt-10 rounded-2xl border border-white/10 bg-white/5 px-7 py-6 hover:bg-white/10 transition-colors"
          >
            <p className="text-white/40 text-xs tracking-widest uppercase mb-3">Versículo do dia</p>
            <p className="text-white/85 text-base leading-relaxed">
              {verseRef.book} {verseRef.chapter}:{verseRef.verse} — {verseText}
            </p>
          </button>
        )}

        {session && lastRead && (
          <button
            onClick={() => navigate(`/leitura/${encodeURIComponent(lastRead.livro)}/${lastRead.capitulo}`)}
            className="w-full flex items-center justify-between mt-4 rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-4 hover:bg-white/[0.06] transition-colors"
          >
            <span className="flex items-center gap-2 text-white/55 text-sm">
              <Bookmark className="w-3.5 h-3.5 text-amber-300/70" strokeWidth={1.5} />
              Continuar lendo · {lastRead.livro} {lastRead.capitulo}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-white/40" strokeWidth={1.5} />
          </button>
        )}

        <div className="grid grid-cols-3 gap-4 mt-10 max-w-2xl mx-auto">
          {features.map((feature) => (
            <button
              key={feature.title}
              onClick={() => navigate(feature.path)}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-7 hover:bg-white/10 transition-colors"
            >
              <feature.icon className="w-7 h-7 text-amber-300 mx-auto" strokeWidth={1.5} />
              <p className="text-white text-lg font-medium mt-3.5">{feature.title}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}