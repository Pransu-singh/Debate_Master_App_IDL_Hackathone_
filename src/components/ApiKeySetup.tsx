import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Key, Zap, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { geminiService } from '../services/geminiService';

interface ApiKeySetupProps {
  onClose: () => void;
}

export const ApiKeySetup: React.FC<ApiKeySetupProps> = ({ onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<'success' | 'error' | null>(null);

  const handleSave = async () => {
    if (!apiKey.trim()) return;
    
    setIsValidating(true);
    setValidationResult(null);
    
    try {
      // Basic validation - Gemini API keys start with 'AIza'
      if (apiKey.startsWith('AIza') && apiKey.length > 20) {
        // Store the API key
        localStorage.setItem('gemini_api_key', apiKey);
        
        // Reinitialize the service
        geminiService.reinitialize();
        
        setValidationResult('success');
        
        setTimeout(() => {
          window.location.reload(); // Reload to apply changes
        }, 1500);
      } else {
        setValidationResult('error');
      }
    } catch (error) {
      console.error('API key validation error:', error);
      setValidationResult('error');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-4 sm:p-8 max-h-[90vh] overflow-y-auto"
      >
        <div className="text-center mb-4 sm:mb-6">
          <div className="bg-blue-100 p-2 sm:p-3 rounded-full w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 flex items-center justify-center">
            <Key className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Setup Gemini AI</h2>
          <p className="text-gray-600 text-sm sm:text-base">
            Add your Gemini API key to unlock intelligent debate features
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gemini API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIza..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              disabled={isValidating}
            />
          </div>

          <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2 text-sm sm:text-base">How to get your API key:</h3>
            <ol className="text-xs sm:text-sm text-blue-800 space-y-1">
              <li>1. Visit Google AI Studio</li>
              <li>2. Sign in with your Google account</li>
              <li>3. Create a new API key</li>
              <li>4. Copy and paste it here</li>
            </ol>
            <a
              href="https://makersuite.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 mt-2 text-xs sm:text-sm font-medium"
            >
              Get API Key <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </div>

          {validationResult === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mr-2" />
                <span className="text-green-800 font-medium text-sm sm:text-base">API key saved successfully!</span>
              </div>
              <p className="text-green-700 text-xs sm:text-sm mt-1">Reloading to enable AI features...</p>
            </div>
          )}

          {validationResult === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 mr-2" />
                <span className="text-red-800 font-medium text-sm sm:text-base">Invalid API key format</span>
              </div>
              <p className="text-red-700 text-xs sm:text-sm mt-1">Please check your API key and try again. It should start with "AIza".</p>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm sm:text-base"
              disabled={isValidating}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!apiKey.trim() || isValidating}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-sm sm:text-base"
            >
              {isValidating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Zap className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Enable AI
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-4 sm:mt-6 text-center">
          <p className="text-xs text-gray-500">
            Your API key is stored locally and never shared
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};