import { createContext, useContext } from 'react';

export type LoadingContextValue = {
  startLoading: () => void;
  stopLoading: () => void;
};

export const LoadingContext = createContext<LoadingContextValue | null>(null);

export function useLoading(): LoadingContextValue {
  const context = useContext(LoadingContext);
  if (!context) throw new Error('useLoading must be used within LoadingProvider');
  return context;
}
