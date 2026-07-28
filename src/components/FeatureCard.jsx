export default function FeatureCard({ icon: Icon, title, description, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center text-center gap-3 rounded-2xl border border-white/15 bg-white/5 backdrop-blur-sm px-6 py-8 transition-all duration-300 hover:border-amber-300/40 hover:bg-white/10 hover:-translate-y-1"
    >
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-amber-300/10 border border-amber-300/30 group-hover:bg-amber-300/20 transition-colors">
        <Icon className="w-6 h-6 text-amber-200" strokeWidth={1.5} />
      </div>
      <h2 className="font-serif text-xl text-white tracking-wide">
        {title}
      </h2>
      <p className="text-sm text-white/60 leading-relaxed">
        {description}
      </p>
    </button>
  );
}