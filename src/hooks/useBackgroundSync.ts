import { useEffect, useState, useCallback } from 'react';
import {
  backgroundSyncService,
  BackgroundSyncSnapshot,
  SyncRunResult,
} from '../lib/backgroundSyncService';

export function useBackgroundSync() {
  const [snapshot, setSnapshot] = useState<BackgroundSyncSnapshot>(() =>
    backgroundSyncService.getSnapshot()
  );

  useEffect(() => {
    backgroundSyncService.start();
    return backgroundSyncService.subscribe(setSnapshot);
  }, []);

  const syncNow = useCallback((): Promise<SyncRunResult> => {
    return backgroundSyncService.syncNow('manual');
  }, []);

  const retryItem = useCallback((recordId: string): Promise<SyncRunResult> => {
    return backgroundSyncService.retryItem(recordId);
  }, []);

  const clearSyncedHistory = useCallback((): Promise<number> => {
    return backgroundSyncService.clearSyncedHistory();
  }, []);

  return {
    snapshot,
    syncNow,
    retryItem,
    clearSyncedHistory,
  };
}
