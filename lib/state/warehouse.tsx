import React, { createContext, PropsWithChildren, useContext, useState } from 'react';

export type SelectedWarehouse = {
  warehouse_id: string;
  warehouse_name: string;
} | null;

export type WarehouseContextValue = {
  selectedWarehouse: SelectedWarehouse;
  setSelectedWarehouse: (w: SelectedWarehouse) => void;
  shelf: string | null;
  setShelf: (s: string | null) => void;
  token: null;
  authLoading: false;
  authError: null;
  refreshToken: () => Promise<void>;
};

const WarehouseContext = createContext<WarehouseContextValue | undefined>(undefined);

export function WarehouseProvider({ children }: PropsWithChildren<{}>) {
  const [selectedWarehouse, setSelectedWarehouse] = useState<SelectedWarehouse>(null);
  const [shelf, setShelf] = useState<string | null>(null);
  const token = null;
  const authLoading = false;
  const authError = null;

  const refreshToken = async () => {
    // No-op since we're not using tokens
    return Promise.resolve();
  };

  const setWarehouseAndAuth = (w: SelectedWarehouse) => {
    setSelectedWarehouse(w);
  };

  return (
    <WarehouseContext.Provider value={{
      selectedWarehouse,
      setSelectedWarehouse,
      shelf,
      setShelf,
      token: null,
      authLoading: false,
      authError: null,
      refreshToken,
    }}>
      {children}
    </WarehouseContext.Provider>
  );
}

export function useWarehouse() {
  const ctx = useContext(WarehouseContext);
  if (!ctx) throw new Error('useWarehouse must be used within WarehouseProvider');
  return ctx;
}
