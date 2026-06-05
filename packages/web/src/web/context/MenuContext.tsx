import { createContext, useContext, useState } from 'react';

interface MenuCtx {
  menuOpen: boolean;
  setMenuOpen: (v: boolean) => void;
}

const MenuContext = createContext<MenuCtx>({ menuOpen: false, setMenuOpen: () => {} });

export function MenuProvider({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <MenuContext.Provider value={{ menuOpen, setMenuOpen }}>
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  return useContext(MenuContext);
}
