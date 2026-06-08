import { Outlet } from "react-router-dom";
import BottomNav from "@/components/dashboard/BottomNav";
import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

export default function Layout() {
  const { logout } = useAuth();

  return (
    <div className="relative min-h-screen bg-[#0a0a0b] text-white">
      <button
        onClick={logout}
        className="fixed top-4 right-5 z-[150] flex items-center justify-center w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 text-white/30 hover:text-[#ff6b6b] hover:bg-[#ff6b6b]/10 backdrop-blur-md transition-all active:scale-95 shadow-lg"
        title="Wyloguj się"
      >
        <LogOut className="w-4 h-4" />
      </button>

      <div className="pb-[120px] pt-4">
        <Outlet />
      </div>

      <BottomNav />
    </div>
  );
}
