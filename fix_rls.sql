-- Drop the recursive policy
DROP POLICY IF EXISTS "Admins can view and manage all profiles" ON public.profiles;

-- Create a security definer function to check admin status
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  is_admin_user BOOLEAN;
BEGIN
  SELECT (role = 'admin' AND is_active = true) INTO is_admin_user
  FROM public.profiles
  WHERE id = auth.uid();
  RETURN COALESCE(is_admin_user, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the admin policy using the function
CREATE POLICY "Admins can view and manage all profiles"
  ON public.profiles
  FOR ALL
  USING (public.is_admin());
