import React, { createContext, useContext } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Zwracamy sztuczne dane – udajemy, że autoryzacja przeszła pomyślnie
  return (
    <AuthContext.Provider
      value={{
        user: { name: "Local User", role: "admin" },
        isAuthenticated: true,
        isLoadingAuth: false,
        isLoadingPublicSettings: false,
        authError: null,
        appPublicSettings: {},
        authChecked: true,
        logout: () => console.log("Wylogowano lokalnie"),
        navigateToLogin: () => console.log("Przejście do logowania"),
        checkUserAuth: async () => {},
        checkAppState: async () => {},
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
