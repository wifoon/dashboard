import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase, startSync, stopSync } from "./supabaseSync";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    if (!supabase) {
      console.error("Brak połączenia z Supabase.");
      setIsLoadingAuth(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user?.id) startSync(session.user.id);
      setIsLoadingAuth(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.id) {
        startSync(session.user.id);
      } else {
        stopSync();
      }
      setIsLoadingAuth(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      stopSync();
      // Czyszczenie danych na publicznych urządzeniach!
      localStorage.clear();
      window.location.href = "/";
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        isAuthenticated: !!session,
        isLoadingAuth,
        login,
        logout,
        authChecked: !isLoadingAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth musi być użyty wewnątrz AuthProvider");
  return context;
};
