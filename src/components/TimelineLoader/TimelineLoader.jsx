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
      <svg viewBox="0 0 360 360" className="timeline-loader-svg">
        <defs>
          <clipPath id="circleClipLoader">
            <circle cx="180" cy="180" r="170"/>
          </clipPath>
          <linearGradient id="shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.3)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>
        
        <style>
          {`
            @keyframes spin-slow {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            
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
            
            @keyframes fade-in {
              0% { opacity: 0; }
              100% { opacity: 1; }
            }
            
            .loader-content {
              animation: spin-slow 20s linear infinite;
              transform-origin: center;
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
            
            .fade-in {
              animation: fade-in 0.3s ease-out forwards;
              opacity: 0;
            }
            
            .today-line {
              animation: bar-pulse 1.5s ease-in-out infinite;
            }
          `}
        </style>
        
        {/* Background circle */}
        <circle cx="180" cy="180" r="170" fill="#ffffff"/>
        
        {/* Clipped content */}
        <g clipPath="url(#circleClipLoader)" className="loader-content">
          {/* Left sidebar */}
          <rect x="10" y="10" width="63" height="340" fill="#f8fafc" className="fade-in" style={{ animationDelay: '0ms' }}/>
          <line x1="73" y1="10" x2="73" y2="350" stroke="#e2e8f0" strokeWidth="1"/>
          
          {/* Header row */}
          <rect x="10" y="10" width="340" height="32" fill="#f1f5f9" className="fade-in" style={{ animationDelay: '50ms' }}/>
          <line x1="10" y1="42" x2="350" y2="42" stroke="#e2e8f0" strokeWidth="1"/>
          
          {/* Header time markers */}
          <line x1="135" y1="10" x2="135" y2="42" stroke="#cbd5e1" strokeWidth="1" className="fade-in" style={{ animationDelay: '100ms' }}/>
          <line x1="190" y1="10" x2="190" y2="42" stroke="#cbd5e1" strokeWidth="1" className="fade-in" style={{ animationDelay: '120ms' }}/>
          <line x1="245" y1="10" x2="245" y2="42" stroke="#cbd5e1" strokeWidth="1" className="fade-in" style={{ animationDelay: '140ms' }}/>
          <line x1="300" y1="10" x2="300" y2="42" stroke="#cbd5e1" strokeWidth="1" className="fade-in" style={{ animationDelay: '160ms' }}/>
          
          {/* Vertical grid lines */}
          <line x1="135" y1="42" x2="135" y2="350" stroke="#f1f5f9" strokeWidth="1" className="fade-in" style={{ animationDelay: '200ms' }}/>
          <line x1="190" y1="42" x2="190" y2="350" stroke="#f1f5f9" strokeWidth="1" className="fade-in" style={{ animationDelay: '220ms' }}/>
          <line x1="245" y1="42" x2="245" y2="350" stroke="#f1f5f9" strokeWidth="1" className="fade-in" style={{ animationDelay: '240ms' }}/>
          <line x1="300" y1="42" x2="300" y2="350" stroke="#f1f5f9" strokeWidth="1" className="fade-in" style={{ animationDelay: '260ms' }}/>
          
          {/* Row separators */}
          <line x1="73" y1="88" x2="350" y2="88" stroke="#f1f5f9" strokeWidth="1" className="fade-in" style={{ animationDelay: '300ms' }}/>
          <line x1="73" y1="134" x2="350" y2="134" stroke="#f1f5f9" strokeWidth="1" className="fade-in" style={{ animationDelay: '320ms' }}/>
          <line x1="73" y1="180" x2="350" y2="180" stroke="#f1f5f9" strokeWidth="1" className="fade-in" style={{ animationDelay: '340ms' }}/>
          <line x1="73" y1="226" x2="350" y2="226" stroke="#f1f5f9" strokeWidth="1" className="fade-in" style={{ animationDelay: '360ms' }}/>
          <line x1="73" y1="272" x2="350" y2="272" stroke="#f1f5f9" strokeWidth="1" className="fade-in" style={{ animationDelay: '380ms' }}/>
          
          {/* Sidebar row labels */}
          <rect x="18" y="60" width="46" height="8" rx="2" fill="#e2e8f0" className="fade-in" style={{ animationDelay: '400ms' }}/>
          <rect x="18" y="106" width="38" height="8" rx="2" fill="#e2e8f0" className="fade-in" style={{ animationDelay: '420ms' }}/>
          <rect x="18" y="152" width="42" height="8" rx="2" fill="#e2e8f0" className="fade-in" style={{ animationDelay: '440ms' }}/>
          <rect x="18" y="198" width="35" height="8" rx="2" fill="#e2e8f0" className="fade-in" style={{ animationDelay: '460ms' }}/>
          <rect x="18" y="244" width="46" height="8" rx="2" fill="#e2e8f0" className="fade-in" style={{ animationDelay: '480ms' }}/>
          <rect x="18" y="290" width="32" height="8" rx="2" fill="#e2e8f0" className="fade-in" style={{ animationDelay: '500ms' }}/>
          
          {/* Gantt bars - Row 1 */}
          <g>
            <rect x="88" y="56" width="92" height="15" rx="7" fill="#ec4899" className="timeline-bar" style={{ '--delay': '600ms' }}/>
            <rect x="88" y="56" width="92" height="15" rx="7" fill="url(#shimmer)" className="timeline-bar timeline-bar-shimmer" style={{ '--delay': '1100ms' }}/>
          </g>
          
          {/* Gantt bars - Row 2 */}
          <g>
            <rect x="120" y="102" width="106" height="15" rx="7" fill="#3b82f6" className="timeline-bar" style={{ '--delay': '700ms' }}/>
            <rect x="120" y="102" width="106" height="15" rx="7" fill="url(#shimmer)" className="timeline-bar timeline-bar-shimmer" style={{ '--delay': '1200ms' }}/>
          </g>
          
          {/* Gantt bars - Row 3 */}
          <g>
            <rect x="98" y="148" width="63" height="15" rx="7" fill="#10b981" className="timeline-bar" style={{ '--delay': '800ms' }}/>
            <rect x="98" y="148" width="63" height="15" rx="7" fill="url(#shimmer)" className="timeline-bar timeline-bar-shimmer" style={{ '--delay': '1300ms' }}/>
            <rect x="175" y="148" width="70" height="15" rx="7" fill="#8b5cf6" className="timeline-bar" style={{ '--delay': '850ms' }}/>
            <rect x="175" y="148" width="70" height="15" rx="7" fill="url(#shimmer)" className="timeline-bar timeline-bar-shimmer" style={{ '--delay': '1350ms' }}/>
          </g>
          
          {/* Gantt bars - Row 4 */}
          <g>
            <rect x="140" y="194" width="113" height="15" rx="7" fill="#f97316" className="timeline-bar" style={{ '--delay': '900ms' }}/>
            <rect x="140" y="194" width="113" height="15" rx="7" fill="url(#shimmer)" className="timeline-bar timeline-bar-shimmer" style={{ '--delay': '1400ms' }}/>
          </g>
          
          {/* Gantt bars - Row 5 */}
          <g>
            <rect x="91" y="240" width="77" height="15" rx="7" fill="#06b6d4" className="timeline-bar" style={{ '--delay': '1000ms' }}/>
            <rect x="91" y="240" width="77" height="15" rx="7" fill="url(#shimmer)" className="timeline-bar timeline-bar-shimmer" style={{ '--delay': '1500ms' }}/>
            <rect x="183" y="240" width="84" height="15" rx="7" fill="#ec4899" className="timeline-bar" style={{ '--delay': '1050ms' }}/>
            <rect x="183" y="240" width="84" height="15" rx="7" fill="url(#shimmer)" className="timeline-bar timeline-bar-shimmer" style={{ '--delay': '1550ms' }}/>
          </g>
          
          {/* Gantt bars - Row 6 */}
          <g>
            <rect x="112" y="286" width="98" height="15" rx="7" fill="#3b82f6" className="timeline-bar" style={{ '--delay': '1100ms' }}/>
            <rect x="112" y="286" width="98" height="15" rx="7" fill="url(#shimmer)" className="timeline-bar timeline-bar-shimmer" style={{ '--delay': '1600ms' }}/>
          </g>
          
          {/* Today marker line */}
          <line x1="168" y1="42" x2="168" y2="350" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 2" className="today-line"/>
          <circle cx="168" cy="42" r="4" fill="#ef4444" className="today-line"/>
        </g>
        
        {/* Circle border */}
        <circle cx="180" cy="180" r="170" fill="none" stroke="#e2e8f0" strokeWidth="3"/>
      </svg>
    </div>
  );
}

TimelineLoader.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  className: PropTypes.string,
};

export default TimelineLoader;
