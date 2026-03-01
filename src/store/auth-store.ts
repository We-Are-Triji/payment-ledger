import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";

interface AuthStore {
  session: Session | null;
  user: User | null;
  loading: boolean;
  initialized: boolean;
  initialize: () => Promise<void>;
  signInWithGoogle: (redirectTo?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  session: null,
  user: null,
  loading: true,
  initialized: false,

  initialize: async () => {
    if (get().initialized) return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    set({
      session,
      user: session?.user ?? null,
      loading: false,
      initialized: true,
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null });
    });

    // Clean up on page unload to prevent listener accumulation
    window.addEventListener("beforeunload", () => subscription.unsubscribe(), { once: true });
  },

  signInWithGoogle: async (redirectTo?: string) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo ?? window.location.origin },
    });
    if (error) throw error;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null });
  },
}));
