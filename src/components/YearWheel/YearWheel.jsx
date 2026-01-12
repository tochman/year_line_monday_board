import React, { forwardRef } from "react";
import MondayYearWheel from "../../yearwheel-core/MondayYearWheel";
import "./YearWheel.css";

/**
 * YearWheel wrapper component
 * Bridges the Monday.com specific props with the core MondayYearWheel component
 */
const YearWheel = forwardRef(({ 
  items = [], 
  groups = [],
  year = new Date().getFullYear(),
  title = "",
  onItemClick,
  size = 600,
  showWeekRing = true,
  showMonthRing = true,
  showRingNames = true,
}, ref) => {
  return (
    <div className="yearwheel-container" style={{ width: size, height: size }}>
      <MondayYearWheel
        ref={ref}
        items={items}
        groups={groups}
        year={year}
        title={title}
        onItemClick={onItemClick}
        renderSize={2000}
        showWeekRing={showWeekRing}
        showMonthRing={showMonthRing}
        showRingNames={showRingNames}
        readonly={true}
      />
    </div>
  );
});

YearWheel.displayName = 'YearWheel';

export default YearWheel;
