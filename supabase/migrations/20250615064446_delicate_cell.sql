/*
  # Fix user signup trigger

  1. Functions
    - Create or replace the `handle_new_user` function to automatically create user profiles
    - Create or replace the `update_updated_at_column` function for timestamp updates

  2. Triggers
    - Create trigger to automatically create user profile when new user signs up
    - Ensure the trigger fires after user creation in auth.users table

  3. Security
    - Ensure proper RLS policies are in place
    - Grant necessary permissions for the trigger function
*/

-- Create or replace the function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, name, email, level, xp, current_streak, grade_level)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    1,
    0,
    0,
    'high'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace the function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists and recreate it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger to automatically create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure the updated_at trigger exists on user_profiles
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.user_profiles TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.user_achievements TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.user_module_progress TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.debate_sessions TO postgres, anon, authenticated, service_role;