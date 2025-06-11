import * as SecureStore from 'expo-secure-store';

/**
 * Check if SecureStore is available on the current device
 */
export async function isSecureStoreAvailable(): Promise<boolean> {
  try {
    return await SecureStore.isAvailableAsync();
  } catch (error) {
    console.error('Error checking SecureStore availability:', error);
    return false;
  }
}

/**
 * Safely save a value to SecureStore with error handling
 */
export async function secureSet(key: string, value: string): Promise<boolean> {
  try {
    if (!(await isSecureStoreAvailable())) {
      console.warn('SecureStore is not available on this device');
      return false;
    }

    await SecureStore.setItemAsync(key, value);
    return true;
  } catch (error) {
    console.error(`Failed to save ${key} to SecureStore:`, error);
    return false;
  }
}

/**
 * Safely retrieve a value from SecureStore with error handling
 */
export async function secureGet(key: string): Promise<string | null> {
  try {
    if (!(await isSecureStoreAvailable())) {
      return null;
    }

    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error(`Failed to retrieve ${key} from SecureStore:`, error);
    return null;
  }
}

/**
 * Safely delete a value from SecureStore with error handling
 */
export async function secureDelete(key: string): Promise<boolean> {
  try {
    if (!(await isSecureStoreAvailable())) {
      return false;
    }

    await SecureStore.deleteItemAsync(key);
    return true;
  } catch (error) {
    console.error(`Failed to delete ${key} from SecureStore:`, error);
    return false;
  }
}

/**
 * Delete multiple keys from SecureStore at once
 */
export async function secureDeleteMultiple(keys: string[]): Promise<boolean> {
  try {
    if (!(await isSecureStoreAvailable())) {
      return false;
    }
    
    await Promise.all(keys.map(key => SecureStore.deleteItemAsync(key)));
    return true;
  } catch (error) {
    console.error('Failed to delete multiple keys from SecureStore:', error);
    return false;
  }
}   

/**
 * Clear all Inkverse Auth data from SecureStore
 */
export async function inkverseAuthClear(): Promise<boolean> {
  try {
    await secureDeleteMultiple([
      'inkverse-access-token',
      'inkverse-refresh-token',
    ]);
    return true;
  } catch (error) {
    console.error('Failed to clear SecureStore:', error);
    return false;
  }
}