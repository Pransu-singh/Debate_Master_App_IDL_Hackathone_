import React, { useState, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { AlertCircle, Clock, Zap, BarChart3 } from 'lucide-react';

export const QuotaDisplay: React.FC = () => {
  const [quotaStatus, setQuotaStatus] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateQuota = () => {
      const status = geminiService.getQuotaStatus();
      setQuotaStatus(status);
    };

    // Update immediately
    updateQuota();

    // Update every 30 seconds
    const interval = setInterval(updateQuota, 30000);

    return () => clearInterval(interval);
  }, []);

  if (!quotaStatus) return null;

  const { 
    dailyCallCount, 
    dailyCallLimit, 
    dailyTokenCount, 
    dailyTokenLimit,
    callsRemaining, 
    tokensRemaining, 
    isQuotaExceeded, 
    nextReset 
  } = quotaStatus;

  const callPercentage = (dailyCallCount / dailyCallLimit) * 100;
  const tokenPercentage = (dailyTokenCount / dailyTokenLimit) * 100;

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-500';
    if (percentage >= 75) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getBarColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
        title="API Quota Status"
      >
        <BarChart3 className="h-5 w-5" />
      </button>

      {isVisible && (
        <div className="absolute bottom-16 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 w-80">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              API Quota Status
            </h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ×
            </button>
          </div>

          {isQuotaExceeded && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center text-red-800 dark:text-red-200">
                <AlertCircle className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Quota Exceeded</span>
              </div>
              <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                Wait until {nextReset} for quota reset
              </p>
            </div>
          )}

          {/* API Calls */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                API Calls
              </span>
              <span className={`text-sm font-bold ${getStatusColor(callPercentage)}`}>
                {callsRemaining} remaining
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getBarColor(callPercentage)}`}
                style={{ width: `${Math.min(callPercentage, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>{dailyCallCount}</span>
              <span>{dailyCallLimit}</span>
            </div>
          </div>

          {/* Token Usage */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Token Usage
              </span>
              <span className={`text-sm font-bold ${getStatusColor(tokenPercentage)}`}>
                {tokensRemaining.toLocaleString()} remaining
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getBarColor(tokenPercentage)}`}
                style={{ width: `${Math.min(tokenPercentage, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>{dailyTokenCount.toLocaleString()}</span>
              <span>{dailyTokenLimit.toLocaleString()}</span>
            </div>
          </div>

          {/* Reset Timer */}
          <div className="flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
            <Clock className="h-3 w-3 mr-1" />
            <span>Resets in {nextReset}</span>
          </div>

          {/* Free Tier Info */}
          <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center text-blue-800 dark:text-blue-200">
              <Zap className="h-3 w-3 mr-1" />
              <span className="text-xs font-medium">Free Tier Limits</span>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
              50 requests/day • 15K tokens/day • 1 request/minute
            </p>
          </div>
        </div>
      )}
    </div>
  );
}; 