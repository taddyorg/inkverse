import { asyncGetObject } from './async';

let syscStorage: Record<string, any> = {};

export function syncStorageGet(key: string): any {
  return syscStorage[key];
}

export function syncStorageSet(key: string, value: any): void {
  syscStorage[key] = value;
}

export function syncStorageDelete(key: string): void {
  delete syscStorage[key];
}

export function syncStorageClear(): void {
  syscStorage = {};
}

export async function migrateAsyncStorageToSyncStorage(keys: string[]): Promise<void> {
  for (const key of keys) {
    const value = await asyncGetObject(key);
    if (value) {
      syncStorageSet(key, value);
    }
  }
}