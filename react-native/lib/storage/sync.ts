import { USER_DETAILS_KEY } from '../auth/user';
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

export function migrateAsyncStorageToSyncStorage(): void {
  const keys = [USER_DETAILS_KEY];
  keys.forEach((key) => {
    const value = asyncGetObject(key);
    if (value) {
      syncStorageSet(key, value);
    }
  });
}