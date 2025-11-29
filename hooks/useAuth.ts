import { useUser } from '../context/UserContext';

// Re-exporting the hook from context for cleaner imports in components
export const useAuth = () => {
  return useUser();
};