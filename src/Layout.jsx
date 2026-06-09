import { Outlet } from "react-router-dom";
import BottomNav from "@/components/dashboard/BottomNav";

export default function Layout() {
  return (
    <div className="relative min-h-screen bg-[#0a0a0b] text-white">
      <div className="pb-[120px] pt-4">
        <Outlet />
      </div>

      <BottomNav />
    </div>
  );
}
