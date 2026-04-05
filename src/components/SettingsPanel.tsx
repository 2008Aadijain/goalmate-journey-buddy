import { useState, useRef } from "react";
import { X, User, Camera, Bell, Info, LogOut, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
}

const SettingsPanel = ({ open, onClose, onLogout }: SettingsPanelProps) => {
  const { user, profile, refreshProfile } = useAuth();
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(profile?.name || "");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open || !profile || !user) return null;

  const saveName = async () => {
    if (!newName.trim()) return;
    await supabase.from("profiles").update({ name: newName.trim() }).eq("user_id", user.id);
    setEditingName(false);
    refreshProfile();
  };

  const uploadAvatar = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    
    await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("user_id", user.id);
    setUploading(false);
    refreshProfile();
  };

  const requestNotifications = async () => {
    if ("Notification" in window) {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        new Notification("GoalMate 🔥", { body: "Notifications enabled! We'll remind you to check in." });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-t-3xl overflow-hidden animate-in slide-in-from-bottom duration-300"
        style={{ background: 'hsl(270 50% 6%)', border: '1px solid hsla(258, 60%, 40%, 0.2)', maxHeight: '85vh' }}>
        
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
          <h2 className="text-lg font-bold text-foreground">Settings</h2>
          <button onClick={onClose} className="p-2 rounded-full glass-card">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 60px)' }}>
          {/* Profile Picture */}
          <div className="flex items-center gap-4 py-3">
            <div className="relative">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
                  style={{ background: 'hsla(258, 80%, 50%, 0.2)' }}>
                  {profile.name.charAt(0).toUpperCase()}
                </div>
              )}
              <button onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center border-2 border-background"
                style={{ background: 'hsl(258 100% 62%)' }}>
                <Camera className="w-3.5 h-3.5 text-white" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={e => { if (e.target.files?.[0]) uploadAvatar(e.target.files[0]); }} />
            </div>
            <div>
              <p className="text-foreground font-bold">{profile.name}</p>
              <p className="text-xs text-muted-foreground">{profile.goal_emoji} {profile.goal_label}</p>
              {uploading && <p className="text-xs text-primary mt-1">Uploading...</p>}
            </div>
          </div>

          <div className="h-px bg-border/30 my-2" />

          {/* Edit Name */}
          <button onClick={() => { setEditingName(!editingName); setNewName(profile.name); }}
            className="w-full flex items-center gap-3 py-3.5 text-left">
            <User className="w-5 h-5 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium text-foreground">Edit Profile Name</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
          {editingName && (
            <div className="flex gap-2 pb-2 px-8">
              <input value={newName} onChange={e => setNewName(e.target.value)}
                className="flex-1 bg-transparent border border-border/50 rounded-full px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <button onClick={saveName}
                className="px-4 py-2 rounded-full text-xs font-bold text-primary-foreground"
                style={{ background: 'hsl(258 100% 62%)' }}>Save</button>
            </div>
          )}

          {/* Change Picture */}
          <button onClick={() => fileRef.current?.click()}
            className="w-full flex items-center gap-3 py-3.5 text-left">
            <Camera className="w-5 h-5 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium text-foreground">Change Profile Picture</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* Notifications */}
          <button onClick={requestNotifications}
            className="w-full flex items-center gap-3 py-3.5 text-left">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium text-foreground">Notification Preferences</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>

          <div className="h-px bg-border/30 my-2" />

          {/* About */}
          <button className="w-full flex items-center gap-3 py-3.5 text-left">
            <Info className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <span className="text-sm font-medium text-foreground block">About GoalMate</span>
              <span className="text-xs text-muted-foreground">Ek goal, ek dost, ek naya safar</span>
            </div>
          </button>

          <div className="h-px bg-border/30 my-2" />

          {/* Logout */}
          <button onClick={onLogout}
            className="w-full flex items-center gap-3 py-3.5 text-left">
            <LogOut className="w-5 h-5 text-destructive" />
            <span className="flex-1 text-sm font-medium text-destructive">Logout</span>
          </button>

          <p className="text-center text-[10px] text-muted-foreground/50 pt-4 pb-6">GoalMate v1.0.0</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
