import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Safely save a string value to AsyncStorage with error handling
 */
export async function asyncSet(key: string, value: string): Promise<boolean> {
  try {
    await AsyncStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`Failed to save ${key} to AsyncStorage:`, error);
    return false;
  }
}

/**
 * Safely save an object value to AsyncStorage as JSON
 */
export async function asyncSetObject(key: string, value: any): Promise<boolean> {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
    return true;
  } catch (error) {
    console.error(`Failed to save object to AsyncStorage with key ${key}:`, error);
    return false;
  }
}

/**
 * Safely retrieve a string value from AsyncStorage with error handling
 */
export async function asyncGet(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.error(`Failed to retrieve ${key} from AsyncStorage:`, error);
    return null;
  }
}

/**
 * Safely retrieve and parse a JSON object from AsyncStorage
 */
export async function asyncGetObject<T = any>(key: string): Promise<T | null> {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) as T : null;
  } catch (error) {
    console.error(`Failed to retrieve object from AsyncStorage with key ${key}:`, error);
    return null;
  }
}

/**
 * Safely delete a value from AsyncStorage with error handling
 */
export async function asyncDelete(key: string): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Failed to delete ${key} from AsyncStorage:`, error);
    return false;
  }
}

/**
 * Delete multiple keys from AsyncStorage at once
 */
export async function asyncDeleteMultiple(keys: string[]): Promise<boolean> {
  try {
    await AsyncStorage.multiRemove(keys);
    return true;
  } catch (error) {
    console.error('Failed to delete multiple keys from AsyncStorage:', error);
    return false;
  }
}