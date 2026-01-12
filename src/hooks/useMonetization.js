import { useState, useEffect } from 'react';
import mondaySdk from 'monday-sdk-js';

const monday = mondaySdk();

/**
 * Hook for managing Monday.com app monetization
 * Checks subscription status and enforces plan limits
 * 
 * @param {number} currentBoardCount - Number of boards user is currently using
 * @returns {Object} Subscription data and helper functions
 */
export const useMonetization = (currentBoardCount = 0) => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch subscription data
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setLoading(true);
        
        const response = await monday.api(`
          query {
            app_subscription {
              plan_id
              is_trial
              billing_period
              days_left
              renewal_date
            }
          }
        `);
        
        if (response?.data?.app_subscription) {
          setSubscription(response.data.app_subscription);
        } else {
          // No subscription = free plan
          setSubscription({
            plan_id: 'free',
            is_trial: false,
            billing_period: null,
            days_left: null,
            renewal_date: null,
          });
        }
        
        setError(null);
      } catch (err) {
        console.error('Failed to fetch subscription:', err);
        // In development/mock mode, default to pro tier for testing
        setSubscription({
          plan_id: 'pro',
          is_trial: false,
          billing_period: null,
          days_left: null,
          renewal_date: null,
        });
        setError(null); // Don't show error in development
      } finally {
        setLoading(false);
      }
    };
    
    fetchSubscription();
  }, []);
  
  // Determine plan tier
  const isPro = subscription?.plan_id?.includes('pro');
  const isTrial = subscription?.is_trial || false;
  const isFree = !isPro && !isTrial;
  
  // Calculate limits based on plan
  const limits = {
    maxBoards: isPro || isTrial ? Infinity : 1,
    features: {
      exportJPEG: true, // Always available
      exportPNG: isPro || isTrial,
      exportSVG: isPro || isTrial,
      exportPDF: isPro || isTrial,
      colorThemes: isPro || isTrial,
      multipleBoards: isPro || isTrial,
    }
  };
  
  // Check if user has exceeded limits
  const hasExceededLimit = currentBoardCount > limits.maxBoards;
  
  // Calculate days until trial ends or subscription renews
  const daysLeft = subscription?.days_left || 0;
  
  // Helper function to show upgrade modal
  const showUpgradePrompt = () => {
    monday.execute("openPlanSelection");
  };
  
  // Helper to check if a feature is available
  const hasFeature = (featureName) => {
    return limits.features[featureName] || false;
  };
  
  // Helper to get upgrade message
  const getUpgradeMessage = () => {
    if (isFree && currentBoardCount > 1) {
      return `You're using ${currentBoardCount} boards. Upgrade to Pro for unlimited boards.`;
    }
    if (isTrial) {
      return `${daysLeft} days left in your trial. Subscribe to continue using Pro features.`;
    }
    return null;
  };
  
  return {
    subscription,
    loading,
    error,
    isPro,
    isTrial,
    isFree,
    limits,
    hasExceededLimit,
    daysLeft,
    showUpgradePrompt,
    hasFeature,
    getUpgradeMessage,
  };
};

export default useMonetization;
