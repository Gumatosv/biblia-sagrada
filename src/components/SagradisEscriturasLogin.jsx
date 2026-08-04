import { useNavigate } from "react-router-dom";
import { Bird } from "lucide-react";
import FeatureCard from "./FeatureCard";
import SearchBar from "./SearchBar";
import { features } from "../data/features";

export default function SagradisEscriturasLogin() {
  const navigate = useNavigate();

  function handleSearch(query) {
    navigate(`/pesquisa?q=${encodeURIComponent(query)}`);
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-6"
      style={{
        backgroundImage:
          "linear-gradient(135deg, #000000 0%, #0a1128 45%, #001233 100%)",
      }}
    >
      <div className="text-center max-w-4xl w-full">
        <div className="flex items-center justify-center gap-4">
          <Bird className="w-10 h-10 sm:w-14 sm:h-14 text-white" strokeWidth={1.5} />
          <h1 className="font-serif text-5xl sm:text-7xl text-white drop-shadow-lg tracking-wide">
            Bíblia Sagrada
          </h1>
        </div>
        <p className="text-lg sm:text-2xl text-white/80 mt-4 tracking-wide">
          A Palavra que transforma vidas
        </p>
        <p className="text-lg sm:text-2xl text-white/80 mt-4 tracking-wide">
          Leia a bíblia completa, pesquise versículos, marque favoritos e acompanhe seu progresso
        </p>

        <SearchBar onSearch={handleSearch} />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-12">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              {...feature}
              onClick={() => navigate(feature.path)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}