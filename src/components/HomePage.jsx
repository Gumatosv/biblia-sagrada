import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, BookOpen, Bookmark, Search, TrendingUp, Sun } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import dailyVerses from "../data/dailyVerses.json";
import "./HomePage.css";

function dailyVerse(date) {
  const day = Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(date.getFullYear(), 0, 0)) / 86400000);
  return dailyVerses[day % dailyVerses.length];
}

export default function HomePage() {
  const { session, lastRead } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [verse, setVerse] = useState(() => dailyVerse(new Date()));
  useEffect(() => {
    const refresh = () => setVerse(dailyVerse(new Date()));
    const interval = window.setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);
    return () => { window.clearInterval(interval); window.removeEventListener("focus", refresh); };
  }, []);
  const versePath = `/leitura/${encodeURIComponent(verse.book)}/${verse.chapter}?v=${verse.verse}`;
  const continuePath = session && lastRead
    ? `/leitura/${encodeURIComponent(lastRead.livro)}/${lastRead.capitulo}` : "/leitura";

  function search(event) {
    event.preventDefault();
    if (query.trim()) navigate(`/pesquisa?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <main className="home-page" id="conteudo">
      <div className="home-shell">
        <section className="home-hero" aria-labelledby="home-title">
          <div className="home-intro">
            <p className="home-eyebrow"><span /> UM MOMENTO COM A PALAVRA</p>
            <h1 id="home-title">A Palavra que<br />transforma <em>vidas.</em></h1>
            <p className="home-description">Encontre inspiração nas Escrituras e faça da leitura um encontro diário. Um capítulo de cada vez, no seu ritmo.</p>
            <Link className="home-primary" to={continuePath}>
              <BookOpen size={19} strokeWidth={1.6} />
              {session && lastRead ? "Continuar minha leitura" : "Começar a leitura"}
              <ArrowRight size={18} />
            </Link>
            <p className="home-caption">66 livros. Uma fonte de inspiração para a vida.</p>
          </div>

          <article className="home-verse" aria-labelledby="daily-title">
            <div className="home-verse-top">
              <span className="home-label" id="daily-title"><Sun size={17} strokeWidth={1.5} /> VERSÍCULO DO DIA</span>
              <span className="home-version">NVI</span>
            </div>
            <span className="home-quote-mark" aria-hidden="true">“</span>
            <blockquote key={verse.text}>{verse.text}</blockquote>
            <div className="home-verse-bottom">
              <div><span className="home-verse-line" /><cite>{verse.book} {verse.chapter}:{verse.verse}</cite></div>
              <Link to={versePath} aria-label={`Ler ${verse.book} ${verse.chapter}:${verse.verse} no capítulo`}><ArrowRight size={21} /></Link>
            </div>
          </article>
        </section>

        {session && lastRead && (
          <Link className="home-continue" to={continuePath}>
            <span className="home-continue-icon"><Bookmark size={20} strokeWidth={1.5} /></span>
            <span><span className="home-continue-label">RETOME SUA JORNADA</span><strong>{lastRead.livro} · Capítulo {lastRead.capitulo}</strong></span>
            <span className="home-continue-action">Continuar <ArrowRight size={17} /></span>
          </Link>
        )}

        <section className="home-explore" aria-labelledby="explore-title">
          <div className="home-section-heading"><div><p className="home-eyebrow">ESPAÇO PARA A SUA FÉ</p><h2 id="explore-title">Sua jornada nas Escrituras</h2></div><span>Leia. Descubra. Cresça.</span></div>
          <div className="home-tools">
            <Link className="home-tool" to="/leitura">
              <span className="home-tool-icon"><BookOpen size={23} strokeWidth={1.5} /></span>
              <h3>Explore a Bíblia</h3><p>Do Gênesis ao Apocalipse, encontre seu próximo capítulo.</p>
              <span className="home-tool-link">Ver os livros <ArrowRight size={16} /></span>
            </Link>
            <div className="home-tool home-search-tool">
              <span className="home-tool-icon"><Search size={23} strokeWidth={1.5} /></span>
              <h3>Encontre uma palavra</h3><p>Busque uma passagem ou uma referência que ficou com você.</p>
              <form onSubmit={search} role="search" className="home-search">
                <label htmlFor="home-search" className="sr-only">Pesquisar na Bíblia</label>
                <input id="home-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Ex.: amor ou João 3:16" type="search" maxLength={200} />
                <button type="submit" aria-label="Buscar na Bíblia" disabled={!query.trim()}><ArrowRight size={18} /></button>
              </form>
            </div>
            <Link className="home-tool" to="/progresso">
              <span className="home-tool-icon"><TrendingUp size={23} strokeWidth={1.5} /></span>
              <h3>Cultive o hábito</h3><p>Acompanhe suas leituras e trace uma meta para seguir em frente.</p>
              <span className="home-tool-link">Ver meu progresso <ArrowRight size={16} /></span>
            </Link>
          </div>
        </section>
        <footer className="home-footer"><span><BookOpen size={16} strokeWidth={1.4} /> Bibliavida</span><p>Um espaço para ler, refletir e se aproximar da Palavra.</p></footer>
      </div>
    </main>
  );
}
