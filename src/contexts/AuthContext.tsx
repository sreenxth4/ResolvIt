import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "citizen" | "authority" | "admin";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: AppRole | null;
  departmentId: string | null;
  profile: { name: string; avatar_url: string | null; points_total: number } | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  authorityLogin: (mobile: string, aadhaar: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [profile, setProfile] = useState<AuthContextType["profile"]>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    try {
      const [roleRes, profileRes] = await Promise.all([
        supabase.from("user_roles").select("role, department_id").eq("user_id", userId).limit(1).single(),
        supabase.from("profiles").select("name, avatar_url, points_total").eq("id", userId).single(),
      ]);

      if (roleRes.data) {
        setRole(roleRes.data.role as AppRole);
        setDepartmentId(roleRes.data.department_id);
      }
      if (profileRes.data) {
        setProfile(profileRes.data);
      }
    } catch (e) {
      console.error("Error fetching user data:", e);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session?.user) {
        setRole(null);
        setDepartmentId(null);
        setProfile(null);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session?.user) {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      setLoading(true);
      fetchUserData(user.id).finally(() => setLoading(false));
    }
  }, [user?.id]);

  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: window.location.origin,
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const authorityLogin = async (mobile: string, aadhaar: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("authority-login", {
        body: { mobile_number: mobile, aadhaar_number: aadhaar },
      });

      if (error) {
        return { error: { message: error.message || "Login failed" } };
      }

      if (data?.error) {
        return { error: { message: data.error } };
      }

      if (data?.session) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
        if (sessionError) {
          return { error: { message: sessionError.message } };
        }
      }

      return { error: null };
    } catch (e: any) {
      return { error: { message: e.message || "Login failed" } };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
    setDepartmentId(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, role, departmentId, profile, loading, signUp, signIn, authorityLogin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
