import { Outlet } from "react-router-dom";
import { Header } from "./header";
import { BottomNav } from "./bottom-nav";

export function AppShell() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Header />
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
