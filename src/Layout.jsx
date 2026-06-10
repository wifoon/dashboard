import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import BottomNav from "@/components/dashboard/BottomNav";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";

export default function Layout() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("schema-db-changes")
      .on("postgres_changes", { event: "*", schema: "public" }, (payload) => {
        const table = payload.table;

        if (table === "todos") {
          queryClient.invalidateQueries({ queryKey: ["todos"] });
        } else if (table === "notes") {
          queryClient.invalidateQueries({ queryKey: ["notes"] });
        } else if (table === "calendar_events" || table === "calendar_tags") {
          queryClient.invalidateQueries({ queryKey: ["calendar_events"] });
          queryClient.invalidateQueries({ queryKey: ["calendar_tags"] });
        } else if (table.startsWith("gym_") || table === "user_settings") {
          queryClient.invalidateQueries({ queryKey: ["gymState"] });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return (
    <div className="relative min-h-screen bg-[#0a0a0b] text-white">
      <div className="pb-[120px] pt-4">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
