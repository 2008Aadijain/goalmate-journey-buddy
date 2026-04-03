import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Flame, Trophy, Share2, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Achievement {
  id: string;
  badge_name: string;
  badge_emoji: string;
  badge_description: string;
  earned_at: string;
}

const ALL_BADGES = [
  { name: "Getting Started", emoji: "🌱", description: "3 day streak", threshold: 3 },
  { name: "On Fire", emoji: "🔥", description: "7 day streak", threshold: 7 },
  { name: "Habit Builder", emoji: "🏗️", description: "21 day streak", threshold: 21 },
  { name: "GoalMate Champion", emoji: "🏆", description: "30 day streak", threshold: 30 },
];

const Profile = () => {
  const navigate = useNavigate();
  const { user, profile, loading, signOut } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/goal-setup");
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchAchievements = async () => {
      const { data } = await supabase.from("achievements").select("*").eq("user_id", user.id).order("earned_at", { ascending: true });
      if (data) setAchievements(data);
    };
    fetchAchievements();
  }, [user]);

  // Check and award badges
  useEffect(() => {
    if (!user || !profile) return;
    const checkBadges = async () => {
      for (const badge of ALL_BADGES) {
        if (profile.streak >= badge.threshold && !achievements.find(a => a.badge_name === badge.name)) {
          const { data } = await supabase.from("achievements").insert({
            user_id: user.id,
            badge_name: badge.name,
            badge_emoji: badge.emoji,
            badge_description: badge.description,
          }).select().single();
          if (data) {
            setAchievements(prev => [...prev, data]);
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 3000);
          }
        }
      }
    };
    checkBadges();
  }, [user, profile, achievements]);

  const handleShare = async (badge: Achievement) => {
    const text = `I just earned the "${badge.badge_emoji} ${badge.badge_name}" badge on GoalMate! ${badge.badge_description}. Join me at GoalMate!`;
    if (navigator.share) {
      try { await navigator.share({ title: "GoalMate Achievement", text }); } catch {}
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  if (loading || !profile) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-4xl animate-pulse">👤</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Confetti */}
      {showConfetti && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-${Math.random() * 20}%`,
                width: `${8 + Math.random() * 8}px`,
                height: `${8 + Math.random() * 8}px`,
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                background: ['#6C3BFF', '#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF'][Math.floor(Math.random() * 5)],
                animation: `confetti-fall ${2 + Math.random() * 2}s ease-in forwards`,
                animationDelay: `${Math.random() * 0.5}s`,
              }}
            />
          ))}
        </div>
      )}

      <header className="sticky top-0 z-40 backdrop-blur-xl border-b border-border/50 bg-background/80">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/dashboard")} className="p-2 rounded-full glass-card">
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </button>
            <h1 className="text-lg font-bold text-foreground">Profile</h1>
          </div>
          <button onClick={handleLogout} className="p-2 rounded-full glass-card">
            <LogOut className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-5">
        {/* Profile Card */}
        <div className="glass-card-glow p-6 text-center">
          <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl"
            style={{ background: 'linear-gradient(135deg, hsla(258, 100%, 62%, 0.3), hsla(0, 100%, 71%, 0.2))' }}
          >
            {profile.goal_emoji}
          </div>
          <h2 className="text-xl font-bold text-foreground">{profile.name}</h2>
          <p className="text-sm text-muted-foreground mt-1">{profile.goal_label}</p>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="text-center">
              <div className="flex items-center gap-1 justify-center">
                <Flame className="w-4 h-4 text-secondary" />
                <span className="text-lg font-bold text-foreground">{profile.streak}</span>
              </div>
              <p className="text-xs text-muted-foreground">Streak</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <div className="flex items-center gap-1 justify-center">
                <Trophy className="w-4 h-4 text-primary" />
                <span className="text-lg font-bold text-foreground">{achievements.length}</span>
              </div>
              <p className="text-xs text-muted-foreground">Badges</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <span className="text-lg font-bold text-foreground">Day {profile.current_day}</span>
              <p className="text-xs text-muted-foreground">Progress</p>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div>
          <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" /> Achievements
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {ALL_BADGES.map(badge => {
              const earned = achievements.find(a => a.badge_name === badge.name);
              return (
                <div
                  key={badge.name}
                  className={`glass-card p-4 text-center transition-all ${earned ? "" : "opacity-40 grayscale"}`}
                >
                  <div className="text-3xl mb-2">{badge.emoji}</div>
                  <p className="text-xs font-bold text-foreground">{badge.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{badge.description}</p>
                  {earned && (
                    <button
                      onClick={() => handleShare(earned)}
                      className="mt-2 flex items-center gap-1 mx-auto px-2 py-1 rounded-full text-[10px] font-semibold text-primary hover:bg-primary/10 transition-all"
                    >
                      <Share2 className="w-3 h-3" /> Share
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Goal */}
        <div className="glass-card-glow p-5">
          <h3 className="text-sm font-bold text-foreground mb-3">Current Goal</h3>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{profile.goal_emoji}</span>
            <div>
              <p className="text-sm font-semibold text-foreground">{profile.goal_label}</p>
              <p className="text-xs text-muted-foreground">{profile.goal_category} · Day {profile.current_day}</p>
              {profile.deadline && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Deadline: {new Date(profile.deadline).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
