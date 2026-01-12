import PropTypes from 'prop-types';
import './TimelineLoader.css';

/**
 * TimelineLoader Component
 * An animated loading spinner based on a stylized Gantt timeline design
 * Features colorful bars that animate to represent the YearLine brand
 * @param {string} size - 'sm', 'md', 'lg', or 'xl'
 * @param {string} className - Additional CSS classes
 */
function TimelineLoader({ size = 'md', className = '' }) {
  // Size mapping
  const sizeClasses = {
    sm: 'timeline-loader-sm',
    md: 'timeline-loader-md',
    lg: 'timeline-loader-lg',
    xl: 'timeline-loader-xl',
  };

  return (
    <div className={`timeline-loader ${sizeClasses[size]} ${className}`}>
      <svg viewBox="0 0 120 120" className="timeline-loader-svg">
        <defs>
          <clipPath id="circleClipLoader">
            <circle cx="60" cy="60" r="55"/>
          </clipPath>
          <linearGradient id="shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.3)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>
        
        <style>
          {`
            @keyframes bar-slide-in {
              0% { 
                transform: scaleX(0);
                opacity: 0;
              }
              60% {
                transform: scaleX(1.05);
                opacity: 1;
              }
              100% { 
                transform: scaleX(1);
                opacity: 1;
              }
            }
            
            @keyframes bar-pulse {
              0%, 100% { 
                opacity: 0.9;
              }
              50% { 
                opacity: 1;
              }
            }
            
            @keyframes shimmer-move {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(200%); }
            }
            
            .timeline-bar {
              transform-origin: left center;
              animation: bar-slide-in 0.5s ease-out forwards, bar-pulse 2s ease-in-out infinite;
              animation-delay: var(--delay), calc(var(--delay) + 0.5s);
              opacity: 0;
            }
            
            .timeline-bar-shimmer {
              animation: shimmer-move 2s ease-in-out infinite;
              animation-delay: var(--delay);
            }
          `}
        </style>
        
        {/* Clipped content */}
        <g clipPath="url(#circleClipLoader)">
          {/* Gantt bars - Row 1 */}
          <g>
            <rect x="15" y="20" width="50" height="10" rx="5" fill="#ec4899" className="timeline-bar" style={{ '--delay': '0ms' }}/>
            <rect x="15" y="20" width="50" height="10" rx="5" fill="url(#shimmer)" className="timeline-bar timeline-bar-shimmer" style={{ '--delay': '500ms' }}/>
          </g>
          
          {/* Gantt bars - Row 2 */}
          <g>
            <rect x="25" y="36" width="60" height="10" rx="5" fill="#3b82f6" className="timeline-bar" style={{ '--delay': '100ms' }}/>
            <rect x="25" y="36" width="60" height="10" rx="5" fill="url(#shimmer)" className="timeline-bar timeline-bar-shimmer" style={{ '--delay': '600ms' }}/>
          </g>
          
          {/* Gantt bars - Row 3 */}
          <g>
            <rect x="18" y="52" width="40" height="10" rx="5" fill="#10b981" className="timeline-bar" style={{ '--delay': '200ms' }}/>
            <rect x="18" y="52" width="40" height="10" rx="5" fill="url(#shimmer)" className="timeline-bar timeline-bar-shimmer" style={{ '--delay': '700ms' }}/>
            <rect x="63" y="52" width="45" height="10" rx="5" fill="#8b5cf6" className="timeline-bar" style={{ '--delay': '250ms' }}/>
            <rect x="63" y="52" width="45" height="10" rx="5" fill="url(#shimmer)" className="timeline-bar timeline-bar-shimmer" style={{ '--delay': '750ms' }}/>
          </g>
          
          {/* Gantt bars - Row 4 */}
          <g>
            <rect x="28" y="68" width="55" height="10" rx="5" fill="#f97316" className="timeline-bar" style={{ '--delay': '300ms' }}/>
            <rect x="28" y="68" width="55" height="10" rx="5" fill="url(#shimmer)" className="timeline-bar timeline-bar-shimmer" style={{ '--delay': '800ms' }}/>
          </g>
          
          {/* Gantt bars - Row 5 */}
          <g>
            <rect x="20" y="84" width="48" height="10" rx="5" fill="#06b6d4" className="timeline-bar" style={{ '--delay': '400ms' }}/>
            <rect x="20" y="84" width="48" height="10" rx="5" fill="url(#shimmer)" className="timeline-bar timeline-bar-shimmer" style={{ '--delay': '900ms' }}/>
          </g>
        </g>
      </svg>
    </div>
  );
}

TimelineLoader.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  className: PropTypes.string,
};

export default TimelineLoader;
