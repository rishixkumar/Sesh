"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import {
  DEMO_SWITCHABLE_USERS,
  SEED_USERS,
  STATIC_FALLBACK_ANCHOR_ISO,
} from "@/lib/mock/seed";
import {
  LocalMockSeshAdapter,
  SESH_SESSION_STORAGE_KEY,
  type SeshDataAdapter,
} from "@/lib/data/adapter";
import type { User, ViewerSession } from "@/types/domain";

export type DemoIdentityChoice = "GUEST" | string;

interface SignInPromptState {
  open: boolean;
  actionDescription: string;
}

export interface SeshContextValue {
  adapter: SeshDataAdapter;
  viewer: ViewerSession;
  availableDemoUsers: User[];
  setDemoIdentity: (choice: DemoIdentityChoice) => void;
  /** Current reference ISO timestamp (deterministic pre-hydration, live after mount) */
  nowIso: string;
  /** True once browser storage & clock have hydrated on the client */
  isHydrated: boolean;
  /** Increments on every adapter mutation so subscribed views re-compute cleanly */
  revision: number;
  /**
   * Checks if viewer is signed in as a Demo Member.
   * If in Guest mode, opens the clearly labeled Demo Sign-In dialog and returns `false`.
   */
  requireDemoMember: (actionDescription: string) => boolean;
  signInPrompt: SignInPromptState;
  closeSignInPrompt: () => void;
  resetAllDemoData: () => void;
}

const SeshContext = createContext<SeshContextValue | null>(null);

const DEFAULT_GUEST_VIEWER: ViewerSession = {
  mode: "GUEST",
  user: null,
};

const DEFAULT_MEMBER_VIEWER: ViewerSession = {
  mode: "MEMBER",
  user: DEMO_SWITCHABLE_USERS[0],
};

interface RuntimeSnapshot {
  isHydrated: boolean;
  nowIso: string;
  viewer: ViewerSession;
  revision: number;
}

const SERVER_SNAPSHOT: RuntimeSnapshot = {
  isHydrated: false,
  nowIso: STATIC_FALLBACK_ANCHOR_ISO,
  viewer: DEFAULT_MEMBER_VIEWER,
  revision: 0,
};

class ClientRuntimeController {
  readonly adapter: LocalMockSeshAdapter;
  private snapshot: RuntimeSnapshot = SERVER_SNAPSHOT;
  private initialized = false;
  private readonly listeners = new Set<() => void>();

  constructor() {
    this.adapter = new LocalMockSeshAdapter({
      anchorIso: STATIC_FALLBACK_ANCHOR_ISO,
      storage: null,
    });
    this.adapter.subscribe(() => {
      this.snapshot = {
        ...this.snapshot,
        revision: this.snapshot.revision + 1,
      };
      this.emit();
    });
  }

  ensureInitializedOnClient(): void {
    if (this.initialized || typeof window === "undefined") return;
    this.initialized = true;

    const runtimeNow = new Date().toISOString();
    this.adapter.attachBrowserStorage(window.localStorage, runtimeNow);

    let initialViewer: ViewerSession = DEFAULT_MEMBER_VIEWER;
    try {
      const savedIdentity = window.localStorage.getItem(
        SESH_SESSION_STORAGE_KEY
      );
      if (savedIdentity === "GUEST") {
        initialViewer = DEFAULT_GUEST_VIEWER;
      } else if (savedIdentity) {
        const matched = SEED_USERS.find((u) => u.id === savedIdentity);
        if (matched) {
          initialViewer = { mode: "MEMBER", user: matched };
        }
      }
    } catch {
      // Ignore storage access errors
    }

    this.snapshot = {
      isHydrated: true,
      nowIso: runtimeNow,
      viewer: initialViewer,
      revision: this.snapshot.revision + 1,
    };
    this.emit();
  }

  setIdentity(choice: DemoIdentityChoice): void {
    const nextViewer: ViewerSession =
      choice === "GUEST"
        ? DEFAULT_GUEST_VIEWER
        : {
            mode: "MEMBER",
            user:
              SEED_USERS.find((u) => u.id === choice) ??
              DEMO_SWITCHABLE_USERS[0],
          };

    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(SESH_SESSION_STORAGE_KEY, choice);
      }
    } catch {
      // Ignore
    }

    this.snapshot = {
      ...this.snapshot,
      viewer: nextViewer,
      revision: this.snapshot.revision + 1,
    };
    this.emit();
  }

  tickClock(): void {
    this.snapshot = {
      ...this.snapshot,
      nowIso: new Date().toISOString(),
    };
    this.emit();
  }

  resetDemoData(): void {
    const freshNow = new Date().toISOString();
    this.adapter.resetDemoData(freshNow);
    this.snapshot = {
      ...this.snapshot,
      nowIso: freshNow,
      revision: this.snapshot.revision + 1,
    };
    this.emit();
  }

  getSnapshot = (): RuntimeSnapshot => this.snapshot;

  getServerSnapshot = (): RuntimeSnapshot => SERVER_SNAPSHOT;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private emit(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}

let sharedController: ClientRuntimeController | null = null;

function getController(): ClientRuntimeController {
  if (!sharedController) {
    sharedController = new ClientRuntimeController();
  }
  return sharedController;
}

export function SeshProvider({ children }: { children: React.ReactNode }) {
  const controller = useMemo(() => getController(), []);
  const runtime = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getServerSnapshot
  );

  const [signInPrompt, setSignInPrompt] = useState<SignInPromptState>({
    open: false,
    actionDescription: "",
  });

  useEffect(() => {
    controller.ensureInitializedOnClient();
    const timer = window.setInterval(() => {
      controller.tickClock();
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [controller]);

  const setDemoIdentity = useCallback(
    (choice: DemoIdentityChoice) => {
      controller.setIdentity(choice);
      setSignInPrompt({ open: false, actionDescription: "" });
    },
    [controller]
  );

  const requireDemoMember = useCallback(
    (actionDescription: string): boolean => {
      if (runtime.viewer.mode === "MEMBER") {
        return true;
      }
      setSignInPrompt({
        open: true,
        actionDescription,
      });
      return false;
    },
    [runtime.viewer.mode]
  );

  const closeSignInPrompt = useCallback(() => {
    setSignInPrompt((prev) => ({ ...prev, open: false }));
  }, []);

  const resetAllDemoData = useCallback(() => {
    controller.resetDemoData();
  }, [controller]);

  const value = useMemo<SeshContextValue>(
    () => ({
      adapter: controller.adapter,
      viewer: runtime.viewer,
      availableDemoUsers: DEMO_SWITCHABLE_USERS,
      setDemoIdentity,
      nowIso: runtime.nowIso,
      isHydrated: runtime.isHydrated,
      revision: runtime.revision,
      requireDemoMember,
      signInPrompt,
      closeSignInPrompt,
      resetAllDemoData,
    }),
    [
      controller,
      runtime.viewer,
      runtime.nowIso,
      runtime.isHydrated,
      runtime.revision,
      setDemoIdentity,
      requireDemoMember,
      signInPrompt,
      closeSignInPrompt,
      resetAllDemoData,
    ]
  );

  return <SeshContext.Provider value={value}>{children}</SeshContext.Provider>;
}

export function useSesh(): SeshContextValue {
  const ctx = useContext(SeshContext);
  if (!ctx) {
    throw new Error("useSesh must be used within <SeshProvider>.");
  }
  return ctx;
}
