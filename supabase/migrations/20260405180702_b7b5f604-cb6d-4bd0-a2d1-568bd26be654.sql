
-- Add XP and avatar_url to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS xp integer NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- Friend requests table
CREATE TABLE public.friend_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own friend requests" ON public.friend_requests FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send friend requests" ON public.friend_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update requests sent to them" ON public.friend_requests FOR UPDATE TO authenticated USING (auth.uid() = receiver_id);
CREATE POLICY "Users can delete own requests" ON public.friend_requests FOR DELETE TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Friend groups table (no SELECT policy yet - added after members table)
CREATE TABLE public.friend_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid NOT NULL,
  invite_code text NOT NULL DEFAULT substr(md5(random()::text), 1, 8),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(invite_code)
);
ALTER TABLE public.friend_groups ENABLE ROW LEVEL SECURITY;

-- Friend group members table
CREATE TABLE public.friend_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.friend_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);
ALTER TABLE public.friend_group_members ENABLE ROW LEVEL SECURITY;

-- Now add policies (both tables exist)
CREATE POLICY "Members can view their groups" ON public.friend_groups FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.friend_group_members WHERE friend_group_members.group_id = friend_groups.id AND friend_group_members.user_id = auth.uid()));
CREATE POLICY "Users can create groups" ON public.friend_groups FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Members can view group members" ON public.friend_group_members FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.friend_group_members AS m WHERE m.group_id = friend_group_members.group_id AND m.user_id = auth.uid()));
CREATE POLICY "Users can join groups" ON public.friend_group_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave groups" ON public.friend_group_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their avatars" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their avatars" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_group_members;
