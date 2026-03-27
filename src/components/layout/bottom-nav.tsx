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
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-50 px-4 pb-4">
      <div className="soft-panel mx-auto flex max-w-xl items-center justify-around rounded-[30px] border border-white/8 px-2 py-2 backdrop-blur-xl">
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
                "relative flex flex-1 flex-col items-center gap-1 rounded-[24px] py-2.5 text-[11px] font-medium transition-all",
                isActive
                  ? "bg-white/[0.05] text-white"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-[var(--soft-mint)] shadow-[0_0_12px_rgba(168,213,186,0.65)]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
