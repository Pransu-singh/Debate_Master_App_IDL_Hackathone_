import { useState, useEffect } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User } from '../types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get initial session with timeout
    const getInitialSession = async () => {
      try {
        console.log('🔍 Initializing authentication...');

        // Set a timeout to prevent infinite loading - increased from 5s to 15s
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Authentication timeout')), 15000)
        );

        const sessionPromise = supabase.auth.getSession();

        const { data: { session }, error } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any;

        if (error) {
          console.error('❌ Session error:', error);
          if (!error.message.includes('Demo mode') && !error.message.includes('timeout')) {
            throw error;
          }
        }

        if (session?.user) {
          console.log('✅ User session found:', session.user.email);
          setSupabaseUser(session.user);
          // Don't await here - let profile loading happen separately
          loadUserProfile(session.user.id).catch(err => {
            console.warn('⚠️ Profile loading failed, but user is authenticated:', err);
          });
        } else {
          console.log('ℹ️ No active session found');
          // No session found, continue without user
          setLoading(false);
        }
      } catch (err) {
        console.warn('⚠️ Authentication initialization failed, continuing in demo mode:', err);
        // Don't set error for demo mode or timeout, just continue
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes with error handling
    let subscription: any;
    try {
      const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
        async (event: any, session: any) => {
          console.log('🔄 Auth state changed:', event, session?.user?.email);

          if (session?.user) {
            setSupabaseUser(session.user);
            // Don't await here - let profile loading happen separately
            loadUserProfile(session.user.id).catch(err => {
              console.warn('⚠️ Profile loading failed in auth state change:', err);
            });
          } else {
            setSupabaseUser(null);
            setUser(null);
          }
          setLoading(false);
        }
      );
      subscription = authSubscription;
    } catch (err) {
      console.warn('⚠️ Auth state listener failed, continuing in demo mode:', err);
      setLoading(false);
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      console.log('📊 Loading user profile for:', userId);
      console.log('⏱️ Starting profile load at:', new Date().toISOString());
      setProfileLoading(true);
      
      // First, get the authenticated user data for fallback
      const { data: { user: authUser } } = await supabase.auth.getUser();
      console.log('🔍 Auth user data:', authUser);

      // Load user profile with timeout - increased from 3s to 10s
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile load timeout')), 10000)
      );

      console.log('🔍 About to query user_profiles table for ID:', userId);
      
      const profilePromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      console.log('⏱️ Starting profile query race at:', new Date().toISOString());
      
      let { data: profile, error: profileError } = await Promise.race([
        profilePromise,
        timeoutPromise
      ]) as any;
      
      console.log('⏱️ Profile query completed at:', new Date().toISOString());
      console.log('📊 Profile query result:', { profile, profileError });

      if (profileError) {
        console.error('❌ Profile load error:', profileError);
        
        // Handle specific error cases
        if (profileError.message.includes('No rows returned')) {
          console.log('ℹ️ No profile found yet, will attempt to create one');
          // Don't throw, continue to profile creation logic
        } else if (profileError.message.includes('Demo mode') || profileError.message.includes('timeout')) {
          console.log('ℹ️ Demo mode or timeout detected');
          // Don't throw, continue to fallback logic
        } else {
          console.error('❌ Unexpected profile error, throwing:', profileError);
          throw profileError;
        }
      }

      // If no profile exists, try to create one with multiple fallback strategies
      if (!profile && !profileError?.message.includes('Demo mode') && !profileError?.message.includes('timeout')) {
        console.log('🔄 No user profile found, attempting to create one');
        console.log('🔍 Profile creation will be attempted for user ID:', userId);
        
        // Strategy 1: Try with auth user metadata
        if (authUser) {
          try {
            console.log('🔧 Strategy 1: Creating profile with auth metadata');
            const { error: createError } = await supabase
              .from('user_profiles')
              .insert({
                id: userId,
                name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
                email: authUser.email,
                level: 1,
                xp: 0,
                current_streak: 0,
                grade_level: 'high'
              });

            if (!createError) {
              console.log('✅ User profile created successfully with strategy 1');
              // Try to load the profile again
              const { data: newProfile, error: newProfileError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', userId)
                .single();

              if (newProfile && !newProfileError) {
                profile = newProfile;
                console.log('✅ New profile loaded:', newProfile);
              }
            } else {
              console.error('❌ Strategy 1 failed:', createError);
            }
          } catch (createErr) {
            console.error('❌ Error with strategy 1:', createErr);
          }
        }

        // Strategy 2: Try with minimal data if strategy 1 failed
        if (!profile) {
          try {
            console.log('🔧 Strategy 2: Creating profile with minimal data');
            const { error: createError } = await supabase
              .from('user_profiles')
              .insert({
                id: userId,
                name: 'User',
                email: authUser?.email || 'user@example.com',
                level: 1,
                xp: 0,
                current_streak: 0,
                grade_level: 'high'
              });

            if (!createError) {
              console.log('✅ User profile created successfully with strategy 2');
              // Try to load the profile again
              const { data: newProfile, error: newProfileError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', userId)
                .single();

              if (newProfile && !newProfileError) {
                profile = newProfile;
                console.log('✅ New profile loaded:', newProfile);
              }
            } else {
              console.error('❌ Strategy 2 failed:', createError);
            }
          } catch (createErr) {
            console.error('❌ Error with strategy 2:', createErr);
          }
        }
      }

      // If still no profile or in demo mode, create a user with actual auth data
      if (!profile || profileError?.message.includes('Demo mode') || profileError?.message.includes('timeout')) {
        console.log('🔄 Creating user profile with auth data');
        console.log('🔍 Using auth user for fallback:', authUser);
        
        const fallbackUser: User = {
          id: userId,
          name: authUser?.user_metadata?.name || authUser?.email?.split('@')[0] || 'User',
          email: authUser?.email || 'user@example.com',
          level: 1,
          xp: 0,
          currentStreak: 0,
          gradeLevel: 'high',
          achievements: [],
          completedModules: []
        };
        
        console.log('✅ Setting fallback user:', fallbackUser);
        setUser(fallbackUser);
        setError(profileError?.message.includes('Demo mode') ? 'Running in demo mode - database not connected' : null);
        setProfileLoading(false);
        return;
      }

      console.log('✅ User profile loaded successfully');

      // Load achievements and module progress with timeout
      const achievementsPromise = supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: false });

      const moduleProgressPromise = supabase
        .from('user_module_progress')
        .select('module_id')
        .eq('user_id', userId);

      const [achievementsResult, moduleProgressResult] = await Promise.allSettled([
        Promise.race([achievementsPromise, timeoutPromise]),
        Promise.race([moduleProgressPromise, timeoutPromise])
      ]);

      const achievements = achievementsResult.status === 'fulfilled' ? achievementsResult.value.data || [] : [];
      const moduleProgress = moduleProgressResult.status === 'fulfilled' ? moduleProgressResult.value.data || [] : [];

      const userProfile: User = {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        level: profile.level,
        xp: profile.xp,
        currentStreak: profile.current_streak,
        gradeLevel: profile.grade_level as 'middle' | 'high' | 'college',
        achievements: achievements.map((a: any) => ({
          id: a.achievement_id,
          title: a.title,
          description: a.description,
          icon: a.icon,
          rarity: a.rarity as 'common' | 'rare' | 'epic' | 'legendary',
          unlockedAt: new Date(a.unlocked_at)
        })),
        completedModules: moduleProgress.map((m: any) => m.module_id)
      };

      setUser(userProfile);
      setError(null);
      setProfileLoading(false);
    } catch (err) {
      console.error('❌ Error loading user profile, creating user with auth data:', err);
      setProfileLoading(false);
      try {
        // Get the actual authenticated user data
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const fallbackUser: User = {
          id: userId,
          name: authUser?.user_metadata?.name || authUser?.email?.split('@')[0] || 'User',
          email: authUser?.email || 'user@example.com',
          level: 1,
          xp: 0,
          currentStreak: 0,
          gradeLevel: 'high',
          achievements: [],
          completedModules: []
        };
        setUser(fallbackUser);
        setError('Running in demo mode - database not connected');
      } catch (authErr) {
        console.error('❌ Error getting auth user data:', authErr);
        // Only create true demo user if we can't get auth data
        const demoUser: User = {
          id: userId,
          name: 'Demo User',
          email: 'demo@example.com',
          level: 1,
          xp: 0,
          currentStreak: 0,
          gradeLevel: 'high',
          achievements: [],
          completedModules: []
        };
        setUser(demoUser);
        setError('Running in demo mode - database not connected');
      }
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      console.log('📝 Starting signup process for:', email);
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name
          }
        }
      });

      if (error) {
        console.error('❌ Signup error:', error);
        if (error.message.includes('Demo mode')) {
          // Create a demo user for demo mode
          const demoUser: User = {
            id: 'demo-' + Date.now(),
            name,
            email,
            level: 1,
            xp: 0,
            currentStreak: 0,
            gradeLevel: 'high',
            achievements: [],
            completedModules: []
          };
          setUser(demoUser);
          return { data: { user: { id: demoUser.id, email } }, error: null };
        }
        throw error;
      }

      console.log('✅ Signup successful:', data);

      // Create user profile if signup was successful
      if (data.user) {
        try {
          console.log('📊 Creating user profile for:', data.user.id);
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
              id: data.user.id,
              name: name,
              email: email,
              level: 1,
              xp: 0,
              current_streak: 0,
              grade_level: 'high'
            });

          if (profileError) {
            console.error('❌ Profile creation error:', profileError);
            // Don't throw error here, as the user account was created successfully
          } else {
            console.log('✅ User profile created successfully');
          }
        } catch (profileErr) {
          console.error('❌ Error creating user profile:', profileErr);
          // Don't throw error here, as the user account was created successfully
        }
      }

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign up failed';
      console.error('❌ Signup failed:', errorMessage);
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log('🔐 Starting Google signin process');
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });

      if (error) {
        console.error('❌ Google signin error:', error);
        if (error.message.includes('Demo mode')) {
          // Create a demo user for demo mode
          const demoUser: User = {
            id: 'demo-' + Date.now(),
            name: 'Demo User',
            email: 'demo@debateapp.com',
            level: 1,
            xp: 0,
            currentStreak: 0,
            gradeLevel: 'high',
            achievements: [],
            completedModules: []
          };
          setUser(demoUser);
          return { data: { user: { id: demoUser.id, email: 'demo@debateapp.com' } }, error: null };
        }
        throw error;
      }

      console.log('✅ Google signin initiated:', data);
      console.log('🔗 Redirect URL:', `${window.location.origin}/auth/callback`);
      console.log('📱 Provider:', 'google');
      
      // Store the OAuth state for debugging
      localStorage.setItem('oauth_provider', 'google');
      localStorage.setItem('oauth_timestamp', Date.now().toString());
      
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Google sign in failed';
      console.error('❌ Google signin failed:', errorMessage);
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Starting signin process for:', email);
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('❌ Signin error:', error);
        if (error.message.includes('Invalid login credentials')) {
          const errorMessage = 'Invalid email or password. Please check your credentials and try again.';
          setError(errorMessage);
          return { data: null, error: errorMessage };
        }
        if (error.message.includes('Demo mode')) {
          // Create a demo user for demo mode
          const demoUser: User = {
            id: 'demo-' + Date.now(),
            name: 'Demo User',
            email,
            level: 1,
            xp: 0,
            currentStreak: 0,
            gradeLevel: 'high',
            achievements: [],
            completedModules: []
          };
          setUser(demoUser);
          return { data: { user: { id: demoUser.id, email } }, error: null };
        }
        throw error;
      }

      console.log('✅ Signin successful:', data);
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign in failed';
      console.error('❌ Signin failed:', errorMessage);
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      console.log('🚪 Starting signout process');
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error && !error.message.includes('Demo mode')) {
        throw error;
      }

      setUser(null);
      setSupabaseUser(null);
      console.log('✅ Signout successful');
    } catch (err) {
      console.error('❌ Error signing out:', err);
      // Force logout even if there's an error
      setUser(null);
      setSupabaseUser(null);
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = () => {
    console.log('🚀 Starting demo login');
    setLoading(true);

    // Create a demo user
    const demoUser: User = {
      id: 'demo-' + Date.now(),
      name: 'Demo User',
      email: 'demo@debateapp.com',
      level: 5,
      xp: 1250,
      currentStreak: 7,
      gradeLevel: 'high',
      achievements: [
        {
          id: 'first-debate',
          title: 'First Debate',
          description: 'Completed your first debate session',
          icon: '🎯',
          rarity: 'common',
          unlockedAt: new Date(Date.now() - 86400000 * 3) // 3 days ago
        },
        {
          id: 'streak-master',
          title: 'Streak Master',
          description: 'Maintained a 7-day learning streak',
          icon: '🔥',
          rarity: 'rare',
          unlockedAt: new Date(Date.now() - 86400000) // 1 day ago
        }
      ],
      completedModules: ['intro-to-debate', 'argument-structure', 'rebuttal-techniques']
    };

    setUser(demoUser);
    setSupabaseUser({
      id: demoUser.id,
      email: demoUser.email,
      user_metadata: { name: demoUser.name }
    } as any);
    setError(null);
    setLoading(false);
    console.log('✅ Demo login successful');
  };

  const updateUserProgress = async (moduleId: string, xpGained: number) => {
    if (!user) return;

    try {
      // Update module progress
      const { error: _moduleError } = await supabase
        .from('user_module_progress')
        .upsert({
          user_id: user.id,
          module_id: moduleId,
          xp_gained: xpGained,
          score: 100 // Default score, can be customized
        });

      // Update user profile
      const newXp = user.xp + xpGained;
      const newLevel = Math.floor(newXp / 200) + 1;
      const newStreak = user.currentStreak + 1;

      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          xp: newXp,
          level: newLevel,
          current_streak: newStreak
        })
        .eq('id', user.id);

      // Update local state even if database update fails (demo mode)
      setUser(prev => prev ? {
        ...prev,
        xp: newXp,
        level: newLevel,
        currentStreak: newStreak,
        completedModules: [...prev.completedModules, moduleId]
      } : null);

    } catch (err) {
      console.error('Error updating user progress:', err);
      // Update local state for demo mode
      const newXp = user.xp + xpGained;
      const newLevel = Math.floor(newXp / 200) + 1;
      const newStreak = user.currentStreak + 1;

      setUser(prev => prev ? {
        ...prev,
        xp: newXp,
        level: newLevel,
        currentStreak: newStreak,
        completedModules: [...prev.completedModules, moduleId]
      } : null);
    }
  };

  const addAchievement = async (achievement: {
    id: string;
    title: string;
    description: string;
    icon: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  }) => {
    if (!user) return;

    try {
      const { error: _error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: user.id,
          achievement_id: achievement.id,
          title: achievement.title,
          description: achievement.description,
          icon: achievement.icon,
          rarity: achievement.rarity
        });

      // Update local state even if database update fails (demo mode)
      setUser(prev => prev ? {
        ...prev,
        achievements: [...prev.achievements, {
          ...achievement,
          unlockedAt: new Date()
        }]
      } : null);

    } catch (err) {
      console.error('Error adding achievement:', err);
      // Update local state for demo mode
      setUser(prev => prev ? {
        ...prev,
        achievements: [...prev.achievements, {
          ...achievement,
          unlockedAt: new Date()
        }]
      } : null);
    }
  };

  const saveDebateSession = async (
    topic: string,
    userSide: 'pro' | 'con',
    finalScore: number,
    xpGained: number,
    roundsCompleted: number
  ) => {
    if (!user) return;

    try {
      const { error: _sessionError } = await supabase
        .from('debate_sessions')
        .insert({
          user_id: user.id,
          topic,
          user_side: userSide,
          final_score: finalScore,
          xp_gained: xpGained,
          rounds_completed: roundsCompleted
        });

      // Update user XP
      const newXp = user.xp + xpGained;
      const newLevel = Math.floor(newXp / 200) + 1;

      const { error: _updateProfileError } = await supabase
        .from('user_profiles')
        .update({
          xp: newXp,
          level: newLevel
        })
        .eq('id', user.id);

      // Update local state even if database update fails (demo mode)
      setUser(prev => prev ? {
        ...prev,
        xp: newXp,
        level: newLevel
      } : null);

    } catch (err) {
      console.error('Error saving debate session:', err);
      // Update local state for demo mode
      const newXp = user.xp + xpGained;
      const newLevel = Math.floor(newXp / 200) + 1;

      setUser(prev => prev ? {
        ...prev,
        xp: newXp,
        level: newLevel
      } : null);
    }
  };

  return {
    user,
    supabaseUser,
    loading,
    profileLoading,
    error,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    demoLogin,
    updateUserProgress,
    addAchievement,
    saveDebateSession
  };
};