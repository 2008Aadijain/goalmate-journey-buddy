import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Particles from "@/components/Particles";

const categories = [
  { emoji: "💪", label: "Fitness", glow: "hsla(258, 100%, 62%, 0.15)" },
  { emoji: "💼", label: "Career", glow: "hsla(40, 100%, 55%, 0.12)" },
  { emoji: "📚", label: "Learning", glow: "hsla(200, 100%, 55%, 0.12)" },
  { emoji: "💡", label: "Business", glow: "hsla(50, 100%, 55%, 0.12)" },
  { emoji: "❤️", label: "Health", glow: "hsla(0, 100%, 65%, 0.12)" },
  { emoji: "🎨", label: "Creative", glow: "hsla(280, 100%, 60%, 0.12)" },
];

const GoalSetup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"category" | "goal">("category");
  const [selected, setSelected] = useState("");
  const [goal, setGoal] = useState("");

  return (
    <div className="min-h-screen hero-gradient relative overflow-hidden flex items-center justify-center px-6">
      <Particles />

      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-15 blur-[100px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsla(258, 100%, 62%, 0.5), transparent 70%)' }}
      />

      <div className="relative z-10 w-full max-w-2xl">
        {step === "category" ? (
          <div className="fade-up text-center">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase glass-card text-muted-foreground mb-4">
              Step 1 of 2
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-gradient-hero mb-2 tracking-tight">
              What area do you want to crush?
            </h2>
            <p className="text-muted-foreground mb-10">Pick your category to get started</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {categories.map((cat) => (
                <button
                  key={cat.label}
                  onClick={() => {
                    setSelected(cat.label);
                    setTimeout(() => setStep("goal"), 300);
                  }}
                  className={`glass-card-glow p-6 text-center group ${
                    selected === cat.label
                      ? "ring-2 ring-primary scale-105"
                      : ""
                  }`}
                >
                  <div
                    className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center text-3xl transition-transform duration-300 group-hover:scale-110"
                    style={{ background: cat.glow }}
                  >
                    {cat.emoji}
                  </div>
                  <div className="text-foreground font-semibold text-sm">{cat.label}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="fade-up text-center">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase glass-card text-muted-foreground mb-4">
              Step 2 of 2
            </span>
            <div className="text-5xl mb-4">
              {categories.find((c) => c.label === selected)?.emoji}
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-gradient-hero mb-2 tracking-tight">
              What's your {selected.toLowerCase()} goal?
            </h2>
            <p className="text-muted-foreground mb-8">Be specific — your GoalMate needs to know!</p>

            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Run a 5K in under 30 minutes by March..."
              className="w-full h-32 glass-card bg-transparent text-foreground placeholder:text-muted-foreground p-4 resize-none focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />

            <button
              onClick={() => goal.trim() && navigate("/signup", { state: { category: selected, goal } })}
              disabled={!goal.trim()}
              className="mt-6 glow-button text-primary-foreground px-10 py-4 text-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalSetup;
