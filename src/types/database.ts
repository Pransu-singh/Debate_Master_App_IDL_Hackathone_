export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          name: string;
          email: string;
          level: number;
          xp: number;
          current_streak: number;
          grade_level: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          level?: number;
          xp?: number;
          current_streak?: number;
          grade_level?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          level?: number;
          xp?: number;
          current_streak?: number;
          grade_level?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_id: string;
          title: string;
          description: string;
          icon: string;
          rarity: string;
          unlocked_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          achievement_id: string;
          title: string;
          description: string;
          icon: string;
          rarity: string;
          unlocked_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          achievement_id?: string;
          title?: string;
          description?: string;
          icon?: string;
          rarity?: string;
          unlocked_at?: string;
        };
      };
      user_module_progress: {
        Row: {
          id: string;
          user_id: string;
          module_id: string;
          completed_at: string;
          score: number;
          xp_gained: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          module_id: string;
          completed_at?: string;
          score?: number;
          xp_gained?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          module_id?: string;
          completed_at?: string;
          score?: number;
          xp_gained?: number;
        };
      };
      debate_sessions: {
        Row: {
          id: string;
          user_id: string;
          topic: string;
          user_side: string;
          final_score: number;
          xp_gained: number;
          rounds_completed: number;
          completed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          topic: string;
          user_side: string;
          final_score?: number;
          xp_gained?: number;
          rounds_completed?: number;
          completed_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          topic?: string;
          user_side?: string;
          final_score?: number;
          xp_gained?: number;
          rounds_completed?: number;
          completed_at?: string;
        };
      };
    };
  };
}