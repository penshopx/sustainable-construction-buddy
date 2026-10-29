import { ReactNode, useEffect, useRef, useState } from "react";
import { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { clearLocalAssessmentDrafts } from "@/lib/assessmentDraft";
import { AuthContext, type Profile } from "./useAuth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const profileRequestId = useRef(0);
  const currentIdentity = useRef<string | null>(null);
  const mounted = useRef(false);

  const fetchProfile = async (userId: string) => {
    if (!mounted.current || currentIdentity.current !== userId) return;
    const requestId = ++profileRequestId.current;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    if (mounted.current && currentIdentity.current === userId && requestId === profileRequestId.current) {
      setProfile(data ?? null);
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  useEffect(() => {
    mounted.current = true;
    let active = true;
    let authEventVersion = 0;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!active) return;
        authEventVersion += 1;
        if (event === "SIGNED_OUT") {
          try { clearLocalAssessmentDrafts(localStorage); } catch { /* Storage is unavailable. */ }
        }
        profileRequestId.current += 1;
        currentIdentity.current = session?.user.id ?? null;
        setSession(session);
        setUser(session?.user ?? null);
        setProfile(null);
        if (session?.user) {
          setTimeout(() => fetchProfile(session.user.id), 0);
        }
        setLoading(false);
      }
    );

    const restoreVersion = authEventVersion;
    void supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!active || restoreVersion !== authEventVersion) return;
        profileRequestId.current += 1;
        currentIdentity.current = session?.user.id ?? null;
        setSession(session);
        setUser(session?.user ?? null);
        setProfile(null);
        if (session?.user) void fetchProfile(session.user.id);
      })
      .catch(() => {
        if (!active || restoreVersion !== authEventVersion) return;
        console.error("Gagal memulihkan sesi autentikasi.");
        currentIdentity.current = null;
        setSession(null);
        setUser(null);
        setProfile(null);
      })
      .finally(() => { if (active && restoreVersion === authEventVersion) setLoading(false); });

    return () => {
      mounted.current = false;
      active = false;
      currentIdentity.current = null;
      profileRequestId.current += 1;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth?confirmed=1`,
      },
    });
    return { error, session: data.session };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { error, session: data.session };
  };

  const signOut = async () => {
    // Purge before the auth request so an interrupted logout cannot leave answers behind.
    try { clearLocalAssessmentDrafts(localStorage); } catch { /* Storage is unavailable. */ }
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, profile, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}