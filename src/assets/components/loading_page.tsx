import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom'
import './loading_page.css'

type LoadingContextValue = {
  startLoading: () => void;
  stopLoading: () => void;
};

const LoadingContext = createContext<LoadingContextValue | null>(null);

export const useLoading = () => {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error('useLoading must be used within LoadingProvider');
  return ctx;
};

const LoadingOverlay: React.FC = () => {
  return ReactDOM.createPortal(
    <div className="loading-overlay" role="status" aria-live="polite">
      <div className="loading-card">
        <div className="loading-spinner" />
        <div className="loading-text">Loading…</div>
      </div>
    </div>,
    document.body
  );
};

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const countRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const pageTimerRef = useRef<number[]>([]);

  const startLoading = useCallback(() => {
    countRef.current += 1;
    // if first loader, set timer to show overlay after 1s
    if (countRef.current === 1) {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        if (countRef.current > 0) setVisible(true);
        timerRef.current = null;
      }, 1000);
    }
  }, []);

  const stopLoading = useCallback(() => {
    countRef.current = Math.max(0, countRef.current - 1);
    if (countRef.current === 0) {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      // Hide overlay when no more loaders are active
      setVisible(false);
    }
  }, []);

  useEffect(() => {
    const handleRouteChange = () => {
      // Use delayed loader behavior for route changes as well.
      // Each navigation schedules its own stop timer so rapid navigations
      // don't leave the global countRef permanently incremented.
      startLoading();
      const id = window.setTimeout(() => {
        // remove this timer id and stop one loading unit
        pageTimerRef.current = pageTimerRef.current.filter(t => t !== id);
        stopLoading();
      }, 800);
      pageTimerRef.current.push(id);
    };

    window.addEventListener('hashchange', handleRouteChange);
    return () => {
      window.removeEventListener('hashchange', handleRouteChange);
      // clear any pending page timers
      pageTimerRef.current.forEach((t) => window.clearTimeout(t));
      pageTimerRef.current = [];
    };
  }, []);

  // Wrap window.fetch to automatically trigger loader for network requests
  useEffect(() => {
    const origFetch = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      startLoading();
      try {
        const res = await origFetch(input, init);
        return res;
      } finally {
        stopLoading();
      }
    };
    return () => { window.fetch = origFetch; };
  }, [startLoading, stopLoading]);

  return (
    <LoadingContext.Provider value={{ startLoading, stopLoading }}>
      {children}
      {visible && <LoadingOverlay />}
    </LoadingContext.Provider>
  );
};

export default LoadingOverlay
