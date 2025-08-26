import { generateToken } from '@/lib/api/auth';
import { setAccessToken } from '@/lib/http/tokenStore';
import React, { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';

export type SelectedWarehouse = {
  warehouse_id: string;
  warehouse_name: string;
} | null;

export type WarehouseContextValue = {
  selectedWarehouse: SelectedWarehouse;
  setSelectedWarehouse: (w: SelectedWarehouse) => void;
  shelf: string | null;
  setShelf: (s: string | null) => void;
  token: string | null;
  authLoading: boolean;
  authError: string | null;
  refreshToken: () => Promise<void>;
};

const WarehouseContext = createContext<WarehouseContextValue | undefined>(undefined);

export function WarehouseProvider({ children }: PropsWithChildren<{}>) {
  const [selectedWarehouse, setSelectedWarehouse] = useState<SelectedWarehouse>(null);
  const [shelf, setShelf] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tokenExpiresAt, setTokenExpiresAt] = useState<number | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const refreshToken = async () => {
    try {
      setAuthLoading(true);
      setAuthError(null);
      const t = await generateToken();
      if (t?.access_token) {
        setToken(t.access_token);
        setTokenExpiresAt(t.expires_at);
        // keep axios token store in sync
        setAccessToken(t.access_token);
      } else {
        setToken(null);
        setTokenExpiresAt(null);
        setAuthError('Failed to obtain access token');
        setAccessToken(null);
      }
    } catch (e: any) {
      setAuthError(e?.message ?? 'Failed to obtain access token');
      setToken(null);
      setTokenExpiresAt(null);
      setAccessToken(null);
    } finally {
      setAuthLoading(false);
    }
  };

  const setWarehouseAndAuth = (w: SelectedWarehouse) => {
    setSelectedWarehouse(w);
    // On selection, fetch token. Fire and forget.
    if (w) {
      void refreshToken();
    } else {
      setToken(null);
      setTokenExpiresAt(null);
      setAccessToken(null);
    }
  };

  // On app load, fetch a token so it's ready before user actions
  useEffect(() => {
    void refreshToken();
  }, []);

  // Dev log: show masked token whenever it changes
  useEffect(() => {
    try {
      const masked = token ? `${token.slice(0, 8)}...${token.slice(-4)}` : 'none';
      // eslint-disable-next-line no-console
      console.log('[auth] stored token:', masked, token ? `(expires @ ${tokenExpiresAt})` : '');
    } catch {}
  }, [token, tokenExpiresAt]);
  return (
    <WarehouseContext.Provider value={{ selectedWarehouse, setSelectedWarehouse: setWarehouseAndAuth, shelf, setShelf, token, authLoading, authError, refreshToken }}>
      {children}
    </WarehouseContext.Provider>
  );
}

export function useWarehouse() {
  const ctx = useContext(WarehouseContext);
  if (!ctx) throw new Error('useWarehouse must be used within WarehouseProvider');
  return ctx;
}
