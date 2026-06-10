import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase"; // Używamy tego pliku tylko do importu zainicjalizowanego klienta

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
      setIsLoadingAuth(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsLoadingAuth(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (usernameInput, password) => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("email")
        .eq("username", usernameInput.trim())
        .single();

      if (profileError || !profile) {
        throw new Error("Nieprawidłowy login lub hasło");
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword(
        {
          email: profile.email,
          password: password,
        },
      );

      if (authError) throw authError;
      return data;
    } catch (error) {
      console.error("Błąd autoryzacji:", error.message);
      throw error;
    }
  };

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      localStorage.clear(); // Opcjonalnie czyścimy cache na urządzeniu
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
