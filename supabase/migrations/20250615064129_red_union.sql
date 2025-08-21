/*
  # Complete DebateMaster Database Schema

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `name` (text)
      - `email` (text)
      - `level` (integer, default 1)
      - `xp` (integer, default 0)
      - `current_streak` (integer, default 0)
      - `grade_level` (text, default 'high')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `user_achievements`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `achievement_id` (text)
      - `title` (text)
      - `description` (text)
      - `icon` (text)
      - `rarity` (text)
      - `unlocked_at` (timestamp)
    
    - `user_module_progress`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `module_id` (text)
      - `completed_at` (timestamp)
      - `score` (integer)
      - `xp_gained` (integer)
    
    - `debate_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `topic` (text)
      - `user_side` (text)
      - `final_score` (integer)
      - `xp_gained` (integer)
      - `rounds_completed` (integer)
      - `completed_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Automatic user profile creation on signup

  3. Functions & Triggers
    - Updated timestamp trigger
    - New user signup handler
*/

-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  level integer DEFAULT 1,
  xp integer DEFAULT 0,
  current_streak integer DEFAULT 0,
  grade_level text DEFAULT 'high',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  achievement_id text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  rarity text NOT NULL,
  unlocked_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- User module progress table
CREATE TABLE IF NOT EXISTS user_module_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  module_id text NOT NULL,
  completed_at timestamptz DEFAULT now(),
  score integer DEFAULT 0,
  xp_gained integer DEFAULT 0,
  UNIQUE(user_id, module_id)
);

-- Debate sessions table
CREATE TABLE IF NOT EXISTS debate_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

DROP POLICY IF EXISTS "Users can view own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can insert own achievements" ON user_achievements;

DROP POLICY IF EXISTS "Users can view own module progress" ON user_module_progress;
DROP POLICY IF EXISTS "Users can insert own module progress" ON user_module_progress;
DROP POLICY IF EXISTS "Users can update own module progress" ON user_module_progress;

DROP POLICY IF EXISTS "Users can view own debate sessions" ON debate_sessions;
DROP POLICY IF EXISTS "Users can insert own debate sessions" ON debate_sessions;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- RLS Policies for user_achievements
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

-- RLS Policies for user_module_progress
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

-- RLS Policies for debate_sessions
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

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Triggers
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();