import { useNavigate } from "react-router-dom";
import Particles from "@/components/Particles";
import FeatureCards from "@/components/FeatureCards";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen hero-gradient relative overflow-hidden">
      <Particles />

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <h1 className="text-6xl md:text-8xl font-black text-foreground tracking-tight fade-up">
          GoalMate
        </h1>

        <p className="mt-4 text-xl md:text-2xl font-medium text-secondary fade-up fade-up-delay-1">
          Ek goal, ek dost, ek naya safar
        </p>

        <button
          onClick={() => navigate("/goal-setup")}
          className="mt-10 glow-button bg-primary text-primary-foreground px-10 py-4 text-lg fade-up fade-up-delay-2"
        >
          Start Your Journey
        </button>

        <div className="mt-8 glass-card px-6 py-3 fade-up fade-up-delay-3">
          <p className="text-sm text-muted-foreground">
            <span className="text-secondary font-bold text-lg">2,847</span>{" "}
            people chasing goals right now
          </p>
        </div>
      </section>

      <FeatureCards />
    </div>
  );
};

export default Index;
