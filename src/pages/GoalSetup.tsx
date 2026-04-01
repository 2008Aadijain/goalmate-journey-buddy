import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Particles from "@/components/Particles";

const categories = [
  { emoji: "💪", label: "Fitness" },
  { emoji: "💼", label: "Career" },
  { emoji: "📚", label: "Learning" },
  { emoji: "💡", label: "Business" },
  { emoji: "❤️", label: "Health" },
  { emoji: "🎨", label: "Creative" },
];

const GoalSetup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"category" | "goal">("category");
  const [selected, setSelected] = useState("");
  const [goal, setGoal] = useState("");

  return (
    <div className="min-h-screen hero-gradient relative overflow-hidden flex items-center justify-center px-6">
      <Particles />

      <div className="relative z-10 w-full max-w-2xl">
        {step === "category" ? (
          <div className="fade-up text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
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
                  className={`glass-card p-6 text-center transition-all duration-300 hover:scale-105 ${
                    selected === cat.label
                      ? "ring-2 ring-primary scale-105"
                      : "hover:border-primary/30"
                  }`}
                >
                  <div className="text-4xl mb-2">{cat.emoji}</div>
                  <div className="text-foreground font-semibold">{cat.label}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="fade-up text-center">
            <div className="text-5xl mb-4">
              {categories.find((c) => c.label === selected)?.emoji}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
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
              className="mt-6 glow-button bg-primary text-primary-foreground px-10 py-4 text-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
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
