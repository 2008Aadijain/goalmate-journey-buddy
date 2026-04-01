const features = [
  { emoji: "🎯", title: "Set Your Goal", desc: "Define what matters most to you and commit to it." },
  { emoji: "🤝", title: "Find Your GoalMate", desc: "Get matched with someone chasing the same dream." },
  { emoji: "🔥", title: "Build Your Streak", desc: "Stay consistent together and never break the chain." },
];

const FeatureCards = () => (
  <section className="relative z-10 px-6 pb-24 pt-12">
    <div className="mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6">
      {features.map((f, i) => (
        <div
          key={f.title}
          className={`glass-card p-8 text-center fade-up fade-up-delay-${i + 3} hover:scale-105 transition-transform duration-300 cursor-default`}
        >
          <div className="text-5xl mb-4">{f.emoji}</div>
          <h3 className="text-xl font-bold text-foreground mb-2">{f.title}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
        </div>
      ))}
    </div>
  </section>
);

export default FeatureCards;
