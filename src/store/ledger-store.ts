import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LedgerConfig } from "@/types";

interface LedgerStore {
  config: LedgerConfig | null;
  activeLedgerId: string | null;
  userRole: "owner" | "admin" | null;
  setConfig: (config: LedgerConfig | null) => void;
  setActiveLedger: (id: string | null, role: "owner" | "admin" | null) => void;
}

export const useLedgerStore = create<LedgerStore>()(
  persist(
    (set) => ({
      config: null,
      activeLedgerId: null,
      userRole: null,
      setConfig: (config) => set({ config }),
      setActiveLedger: (activeLedgerId, userRole) =>
        set({ activeLedgerId, userRole }),
    }),
    {
      name: "payment-ledger-config",
      partialize: (state) => ({ activeLedgerId: state.activeLedgerId }),
    }
  )
);
