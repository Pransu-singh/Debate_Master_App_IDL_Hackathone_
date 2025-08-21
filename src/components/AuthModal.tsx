import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, Rocket } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: (email: string, password: string) => Promise<{ data: any; error: string | null }>;
  onSignUp: (email: string, password: string, name: string) => Promise<{ data: any; error: string | null }>;
  onSignInWithGoogle: () => Promise<{ data: any; error: string | null }>;
  onDemoLogin: () => void;
  loading: boolean;
  error: string | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSignIn,
  onSignUp,
  onSignInWithGoogle,
  onDemoLogin,
  loading,
  error
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const validateForm = () => {
    const errors: string[] = [];

    if (mode === 'signup' && !formData.name.trim()) {
      errors.push('Name is required');
    }

    if (!formData.email.trim()) {
      errors.push('Email is required');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.push('Please enter a valid email address');
    }

    if (!formData.password) {
      errors.push('Password is required');
    } else if (formData.password.length < 6) {
      errors.push('Password must be at least 6 characters');
    }

    if (mode === 'signup' && formData.password !== formData.confirmPassword) {
      errors.push('Passwords do not match');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      if (mode === 'signin') {
        const result = await onSignIn(formData.email, formData.password);
        if (result.data && !result.error) {
          onClose();
          resetForm();
        }
      } else {
        const result = await onSignUp(formData.email, formData.password, formData.name);
        if (result.data && !result.error) {
          // Show success message for signup
          setMode('signin');
          resetForm();
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
    setValidationErrors([]);
  };

  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-gradient-to-br from-indigo-900/80 via-purple-900/80 to-blue-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl max-w-md w-full p-8 max-h-[90vh] overflow-y-auto scrollbar-hide"
          onClick={(e) => e.stopPropagation()}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">
              {mode === 'signin' ? 'Welcome to DebateMaster!' : 'Join DebateMaster'}
            </h2>
            <p className="text-gray-300">
              {mode === 'signin' ? 'Sign in to continue your debate journey' : 'Create your account to get started'}
            </p>
            <p className="text-blue-300 text-sm mt-2">
              Quick access with Google available
            </p>
          </div>

          {/* Error Display */}
          {(error || validationErrors.length > 0) && (
            <div className="mb-6 p-4 bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-2xl">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-300 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  {error && (
                    <div className="text-red-200 font-medium text-sm mb-2">
                      {error}
                      {error.includes('Invalid email or password') && (
                        <div className="mt-2 text-red-300 text-xs">
                          <p>• Make sure you're using the correct email address</p>
                          <p>• Check that your password is entered correctly</p>
                          <p>• If you don't have an account, click "Sign Up" below</p>
                        </div>
                      )}
                      {error.includes('Google sign in failed') && (
                        <div className="mt-2 text-red-300 text-xs">
                          <p>• Make sure you have a Google account</p>
                          <p>• Check your internet connection</p>
                          <p>• Try again or use email signup instead</p>
                        </div>
                      )}
                    </div>
                  )}
                  {validationErrors.map((err, index) => (
                    <p key={index} className="text-red-300 text-sm">{err}</p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Google Sign In Button */}
          <div className="mb-6">
            <button
              type="button"
              onClick={onSignInWithGoogle}
              disabled={loading}
              className="w-full bg-white text-gray-900 py-3 rounded-2xl font-semibold hover:bg-gray-100 hover:shadow-xl disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center shadow-lg gap-3 border border-gray-200 transform hover:scale-[1.02]"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-900 border-t-transparent" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              {loading ? 'Connecting to Google...' : 'Continue with Google'}
            </button>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300/30"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-gray-300">or continue with email</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-300" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-white placeholder-gray-300"
                    placeholder="Enter your full name"
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-300" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-white placeholder-gray-300"
                  placeholder="Enter your email"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-300" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-12 py-3 bg-white/10 backdrop-blur-sm rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-white placeholder-gray-300"
                  placeholder="Enter your password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-300 hover:text-blue-200"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-300" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-white placeholder-gray-300"
                    placeholder="Confirm your password"
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-2xl font-semibold hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center shadow-lg"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                mode === 'signin' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          {/* Demo Login Button */}
          <div className="mt-4">
            <button
              type="button"
              onClick={onDemoLogin}
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-2xl font-semibold hover:from-green-600 hover:to-emerald-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center shadow-lg gap-2"
            >
              <Rocket className="h-5 w-5" />
              Try Demo Mode
            </button>
            <p className="text-xs text-gray-300 text-center mt-2">
              Experience the full app without creating an account
            </p>
          </div>

          {/* Mode Switch */}
          <div className="mt-6 text-center">
            <p className="text-gray-300">
              {mode === 'signin' ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={switchMode}
                className="ml-2 text-blue-400 hover:text-blue-300 font-medium transition-colors"
                disabled={loading}
              >
                {mode === 'signin' ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};