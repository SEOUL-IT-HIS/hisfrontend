"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getMenus } from "@/features/admin/api";
import {
  mapApiMenusToSidebarItems,
  type SidebarMenuItem,
} from "@/constants/menu";

type MenuContextValue = {
  menus: SidebarMenuItem[];
  loading: boolean;
  error: string | null;
};

const MenuContext = createContext<MenuContextValue>({
  menus: [],
  loading: true,
  error: null,
});

export function MenuProvider({ children }: { children: ReactNode }) {
  const [menus, setMenus] = useState<SidebarMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadMenus() {
      try {
        const tree = await getMenus();
        if (cancelled) return;
        setMenus(mapApiMenusToSidebarItems(tree));
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setMenus([]);
        setError(err instanceof Error ? err.message : "메뉴를 불러오지 못했습니다.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadMenus();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <MenuContext.Provider value={{ menus, loading, error }}>
      {children}
    </MenuContext.Provider>
  );
}

export function useMenus() {
  return useContext(MenuContext);
}
