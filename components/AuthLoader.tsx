import { supabase } from '@/lib/supabase';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadUser } from '@/store/slices/userSlice';
import { useEffect } from 'react';

export function AuthLoader({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.user);

  useEffect(() => {
    // Initial load
    dispatch(loadUser());

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, !!session);
        
        if (event === 'SIGNED_OUT') {
          // User logged out - loadUser will return null and clear state
          dispatch(loadUser());
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // User logged in or token refreshed - reload user data
          dispatch(loadUser());
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [dispatch]);

  return <>{children}</>;
}
