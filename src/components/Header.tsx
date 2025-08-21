import React, { useState } from 'react';
import { User, Trophy, Settings, Zap, Key, LogOut, LogIn, Menu, X } from 'lucide-react';
import { User as UserType } from '../types';
import { ApiKeySetup } from './ApiKeySetup';

interface HeaderProps {
  user: UserType | null;
  currentView: string;
  onViewChange: (view: string) => void;
  onSignOut?: () => void;
  onAuthClick?: () => void;
  loading?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  user, 
  currentView, 
  onViewChange, 
  onSignOut,
  onAuthClick,
  loading = false
}) => {
  const [showApiSetup, setShowApiSetup] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  const aiConfigured = !!import.meta.env.VITE_GEMINI_API_KEY || !!localStorage.getItem('gemini_api_key');

  const xpToNextLevel = user ? ((user.level) * 200) - user.xp : 0;
  const xpProgress = user ? (user.xp % 200) / 200 * 100 : 0;

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'learn', label: 'Learn' },
    { id: 'practice', label: 'Practice' },
    { id: 'achievements', label: 'Achievements' }
  ];

  const handleMobileMenuClick = (viewId: string) => {
    onViewChange(viewId);
    setShowMobileMenu(false);
  };

  const handleLogoClick = () => {
    if (user) {
      onViewChange('dashboard');
    }
  };

  return (
    <>
      <header className="bg-white shadow-lg border-b-2 border-blue-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo - Clickable to go to dashboard */}
            <div 
              className={`flex items-center space-x-2 sm:space-x-3 ${user ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
              onClick={handleLogoClick}
            >
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  DebateMaster
                </h1>
                {/* AI Enhanced Badge - Better mobile positioning */}
                {aiConfigured && (
                  <div className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-medium flex items-center w-fit">
                    <Zap className="h-2.5 w-2.5 mr-1" />
                    <span>AI Enhanced</span>
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Navigation */}
            {user && (
              <nav className="hidden lg:flex space-x-6">
                {navigationItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onViewChange(item.id)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentView === item.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            )}

            {/* Right Side Controls */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* API Setup Button */}
              {!aiConfigured && user && (
                <button
                  onClick={() => setShowApiSetup(true)}
                  className="bg-blue-600 text-white px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Key className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Setup AI</span>
                  <span className="sm:hidden">AI</span>
                </button>
              )}
              
              {user ? (
                <>
                  {/* User Progress (Desktop) */}
                  <div className="hidden md:block text-right">
                    <div className="text-sm font-medium text-gray-900 truncate max-w-32">{user.name}</div>
                    <div className="flex items-center space-x-2">
                      <div className="text-xs text-gray-600">Level {user.level}</div>
                      <div className="w-12 sm:w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                          style={{ width: `${xpProgress}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-600">{user.xp}</div>
                    </div>
                  </div>
                  
                  {/* Mobile Menu Button */}
                  <button
                    onClick={() => setShowMobileMenu(!showMobileMenu)}
                    className="lg:hidden bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-full hover:shadow-lg transition-shadow relative z-50"
                  >
                    {showMobileMenu ? (
                      <X className="h-5 w-5 text-white" />
                    ) : (
                      <Menu className="h-5 w-5 text-white" />
                    )}
                  </button>

                  {/* Desktop User Menu */}
                  <div className="hidden lg:block relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-full hover:shadow-lg transition-shadow"
                    >
                      <User className="h-5 w-5 text-white" />
                    </button>
                    
                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <div className="text-sm font-medium text-gray-900 truncate">{user.name}</div>
                          <div className="text-xs text-gray-600 truncate">{user.email}</div>
                        </div>
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            onSignOut?.();
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <button
                  onClick={onAuthClick}
                  disabled={loading}
                  className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:bg-gray-300 text-sm"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  ) : (
                    <LogIn className="h-4 w-4 mr-1 sm:mr-2" />
                  )}
                  <span className="hidden sm:inline">{loading ? 'Loading...' : 'Sign In'}</span>
                  <span className="sm:hidden">{loading ? '...' : 'Sign In'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay - Fixed positioning to prevent content push */}
        {showMobileMenu && user && (
          <>
            {/* Backdrop */}
            <div 
              className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setShowMobileMenu(false)}
            />
            
            {/* Mobile Menu - Fixed positioning */}
            <div className="lg:hidden fixed top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50 max-h-[calc(100vh-4rem)] overflow-y-auto">
              {/* User Info Section */}
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                <div className="text-xs text-gray-600">{user.email}</div>
                <div className="flex items-center space-x-2 mt-2">
                  <div className="text-xs text-gray-600">Level {user.level}</div>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                      style={{ width: `${xpProgress}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-600">{user.xp} XP</div>
                </div>
                {/* AI Status in Mobile Menu */}
                {aiConfigured && (
                  <div className="mt-2">
                    <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium flex items-center w-fit">
                      <Zap className="h-3 w-3 mr-1" />
                      AI Enhanced
                    </div>
                  </div>
                )}
              </div>
              
              {/* Navigation Items */}
              <nav className="py-2">
                {navigationItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleMobileMenuClick(item.id)}
                    className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                      currentView === item.id
                        ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-600'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
              
              {/* Sign Out Button */}
              <div className="border-t border-gray-100 py-2">
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    onSignOut?.();
                  }}
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </button>
              </div>
            </div>
          </>
        )}
        
        {/* Click outside to close desktop user menu */}
        {showUserMenu && (
          <div 
            className="fixed inset-0 z-30" 
            onClick={() => setShowUserMenu(false)}
          />
        )}
      </header>

      {showApiSetup && <ApiKeySetup onClose={() => setShowApiSetup(false)} />}
    </>
  );
};