/**
 * Check if localStorage is available in the current environment
 */
function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  return true;
}

/**
 * Safely save a string value to localStorage with error handling
 */
export function localStorageSet(key: string, value: string): boolean {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage is not available, cannot store value for key:', key);
    return false;
  }

  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch (error) {
    if (error instanceof Error) {
      // Check for quota exceeded error
      if (error.name === 'QuotaExceededError' || 
          // Some browsers use a different error name
          error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        console.error('Storage quota exceeded when setting key:', key);
      } else {
        console.error(`Failed to store ${key} in localStorage:`, error);
      }
    }
    return false;
  }
}

/**
 * Safely save an object value to localStorage as JSON
 */
export function localStorageSetObject(key: string, value: any): boolean {
  try {
    const jsonValue = JSON.stringify(value);
    return localStorageSet(key, jsonValue);
  } catch (error) {
    console.error(`Failed to stringify object for key ${key}:`, error);
    return false;
  }
}

/**
 * Safely get a string value from localStorage
 */
export function localStorageGet(key: string): string | null {
  if (!isLocalStorageAvailable()) {
    return null;
  }
  
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    console.error(`Failed to retrieve ${key} from localStorage:`, error);
    return null;
  }
}

/**
 * Safely retrieve and parse a JSON object from localStorage
 */
export function localStorageGetObject<T = any>(key: string): T | null {
  const jsonValue = localStorageGet(key);
  
  if (!jsonValue) {
    return null;
  }
  
  try {
    return JSON.parse(jsonValue) as T;
  } catch (error) {
    console.error(`Failed to parse JSON from localStorage with key ${key}:`, error);
    return null;
  }
}

/**
 * Safely delete a value from localStorage
 */
export function localStorageDelete(key: string): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }
  
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Failed to delete ${key} from localStorage:`, error);
    return false;
  }
}

/**
 * Delete multiple keys from localStorage at once
 */
export function localStorageDeleteMultiple(keys: string[]): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }
  
  try {
    keys.forEach(key => window.localStorage.removeItem(key));
    return true;
  } catch (error) {
    console.error('Failed to delete multiple keys from localStorage:', error);
    return false;
  }
}

export function clearLocalStorage() {
  if (!isLocalStorageAvailable()) {
    return;
  }
  window.localStorage.clear();
}