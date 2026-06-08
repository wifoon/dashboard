import { Outlet } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

const DefaultFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-slate-950">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
  </div>
);

export default function ProtectedRoute({
  fallback = <DefaultFallback />,
  unauthenticatedElement,
}) {
  const { isAuthenticated, isLoadingAuth, authChecked } = useAuth();

  // Dopóki Supabase nie zwróci odpowiedzi, pokazujemy spinner
  if (isLoadingAuth || !authChecked) {
    return fallback;
  }

  // Jeśli brak sesji - pokazujemy stronę logowania
  if (!isAuthenticated) {
    return unauthenticatedElement;
  }

  // Jeśli wszystko OK - renderujemy główną zawartość tras
  return <Outlet />;
}
