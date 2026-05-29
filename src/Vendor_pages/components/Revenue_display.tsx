import { useEffect, useState, useMemo } from 'react';
import './Revenue_display.css';

const Revenue_display = () => {
  const [Revenue_count, setRevenue_count] = useState<number | null>(null);

  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        // Replace this endpoint with the real backend URL later.
        const response = await fetch('/api/revenue');
        const data = await response.json();

        // Use the backend field name Revenue_count as requested.
        setRevenue_count(typeof data.Revenue_count === 'number' ? data.Revenue_count : Number(data.Revenue_count) || 0);
      } catch (error) {
        console.error('Failed to load revenue:', error);
        setRevenue_count(0);
      }
    };

    fetchRevenue();
  }, []);

  // Sample placeholder series for the demo chart (0..100 scale)
  const sampleSeries = useMemo(() => [12, 28, 45, 38, 60, 74, 68, 82], []);

  // Map series to SVG polyline points (percent-based)
  const polyPoints = useMemo(() => {
    const max = Math.max(...sampleSeries, 100);
    return sampleSeries
      .map((v, i) => {
        const x = (i / (sampleSeries.length - 1)) * 100;
        const y = 100 - Math.round((v / max) * 100);
        return `${x},${y}`;
      })
      .join(' ');
  }, [sampleSeries]);

  return (
    <div className="revenue-display">
      <div className="revenue-left">
        <span className="revenue-label">Revenue</span>
        <strong className="revenue-value">
          {Revenue_count === null ? 'Loading...' : `LKR ${Revenue_count.toLocaleString()}`}
        </strong>
        <div className="revenue-meta">Live (updates from backend)</div>
      </div>

      <div className="revenue-right" aria-hidden>
        <svg className="revenue-chart" viewBox="0 0 100 100" preserveAspectRatio="none" role="img">
          <defs>
            <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(188,158,130,0.28)" />
              <stop offset="100%" stopColor="rgba(188,158,130,0)" />
            </linearGradient>
          </defs>
          <polyline points={polyPoints} fill="none" stroke="#BC9E82" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
          <polyline points={`${polyPoints} ${sampleSeries.length ? ` ${sampleSeries.length - 1},100 0,100` : ''}`} fill="url(#g)" opacity="0.9" />
        </svg>
        <div className="chart-legend">
          <span>7d</span>
          <span>30d</span>
          <span>90d</span>
        </div>
      </div>
    </div>
  );
};

export default Revenue_display;
