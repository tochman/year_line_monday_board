import React from 'react';
import { AttentionBox, Button, Flex } from '@vibe/core';
import { Upgrade } from '@vibe/icons';
import './UpgradePrompt.css';

/**
 * Component to prompt users to upgrade from free to Pro plan
 */
const UpgradePrompt = ({ 
  message, 
  onUpgrade, 
  type = "primary",
  showTrialInfo = false,
  daysLeft = 0 
}) => {
  return (
    <div className="upgrade-prompt-container">
      <AttentionBox
        title={showTrialInfo ? "Trial Ending Soon" : "Upgrade to Pro"}
        text={message || "Unlock all features with YearWheel Pro"}
        type={type}
        className="upgrade-attention-box"
      >
        <Flex gap="medium" direction="column" align="stretch">
          {showTrialInfo && (
            <div className="trial-info">
              <strong>{daysLeft} days left</strong> in your trial
            </div>
          )}
          
          <div className="upgrade-features">
            <ul>
              <li>✓ Unlimited boards</li>
              <li>✓ SVG & PDF exports</li>
              <li>✓ All color themes</li>
              <li>✓ Priority support</li>
            </ul>
          </div>
          
          <div className="upgrade-pricing">
            <div className="pricing-option">
              <span className="plan-name">Monthly</span>
              <span className="plan-price">€6/month</span>
            </div>
            <div className="pricing-option best-value">
              <span className="plan-name">Annual <span className="badge">Save 17%</span></span>
              <span className="plan-price">€60/year</span>
              <span className="plan-detail">€5/month</span>
            </div>
          </div>
          
          <Button 
            onClick={onUpgrade}
            kind="primary"
            size="medium"
            className="upgrade-button"
          >
            <Upgrade /> Upgrade Now
          </Button>
          
          <div className="upgrade-note">
            7-day free trial • Cancel anytime
          </div>
        </Flex>
      </AttentionBox>
    </div>
  );
};

export default UpgradePrompt;
