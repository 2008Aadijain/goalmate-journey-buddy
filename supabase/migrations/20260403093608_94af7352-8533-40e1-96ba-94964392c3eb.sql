
-- Check-ins for the progress wall
CREATE TABLE public.check_ins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  goal_category TEXT NOT NULL,
  goal_label TEXT NOT NULL,
  goal_emoji TEXT NOT NULL DEFAULT '🎯',
  content TEXT NOT NULL,
  streak_at_time INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view check-ins"
ON public.check_ins FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can create own check-ins"
ON public.check_ins FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Reactions (likes and me-too)
CREATE TABLE public.check_in_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  check_in_id UUID NOT NULL REFERENCES public.check_ins(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'metoo')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (check_in_id, user_id, reaction_type)
);

ALTER TABLE public.check_in_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view reactions"
ON public.check_in_reactions FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can add own reactions"
ON public.check_in_reactions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own reactions"
ON public.check_in_reactions FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Achievements / badges
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_name TEXT NOT NULL,
  badge_emoji TEXT NOT NULL,
  badge_description TEXT NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_name)
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view achievements"
ON public.achievements FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can earn achievements"
ON public.achievements FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Enable realtime for check_ins
ALTER PUBLICATION supabase_realtime ADD TABLE public.check_ins;
ALTER PUBLICATION supabase_realtime ADD TABLE public.check_in_reactions;
