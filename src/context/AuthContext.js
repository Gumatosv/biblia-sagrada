import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { getLastRead } from "../lib/readingProgress";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined);
  const [lastRead, setLastRead] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setLastRead(null);
      return;
    }
    getLastRead(session.user.id).then(setLastRead);
  }, [session]);

  function refreshLastRead() {
    if (session) getLastRead(session.user.id).then(setLastRead);
  }

  return (
    <AuthContext.Provider value={{ session, lastRead, refreshLastRead }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}