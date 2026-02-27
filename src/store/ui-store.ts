import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TabId } from "@/types";

interface UIStore {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      activeTab: "dashboard",
      setActiveTab: (tab) => set({ activeTab: tab }),
    }),
    {
      name: "payment-ledger-ui",
    }
  )
);
