import { createContext, useContext, useState, type ReactNode } from 'react';

interface SyncStatus {
  refreshing: boolean;
  lastSync: Date | null;
  setRefreshing: (v: boolean) => void;
  setLastSync: (d: Date) => void;
}

const SyncStatusContext = createContext<SyncStatus>({
  refreshing: false,
  lastSync: null,
  setRefreshing: () => {},
  setLastSync: () => {},
});

export function SyncStatusProvider({ children }: { children: ReactNode }) {
  const [refreshing, setRefreshing] = useState(false);
  const [lastSync, setLastSync]     = useState<Date | null>(null);

  return (
    <SyncStatusContext.Provider value={{ refreshing, lastSync, setRefreshing, setLastSync }}>
      {children}
    </SyncStatusContext.Provider>
  );
}

export function useSyncStatus() {
  return useContext(SyncStatusContext);
}
