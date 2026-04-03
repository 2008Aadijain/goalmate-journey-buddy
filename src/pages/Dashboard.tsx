import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, Flame, Target, Users, Calendar, ChevronRight, MessageCircle, LogOut, Globe, User, Trophy } from "lucide-react";
import { getDayTask } from "@/data/roadmaps";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const [checkinText, setCheckinText] = useState("");
  const [todayCheckedIn, setTodayCheckedIn] = useState(false);
  const [taskComplete, setTaskComplete] = useState(false);
  const [match, setMatch] = useState<Tables<"matches"> | null>(null);
  const [matchProfile, setMatchProfile] = useState<Tables<"profiles"> | null>(null);
  const [unreadDM, setUnreadDM] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/goal-setup");
    }
  }, [loading, user, navigate]);

  // Load check-in state from localStorage (per-user)
  useEffect(() => {
    if (!user) return;
    const savedCheckin = localStorage.getItem(`gm_checkin_${user.id}`);
    const savedTaskDay = localStorage.getItem(`gm_task_done_${user.id}`);
    if (savedCheckin === new Date().toDateString()) setTodayCheckedIn(true);
    if (profile && savedTaskDay === String(profile.current_day)) setTaskComplete(true);
  }, [user, profile]);

  // Find or create match
  useEffect(() => {
    if (!user || !profile) return;

    const findMatch = async () => {
      // Check existing matches
      const { data: existing } = await supabase
        .from("matches")
        .select("*")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq("status", "active")
        .limit(1)
        .single();

      if (existing) {
        setMatch(existing);
        const partnerId = existing.user1_id === user.id ? existing.user2_id : existing.user1_id;
        const { data: partner } = await supabase.from("profiles").select("*").eq("user_id", partnerId).single();
        if (partner) setMatchProfile(partner);
        return;
      }

      // Find unmatched user with same category
      const { data: candidates } = await supabase
        .from("profiles")
        .select("*")
        .eq("goal_category", profile.goal_category)
        .neq("user_id", user.id)
        .limit(10);

      if (!candidates || candidates.length === 0) return;

      // Check which candidates are already matched
      for (const candidate of candidates) {
        const { data: existingMatch } = await supabase
          .from("matches")
          .select("id")
          .or(`user1_id.eq.${candidate.user_id},user2_id.eq.${candidate.user_id}`)
          .eq("status", "active")
          .limit(1)
          .maybeSingle();

        if (!existingMatch) {
          // Create match
          const { data: newMatch } = await supabase
            .from("matches")
            .insert({ user1_id: user.id, user2_id: candidate.user_id, goal_category: profile.goal_category })
            .select()
            .single();
          if (newMatch) {
            setMatch(newMatch);
            setMatchProfile(candidate);
          }
          return;
        }
      }
    };

    findMatch();
  }, [user, profile]);

  // Count unread DMs
  useEffect(() => {
    if (!match || !user) return;
    const countUnread = async () => {
      const { count } = await supabase
        .from("direct_messages")
        .select("*", { count: "exact", head: true })
        .eq("match_id", match.id)
        .neq("sender_id", user.id)
        .eq("read", false);
      setUnreadDM(count || 0);
    };
    countUnread();

    const channel = supabase
      .channel(`unread-${match.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages", filter: `match_id=eq.${match.id}` }, () => {
        countUnread();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [match, user]);

  const daysLeft = useMemo(() => {
    if (!profile?.deadline) return 30;
    const diff = new Date(profile.deadline).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [profile]);

  const totalDays = useMemo(() => {
    if (!profile?.deadline) return 30;
    const currentDay = profile.current_day;
    const signupDate = new Date();
    signupDate.setDate(signupDate.getDate() - (currentDay - 1));
    const diff = new Date(profile.deadline).getTime() - signupDate.getTime();
    return Math.max(30, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [profile]);

  const progress = Math.min(100, Math.round(((totalDays - daysLeft) / totalDays) * 100));

  const todayTask = useMemo(() => {
    if (!profile) return null;
    const currentDay = profile.current_day;
    if (profile.is_custom) {
      return { day: currentDay, task: `Day ${currentDay}: Work on your goal`, detail: "Add your tasks manually and track daily progress." };
    }
    return getDayTask(profile.goal_label.toLowerCase().replace(/\s+/g, '-'), currentDay) ||
      getDayTask(profile.goal_category.toLowerCase(), currentDay);
  }, [profile]);

  const handleCheckin = async () => {
    if (!checkinText.trim() || !user || !profile) return;
    const newStreak = profile.streak + 1;
    setTodayCheckedIn(true);
    localStorage.setItem(`gm_checkin_${user.id}`, new Date().toDateString());
    setCheckinText("");
    await supabase.from("profiles").update({ streak: newStreak }).eq("user_id", user.id);
    refreshProfile();
  };

  const handleTaskComplete = async () => {
    if (!user || !profile) return;
    setTaskComplete(true);
    const newDay = profile.current_day + 1;
    localStorage.setItem(`gm_task_done_${user.id}`, String(profile.current_day));
    await supabase.from("profiles").update({ current_day: newDay }).eq("user_id", user.id);
    refreshProfile();
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  if (loading || !profile) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-3 animate-pulse">🎯</div>
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-border/50 bg-background/80">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <h1 className="text-xl font-black text-gradient-hero">GoalMate</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground font-medium">Hi, {profile.name.split(" ")[0]}</span>
            <button onClick={handleLogout} className="p-2 rounded-full glass-card">
              <LogOut className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-4">
        {/* My Goal Card */}
        <div className="rounded-2xl p-5 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, hsla(258, 100%, 40%, 0.4) 0%, hsla(258, 60%, 20%, 0.6) 100%)',
            border: '1px solid hsla(258, 100%, 62%, 0.2)',
          }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20 blur-[60px]"
            style={{ background: 'hsla(258, 100%, 62%, 0.8)' }}
          />
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">My Goal</span>
              </div>
              <span className="text-2xl">{profile.goal_emoji}</span>
            </div>
            <h3 className="text-lg font-bold text-foreground mb-3">{profile.goal_label}</h3>
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium">{daysLeft} days left</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground font-medium">Day {profile.current_day}</span>
              </div>
            </div>
            <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, hsl(258 100% 62%), hsl(280 100% 60%))',
                  boxShadow: '0 0 12px hsla(258, 100%, 62%, 0.5)',
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">{progress}% complete</p>
          </div>
        </div>

        {/* Daily Check-in */}
        <div className="glass-card-glow p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-secondary" />
              <span className="text-sm font-bold text-foreground">Daily Check-in</span>
            </div>
            <div className="flex items-center gap-1 px-3 py-1 rounded-full"
              style={{ background: 'hsla(0, 100%, 71%, 0.15)' }}
            >
              <Flame className="w-3.5 h-3.5 text-secondary" />
              <span className="text-sm font-bold text-secondary">{profile.streak}</span>
            </div>
          </div>

          {todayCheckedIn ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-2">🔥</div>
              <p className="text-foreground font-semibold">You're on fire!</p>
              <p className="text-muted-foreground text-xs mt-1">{profile.streak} day streak — keep it going!</p>
            </div>
          ) : (
            <>
              <textarea
                value={checkinText}
                onChange={(e) => setCheckinText(e.target.value)}
                placeholder="What did you do today for your goal?"
                className="w-full h-20 bg-transparent border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none transition-all mb-3"
              />
              <button
                onClick={handleCheckin}
                disabled={!checkinText.trim()}
                className="w-full glow-button text-primary-foreground py-3 text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
              >
                Check In ✅
              </button>
            </>
          )}
        </div>

        {/* GoalMate Card */}
        <div className="rounded-2xl p-5 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, hsla(0, 100%, 50%, 0.12) 0%, hsla(20, 100%, 50%, 0.08) 100%)',
            border: '1px solid hsla(0, 100%, 71%, 0.15)',
          }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-15 blur-[60px]"
            style={{ background: 'hsla(0, 100%, 71%, 0.8)' }}
          />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-secondary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-secondary">Your GoalMate</span>
            </div>

            {matchProfile ? (
              <div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                    style={{ background: 'hsla(0, 100%, 71%, 0.2)' }}
                  >
                    {matchProfile.goal_emoji}
                  </div>
                  <div className="flex-1">
                    <p className="text-foreground font-semibold text-sm">{matchProfile.name}</p>
                    <p className="text-muted-foreground text-xs mt-0.5">{matchProfile.goal_label}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Flame className="w-3 h-3 text-secondary" />
                      <span className="text-xs text-secondary font-semibold">{matchProfile.streak} day streak</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/chat/${match?.id}`)}
                  className="mt-4 w-full glass-card flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-foreground hover:bg-primary/10 transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat with {matchProfile.name.split(" ")[0]}
                  {unreadDM > 0 && (
                    <span className="ml-1 w-5 h-5 rounded-full bg-secondary text-secondary-foreground text-xs font-bold flex items-center justify-center">
                      {unreadDM}
                    </span>
                  )}
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <Users className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-foreground font-semibold text-sm">Finding your GoalMate...</p>
                    <p className="text-muted-foreground text-xs mt-0.5">We're matching you with someone on the same mission</p>
                  </div>
                </div>
                <div className="mt-4 h-1 rounded-full bg-muted/50 overflow-hidden">
                  <div className="h-full rounded-full bg-secondary/60 animate-pulse" style={{ width: '65%' }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Group Chat Card */}
        <button
          onClick={() => navigate("/group-chat")}
          className="w-full glass-card-glow p-5 text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'hsla(258, 100%, 62%, 0.2)' }}
              >
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-foreground font-semibold text-sm">{profile.goal_category} Group Chat</p>
                <p className="text-muted-foreground text-xs">Connect with everyone chasing the same goal</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </button>

        {/* Today's Roadmap Task */}
        {todayTask && (
          <div className="glass-card-glow p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{ background: 'hsla(258, 100%, 62%, 0.2)' }}
                >
                  📋
                </div>
                <span className="text-sm font-bold text-foreground">Today's Task</span>
              </div>
              <span className="text-xs text-muted-foreground font-medium">Day {todayTask.day}</span>
            </div>

            <div className="flex items-start gap-3">
              <button
                onClick={handleTaskComplete}
                disabled={taskComplete}
                className={cn(
                  "mt-0.5 w-6 h-6 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-all duration-300",
                  taskComplete
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-border hover:border-primary"
                )}
              >
                {taskComplete && <Check className="w-3.5 h-3.5" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-semibold transition-all",
                  taskComplete ? "text-muted-foreground line-through" : "text-foreground"
                )}>
                  {todayTask.task}
                </p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {todayTask.detail}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            </div>

            {taskComplete && (
              <div className="mt-4 text-center py-2 rounded-xl" style={{ background: 'hsla(258, 100%, 62%, 0.1)' }}>
                <p className="text-xs text-primary font-semibold">✨ Great job! See you tomorrow.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
