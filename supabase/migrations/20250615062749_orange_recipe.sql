/*
  # User Authentication and Progress Tracking Schema

  1. New Tables
    - `user_profiles`
      - `id` (uuid, references auth.users)
      - `name` (text)
      - `email` (text)
      - `level` (integer)
      - `xp` (integer)
      - `current_streak` (integer)
      - `grade_level` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `user_achievements`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `achievement_id` (text)
      - `title` (text)
      - `description` (text)
      - `icon` (text)
      - `rarity` (text)
      - `unlocked_at` (timestamp)
    
    - `user_module_progress`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `module_id` (text)
      - `completed_at` (timestamp)
      - `score` (integer)
      - `xp_gained` (integer)
    
    - `debate_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `topic` (text)
      - `user_side` (text)
      - `final_score` (integer)
      - `xp_gained` (integer)
      - `rounds_completed` (integer)
      - `completed_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  level integer DEFAULT 1,
  xp integer DEFAULT 0,
  current_streak integer DEFAULT 0,
  grade_level text DEFAULT 'high',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  achievement_id text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  rarity text NOT NULL,
  unlocked_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Create user_module_progress table
CREATE TABLE IF NOT EXISTS user_module_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  module_id text NOT NULL,
  completed_at timestamptz DEFAULT now(),
  score integer DEFAULT 0,
  xp_gained integer DEFAULT 0,
  UNIQUE(user_id, module_id)
);

-- Create debate_sessions table
CREATE TABLE IF NOT EXISTS debate_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  topic text NOT NULL,
  user_side text NOT NULL,
  final_score integer DEFAULT 0,
  xp_gained integer DEFAULT 0,
  rounds_completed integer DEFAULT 0,
  completed_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_module_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE debate_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles
CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create policies for user_achievements
CREATE POLICY "Users can view own achievements"
  ON user_achievements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
  ON user_achievements
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create policies for user_module_progress
CREATE POLICY "Users can view own module progress"
  ON user_module_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own module progress"
  ON user_module_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own module progress"
  ON user_module_progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for debate_sessions
CREATE POLICY "Users can view own debate sessions"
  ON debate_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own debate sessions"
  ON debate_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create function to handle user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO user_profiles (id, name, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', new.email),
    new.email
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION handle_new_user();
  END IF;
END $$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at on user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_profiles_updated_at'
  ) THEN
    CREATE TRIGGER update_user_profiles_updated_at
      BEFORE UPDATE ON user_profiles
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;