export function getStorageItem<T = string>(key: string, defaultValue?: T): T | null {
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue ?? null;
    }
    try {
      return JSON.parse(item) as T;
    } catch {
      return item as T;
    }
  } catch (error) {
    console.error(`Error getting storage item "${key}":`, error);
    return defaultValue ?? null;
  }
}

export function setStorageItem<T = unknown>(key: string, value: T): void {
  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, serialized);
  } catch (error) {
    console.error(`Error setting storage item "${key}":`, error);
  }
}

export function removeStorageItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing storage item "${key}":`, error);
  }
}

export function clearStorage(): void {
  try {
    localStorage.clear();
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
}
