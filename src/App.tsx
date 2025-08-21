import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { LearningPath } from './components/LearningPath';
import { LearningModule } from './components/LearningModule';
import { PracticeDebate } from './components/PracticeDebate';
import { Achievements } from './components/Achievements';
import { AuthModal } from './components/AuthModal';
import { LandingPage } from './components/LandingPage';
import { Footer } from './components/Footer';
import { LoadingScreen } from './components/LoadingScreen';
import { QuotaDisplay } from './components/QuotaDisplay';
import { useAuth } from './hooks/useAuth';
import { Module } from './types';
import { supabase } from './lib/supabase';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [splashDone, setSplashDone] = useState(false);

  const {
    user,
    loading,
    error,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    demoLogin,
    updateUserProgress,
    addAchievement,
    saveDebateSession
  } = useAuth();

  // Ensure the loading screen shows for at least 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => setSplashDone(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Show landing page for unauthenticated users
  useEffect(() => {
    if (user) {
      setShowLanding(false);
    } else if (!loading) {
      setShowLanding(true);
    }
  }, [user, loading]);

  // Handle OAuth callback
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const provider = urlParams.get('provider');
        
        if (code && provider) {
          console.log('🔄 OAuth callback detected:', { code, provider });
          
          // Clear the URL parameters
          window.history.replaceState({}, document.title, window.location.pathname);
          
          // Wait a bit longer for Supabase to process the OAuth callback
          console.log('⏳ Waiting for OAuth processing...');
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Check if user is now authenticated
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (session?.user) {
            console.log('✅ OAuth authentication successful:', session.user.email);
            // Force a session refresh to ensure the auth state is properly updated
            await supabase.auth.refreshSession();
            console.log('🔄 Session refreshed, auth state should update automatically');
          } else if (error) {
            console.error('❌ OAuth callback error:', error);
          } else {
            console.log('⚠️ OAuth callback completed but no session found');
          }
        }
      } catch (err) {
        console.error('❌ Error handling OAuth callback:', err);
      }
    };

    handleAuthCallback();
  }, []);

  const handleModuleComplete = async (moduleId: string, xpGained: number) => {
    if (!user) return;

    await updateUserProgress(moduleId, xpGained);
    setSelectedModule(null);
    setCurrentView('learn');

    // Check for achievements
    if (user.completedModules.length === 0) {
      await addAchievement({
        id: 'first-steps',
        title: 'First Steps',
        description: 'Complete your first learning module',
        icon: '🎯',
        rarity: 'common'
      });
    }
  };

  const handlePracticeComplete = async (
    topic: string,
    userSide: 'pro' | 'con',
    finalScore: number,
    xpGained: number,
    roundsCompleted: number
  ) => {
    if (!user) return;

    await saveDebateSession(topic, userSide, finalScore, xpGained, roundsCompleted);
    setCurrentView('practice');
  };

  const handleGetStarted = () => {
    setShowLanding(false);
    setShowAuthModal(true);
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    setCurrentView('dashboard');
  };

  const renderCurrentView = () => {
    if (!user) return null;

    if (selectedModule) {
      return (
        <LearningModule
          module={selectedModule}
          onComplete={handleModuleComplete}
          onBack={() => setSelectedModule(null)}
        />
      );
    }

    switch (currentView) {
      case 'learn':
        return (
          <LearningPath
            user={user}
            onModuleSelect={setSelectedModule}
          />
        );
      case 'practice':
        return (
          <PracticeDebate
            onComplete={(xpGained) => {
              // For backward compatibility, we'll use default values
              handlePracticeComplete('Practice Debate', 'pro', 75, xpGained, 3);
            }}
            onBack={() => setCurrentView('practice')}
          />
        );
      case 'achievements':
        return <Achievements user={user} />;
      default:
        return (
          <Dashboard
            user={user}
            onNavigate={setCurrentView}
          />
        );
    }
  };

  // Loading gate (at least 3s)
  if (!splashDone || loading) {
    return <LoadingScreen />;
  }

  // Show landing page for unauthenticated users
  if (showLanding && !user) {
    return (
      <>
        <LandingPage onGetStarted={handleGetStarted} />
        <Footer />
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSignIn={signIn}
          onSignUp={signUp}
          onSignInWithGoogle={signInWithGoogle}
          onDemoLogin={() => {
            demoLogin();
            setShowAuthModal(false);
          }}
          loading={loading}
          error={error}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      <Header
        user={user}
        currentView={currentView}
        onViewChange={setCurrentView}
        onSignOut={signOut}
        onAuthClick={() => setShowAuthModal(true)}
        loading={loading}
      />

      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView + (selectedModule ? '-module' : '')}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderCurrentView()}
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSignIn={signIn}
        onSignUp={signUp}
        onSignInWithGoogle={signInWithGoogle}
        onDemoLogin={() => {
          demoLogin();
          setShowAuthModal(false);
        }}
        loading={loading}
        error={error}
      />

      {/* API Quota Display */}
      <QuotaDisplay />
    </div>
  );
}

export default App;