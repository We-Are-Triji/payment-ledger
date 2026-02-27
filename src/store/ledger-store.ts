import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LedgerConfig } from "@/types";

interface LedgerStore {
  config: LedgerConfig | null;
  setConfig: (config: LedgerConfig | null) => void;
}

export const useLedgerStore = create<LedgerStore>()(
  persist(
    (set) => ({
      config: null,
      setConfig: (config) => set({ config }),
    }),
    { name: "payment-ledger-config" }
  )
);
