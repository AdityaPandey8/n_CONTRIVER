import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useIdeaWorkspaces, type IdeaWorkspace } from "@/hooks/useIdeaWorkspace";

const STORAGE_KEY = "contrivers.activeWorkspaceId";

interface ActiveWorkspaceValue {
  activeWorkspaceId: string | null;
  activeWorkspace: IdeaWorkspace | null;
  setActiveWorkspaceId: (id: string | null) => void;
  workspaces: IdeaWorkspace[];
  isLoading: boolean;
}

const Ctx = createContext<ActiveWorkspaceValue | null>(null);

export function ActiveWorkspaceProvider({ children }: { children: ReactNode }) {
  const { workspaces, isLoading } = useIdeaWorkspaces();
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(STORAGE_KEY);
  });

  const setActiveWorkspaceId = useCallback((id: string | null) => {
    setActiveWorkspaceIdState(id);
    if (typeof window !== "undefined") {
      if (id) window.localStorage.setItem(STORAGE_KEY, id);
      else window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // If the stored workspace no longer exists, clear it.
  useEffect(() => {
    if (!activeWorkspaceId || isLoading) return;
    if (workspaces.length > 0 && !workspaces.some((w) => w.id === activeWorkspaceId)) {
      setActiveWorkspaceId(null);
    }
  }, [activeWorkspaceId, workspaces, isLoading, setActiveWorkspaceId]);

  const activeWorkspace = useMemo(
    () => workspaces.find((w) => w.id === activeWorkspaceId) ?? null,
    [workspaces, activeWorkspaceId],
  );

  const value = useMemo<ActiveWorkspaceValue>(
    () => ({ activeWorkspaceId, activeWorkspace, setActiveWorkspaceId, workspaces, isLoading }),
    [activeWorkspaceId, activeWorkspace, setActiveWorkspaceId, workspaces, isLoading],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useActiveWorkspace(): ActiveWorkspaceValue {
  const v = useContext(Ctx);
  if (!v) {
    return {
      activeWorkspaceId: null,
      activeWorkspace: null,
      setActiveWorkspaceId: () => {},
      workspaces: [],
      isLoading: false,
    };
  }
  return v;
}