import {
  LayoutDashboard,
  Users,
  Receipt,
  Calendar,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "dashboard", label: "Home", icon: LayoutDashboard, path: "/" },
  { id: "users", label: "Users", icon: Users, path: "/users" },
  { id: "transactions", label: "Log", icon: Receipt, path: "/transactions" },
  { id: "calendar", label: "Calendar", icon: Calendar, path: "/calendar" },
] as const;

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-50 px-3 pb-3">
      <div className="soft-panel mx-auto flex max-w-xl items-center justify-around rounded-[22px] border border-white/8 px-1 py-1 backdrop-blur-xl">
        {tabs.map((tab) => {
          const isActive =
            tab.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(tab.path);
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-0.5 rounded-[16px] py-1.5 text-[10px] font-medium transition-all",
                isActive
                  ? "bg-white/[0.05] text-white"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="h-[18px] w-[18px]" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
