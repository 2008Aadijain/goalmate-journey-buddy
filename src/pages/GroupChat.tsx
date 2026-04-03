import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

const GroupChat = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [messages, setMessages] = useState<Tables<"group_messages">[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [memberCount, setMemberCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const category = profile?.goal_category || "";

  useEffect(() => {
    if (!category || !user) return;

    const loadMessages = async () => {
      const { data } = await supabase
        .from("group_messages")
        .select("*")
        .eq("goal_category", category)
        .order("created_at", { ascending: true })
        .limit(100);
      if (data) setMessages(data);
    };

    const loadMemberCount = async () => {
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("goal_category", category);
      setMemberCount(count || 0);
    };

    loadMessages();
    loadMemberCount();

    const channel = supabase
      .channel(`group-${category}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "group_messages", filter: `goal_category=eq.${category}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Tables<"group_messages">]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [category, user]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user || !profile) return;
    const content = newMessage.trim();
    setNewMessage("");
    await supabase.from("group_messages").insert({
      goal_category: category,
      sender_id: user.id,
      sender_name: profile.name,
      content,
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-border/50 bg-background/80">
        <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
          <button onClick={() => navigate("/dashboard")} className="p-2 rounded-full glass-card">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'hsla(0, 100%, 71%, 0.2)' }}
          >
            <Users className="w-4 h-4 text-secondary" />
          </div>
          <div>
            <p className="text-foreground font-semibold text-sm">{category} Group</p>
            <p className="text-muted-foreground text-xs">{memberCount} members</p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-lg mx-auto w-full space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-muted-foreground text-sm">Be the first to say something!</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMine = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[75%] px-4 py-2.5 rounded-2xl text-sm",
                isMine
                  ? "rounded-br-md text-primary-foreground"
                  : "glass-card rounded-bl-md text-foreground"
              )}
                style={isMine ? {
                  background: 'linear-gradient(135deg, hsl(258 100% 62%), hsl(280 100% 55%))',
                } : undefined}
              >
                {!isMine && (
                  <p className="text-xs font-semibold text-primary mb-1">{msg.sender_name}</p>
                )}
                {msg.content}
                <p className={cn("text-[10px] mt-1", isMine ? "text-primary-foreground/60" : "text-muted-foreground")}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="sticky bottom-0 border-t border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center gap-2 px-4 py-3 max-w-lg mx-auto">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Message the group..."
            className="flex-1 bg-transparent border border-border rounded-full px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-40 transition-all"
            style={{ background: 'linear-gradient(135deg, hsl(258 100% 62%), hsl(280 100% 55%))' }}
          >
            <Send className="w-4 h-4 text-primary-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupChat;
