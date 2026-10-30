import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../lib/auth";
import { getLastRead } from "../lib/readingProgress";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined);
  const [lastRead, setLastRead] = useState(null);

  useEffect(() => {
    let active = true;
    let changed = false;
    auth.getSession().then(({ data }) => { if (active && !changed) setSession(data?.session ?? null); });
    const { data: listener } = auth.onAuthStateChange((_e, s) => { changed = true; setSession(s); });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!session) {
      setLastRead(null);
      return;
    }
    let active = true;
    setLastRead(null);
    getLastRead(session.user.id).then(data => { if (active) setLastRead(data); }).catch(console.error);
    return () => { active = false; };
  }, [session]);

  function refreshLastRead() {
    if (session) getLastRead(session.user.id).then(setLastRead).catch(console.error);
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
