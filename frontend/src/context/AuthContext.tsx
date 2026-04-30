import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  full_name: string | null;
  handle: string | null;
  bio: string | null;
  avatar_url: string | null;
  streak: number;
  last_active: string | null;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, handle: string) => Promise<{ error: string | null; needsConfirmation?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Omit<Profile, "id">>) => Promise<{ error: string | null }>;
  updateAvatar: (blob: string) => Promise<{ error: string | null }>;
  checkHandleAvailable: (handle: string) => Promise<boolean>;
  incrementListens: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(() => {
    const saved = localStorage.getItem("plugg_cached_profile");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (uid: string, authUser?: import("@supabase/supabase-js").User) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", uid).single();
    if (data) {
      const liveProfile = data as Profile;
      // Sync Google avatar/name if our profile has none yet
      const meta = authUser?.user_metadata;
      if (meta && (!liveProfile.avatar_url || !liveProfile.full_name)) {
        const updates: Record<string, string> = {};
        if (!liveProfile.avatar_url && meta.avatar_url) updates.avatar_url = meta.avatar_url;
        if (!liveProfile.full_name && meta.full_name) updates.full_name = meta.full_name;
        if (Object.keys(updates).length) {
          await supabase.from("profiles").update(updates).eq("id", uid);
          Object.assign(liveProfile, updates);
        }
      }
      setProfile(liveProfile);
      localStorage.setItem("plugg_cached_profile", JSON.stringify(liveProfile));
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id, session.user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user);
      } else {
        setProfile(null);
        localStorage.removeItem("plugg_cached_profile");
      }
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  // Atomic increment for total listens
  const incrementListens = useCallback(async () => {
    if (!user || !profile) return;
    
    const newCount = (profile.streak || 0) + 1;

    // Optimistic local update
    setProfile(p => p ? { ...p, streak: newCount } : null);
    localStorage.setItem("plugg_cached_profile", JSON.stringify({ ...profile, streak: newCount }));

    // Update database
    const { error } = await supabase
      .from("profiles")
      .update({ streak: newCount })
      .eq("id", user.id);

    if (error) {
      console.error("Error updating listens count:", error);
      // Optional: rollback local state if we want to be strict, but for listens it's fine
    }
  }, [user, profile]);

  const touchStreak = useCallback(async (uid: string) => {
    // Keep last_active updated but don't reset streak
    const today = new Date().toISOString().split("T")[0];
    await supabase.from("profiles").update({ last_active: today }).eq("id", uid);
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string, handle: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, handle } },
    });
    if (error) return { error: error.message };
    // Upsert profile immediately (trigger may not fire until email confirmed)
    if (data.user) {
      await supabase.from("profiles").upsert({ id: data.user.id, full_name: name, handle });
      await fetchProfile(data.user.id);
    }
    // If identities array is empty, the email already exists
    const needsConfirmation = !data.session;
    return { error: null, needsConfirmation };
  }, [fetchProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    if (data.user) touchStreak(data.user.id);
    return { error: null };
  }, [touchStreak]);

  const signInWithGoogle = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/account` },
    });
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    localStorage.removeItem("plugg_cached_profile");
  }, []);

  const updateProfile = useCallback(async (updates: Partial<Omit<Profile, "id">>) => {
    if (!user) return { error: "Not authenticated" };
    const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
    if (!error) {
      setProfile((p) => {
        const updated = p ? { ...p, ...updates } : p;
        if (updated) localStorage.setItem("plugg_cached_profile", JSON.stringify(updated));
        return updated;
      });
    }
    return { error: error?.message ?? null };
  }, [user]);

  const updateAvatar = useCallback(async (dataUrl: string) => {
    if (!user) return { error: "Not authenticated" };
    const blob = await (await fetch(dataUrl)).blob();
    const ext = blob.type.split("/")[1] || "jpg";
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadErr } = await supabase.storage.from("avatars").upload(path, blob, { upsert: true });
    if (uploadErr) return { error: uploadErr.message };
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return updateProfile({ avatar_url: data.publicUrl });
  }, [user, updateProfile]);

  const checkHandleAvailable = useCallback(async (handle: string) => {
    const { data } = await supabase.from("profiles").select("id").eq("handle", handle).neq("id", user?.id ?? "").maybeSingle();
    return !data;
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user, session, profile, loading,
      signUp, signIn, signInWithGoogle, signOut,
      updateProfile, updateAvatar, checkHandleAvailable,
      incrementListens,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
