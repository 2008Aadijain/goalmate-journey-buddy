import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Particles from "@/components/Particles";

const Signup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { category, goal } = (location.state as { category?: string; goal?: string }) || {};

  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Signup:", { ...form, category, goal });
    navigate("/");
  };

  return (
    <div className="min-h-screen hero-gradient relative overflow-hidden flex items-center justify-center px-6">
      <Particles />

      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-15 blur-[100px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsla(258, 100%, 62%, 0.5), transparent 70%)' }}
      />

      <div className="relative z-10 w-full max-w-md fade-up">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-black text-gradient-hero tracking-tight">Almost there! 🚀</h2>
          <p className="text-muted-foreground mt-2">Create your account to find your GoalMate</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card-glow p-8 space-y-5">
          {[
            { key: "name", label: "Your Name", type: "text", placeholder: "Arjun" },
            { key: "email", label: "Email", type: "email", placeholder: "arjun@example.com" },
            { key: "password", label: "Password", type: "password", placeholder: "••••••••" },
          ].map((field) => (
            <div key={field.key}>
              <label className="block text-sm text-muted-foreground mb-1.5 font-medium">{field.label}</label>
              <input
                type={field.type}
                placeholder={field.placeholder}
                required
                value={form[field.key as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                className="w-full bg-transparent border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          ))}

          <button
            type="submit"
            className="w-full glow-button text-primary-foreground py-4 text-lg font-bold"
          >
            Create Account
          </button>
        </form>
      </div>
    </div>
  );
};

export default Signup;
