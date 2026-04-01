import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, Flame, Target, Users, Calendar, ChevronRight } from "lucide-react";
import { getDayTask } from "@/data/roadmaps";
import { cn } from "@/lib/utils";

interface UserData {
  name: string;
  email: string;
  goal: { id: string; label: string; emoji: string };
  deadline: string;
  isCustom: boolean;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [checkinText, setCheckinText] = useState("");
  const [streak, setStreak] = useState(1);
  const [todayCheckedIn, setTodayCheckedIn] = useState(false);
  const [taskComplete, setTaskComplete] = useState(false);
  const [currentDay, setCurrentDay] = useState(1);

  useEffect(() => {
    const stored = localStorage.getItem("goalmate_user");
    if (!stored) {
      navigate("/goal-setup");
      return;
    }
    const parsed = JSON.parse(stored) as UserData;
    setUser(parsed);

    // Load streak & day
    const savedStreak = localStorage.getItem("goalmate_streak");
    const savedDay = localStorage.getItem("goalmate_day");
    const savedCheckin = localStorage.getItem("goalmate_checkin_date");
    const savedTaskDone = localStorage.getItem("goalmate_task_done_day");

    if (savedStreak) setStreak(parseInt(savedStreak));
    if (savedDay) setCurrentDay(parseInt(savedDay));
    if (savedCheckin === new Date().toDateString()) setTodayCheckedIn(true);
    if (savedTaskDone === String(savedDay || 1)) setTaskComplete(true);
  }, [navigate]);

  const daysLeft = useMemo(() => {
    if (!user?.deadline) return 30;
    const diff = new Date(user.deadline).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [user]);

  const totalDays = useMemo(() => {
    if (!user?.deadline) return 30;
    const signupDate = new Date();
    signupDate.setDate(signupDate.getDate() - (currentDay - 1));
    const diff = new Date(user.deadline).getTime() - signupDate.getTime();
    return Math.max(30, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [user, currentDay]);

  const progress = Math.min(100, Math.round(((totalDays - daysLeft) / totalDays) * 100));

  const todayTask = useMemo(() => {
    if (!user) return null;
    if (user.isCustom) {
      return { day: currentDay, task: `Day ${currentDay}: Work on your goal`, detail: "Add your tasks manually and track daily progress." };
    }
    return getDayTask(user.goal.id, currentDay);
  }, [user, currentDay]);

  const handleCheckin = () => {
    if (!checkinText.trim()) return;
    const newStreak = streak + 1;
    setStreak(newStreak);
    setTodayCheckedIn(true);
    localStorage.setItem("goalmate_streak", String(newStreak));
    localStorage.setItem("goalmate_checkin_date", new Date().toDateString());
    setCheckinText("");
  };

  const handleTaskComplete = () => {
    setTaskComplete(true);
    const newDay = currentDay + 1;
    setCurrentDay(newDay);
    localStorage.setItem("goalmate_day", String(newDay));
    localStorage.setItem("goalmate_task_done_day", String(currentDay));
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-border/50 bg-background/80">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <h1 className="text-xl font-black text-gradient-hero">GoalMate</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground font-medium">Hi, {user.name.split(" ")[0]}</span>
            <button className="relative p-2 rounded-full glass-card">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-secondary" />
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
              <span className="text-2xl">{user.goal.emoji}</span>
            </div>
            <h3 className="text-lg font-bold text-foreground mb-3">{user.goal.label}</h3>
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium">{daysLeft} days left</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground font-medium">Day {currentDay}</span>
              </div>
            </div>
            {/* Progress bar */}
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
              <span className="text-sm font-bold text-secondary">{streak}</span>
            </div>
          </div>

          {todayCheckedIn ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-2">🔥</div>
              <p className="text-foreground font-semibold">You're on fire!</p>
              <p className="text-muted-foreground text-xs mt-1">{streak} day streak — keep it going!</p>
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

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Users className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-foreground font-semibold text-sm">Finding your GoalMate...</p>
                <p className="text-muted-foreground text-xs mt-0.5">We're matching you with someone on the same mission</p>
              </div>
            </div>

            {/* Fake loading animation */}
            <div className="mt-4 h-1 rounded-full bg-muted/50 overflow-hidden">
              <div className="h-full rounded-full bg-secondary/60 animate-pulse" style={{ width: '65%' }} />
            </div>
          </div>
        </div>

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
