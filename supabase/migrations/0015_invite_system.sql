-- Add invite_status to profiles
ALTER TABLE public.profiles ADD COLUMN invite_status TEXT DEFAULT 'pending';

-- Migrate existing users
UPDATE public.profiles SET invite_status = 'approved' WHERE is_active = true;
UPDATE public.profiles SET invite_status = 'rejected' WHERE is_active = false;

-- Replace trigger function to set invite_status to pending and is_active to false for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role public.user_role;
  v_status TEXT;
  v_active BOOLEAN;
BEGIN
  IF (SELECT count(*) FROM public.profiles) = 0 THEN
    v_role := 'admin';
    v_status := 'approved';
    v_active := true;
  ELSE
    v_role := 'contractor';
    v_status := 'pending';
    v_active := false; -- Must be approved to become active
  END IF;

  INSERT INTO public.profiles (id, email, role, invite_status, is_active)
  VALUES (NEW.id, NEW.email, v_role, v_status, v_active);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
