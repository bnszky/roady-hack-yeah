import type { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(supabase !== null);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .catch(() => setSession(null))
      .finally(() => setLoading(false));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase nie jest skonfigurowany (mobile/.env.local)');
    return supabase.auth.signInWithPassword({ email, password });
  };
  const signOut = async () => {
    await supabase?.auth.signOut();
  };

  return { session, loading, signIn, signOut };
}
