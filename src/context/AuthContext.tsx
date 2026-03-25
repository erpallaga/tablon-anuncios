import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Session, AuthError } from '@supabase/supabase-js';
import { authService } from '../lib/supabase/auth';
import { profilesService } from '../lib/supabase/profiles';
import type { Profile, UserRole } from '../types';

interface AuthContextType {
  session: Session | null;
  profile: Profile | null;
  userRole: UserRole | null;
  isLoading: boolean;
  signIn: (email: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Load initial session from localStorage
    authService.getSession().then(async (initialSession) => {
      if (!isMounted) return;
      setSession(initialSession);
      if (initialSession) {
        const p = await profilesService.getOwnProfile(initialSession.user.id);
        if (isMounted) setProfile(p);
      }
      if (isMounted) setIsLoading(false);
    });

    // Handle magic link callbacks, sign out, and token refresh
    const subscription = authService.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;
      setSession(newSession);
      if (newSession) {
        const p = await profilesService.getOwnProfile(newSession.user.id);
        if (isMounted) setProfile(p);
      } else {
        setProfile(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string): Promise<{ error: AuthError | null }> => {
    return authService.signInWithMagicLink(email);
  };

  const signOut = async (): Promise<void> => {
    await authService.signOut();
  };

  return (
    <AuthContext.Provider value={{
      session,
      profile,
      userRole: profile?.role ?? null,
      isLoading,
      signIn,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext debe usarse dentro de un AuthProvider');
  }
  return context;
}
