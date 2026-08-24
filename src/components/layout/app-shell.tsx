import { Outlet } from "react-router-dom";
import { Header } from "./header";
import { BottomNav } from "./bottom-nav";

export function AppShell() {
  return (
    <div className="relative flex min-h-dvh flex-col bg-background">
      <Header />
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-28">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
