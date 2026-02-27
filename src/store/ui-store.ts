import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TabId } from "@/types";

interface UIStore {
  theme: "light" | "dark";
  activeTab: TabId;
  toggleTheme: () => void;
  setActiveTab: (tab: TabId) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      theme: "light",
      activeTab: "dashboard",
      toggleTheme: () => {
        const next = get().theme === "light" ? "dark" : "light";
        document.documentElement.classList.toggle("dark", next === "dark");
        set({ theme: next });
      },
      setActiveTab: (tab) => set({ activeTab: tab }),
    }),
    {
      name: "payment-ledger-ui",
      onRehydrateStorage: () => (state) => {
        if (state?.theme === "dark") {
          document.documentElement.classList.add("dark");
        }
      },
    }
  )
);
