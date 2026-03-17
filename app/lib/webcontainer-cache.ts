/**
 * WebContainer 依賴快取
 *
 * 使用 IndexedDB 儲存 deps fingerprint。
 * 如果 package.json 的依賴沒有變化，跳過 npm install。
 */

const DB_NAME = 'tellcraft-wc-cache'
const STORE_NAME = 'deps-fingerprint'
const DB_VERSION = 1

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
  })
}

/**
 * Compute a simple hash of a string (for fingerprinting package.json)
 */
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0 // Convert to 32-bit integer
  }
  return 'fp_' + Math.abs(hash).toString(36)
}

/**
 * Get the deps fingerprint from package.json content
 * Only hashes the "dependencies" section, ignoring name/version/scripts
 */
export function getDepsFingerprint(packageJsonContent: string): string {
  try {
    const pkg = JSON.parse(packageJsonContent)
    const deps = pkg.dependencies || {}
    // Sort keys for deterministic hash
    const sorted = Object.keys(deps).sort().map(k => `${k}@${deps[k]}`).join('|')
    return simpleHash(sorted)
  } catch {
    return simpleHash(packageJsonContent)
  }
}

/**
 * Save the current deps fingerprint to IndexedDB
 */
export async function saveDepsFingerprint(fingerprint: string): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      store.put(fingerprint, 'current')
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    // IndexedDB might not be available (incognito, etc.)
  }
}

/**
 * Check if the current fingerprint matches the cached one
 * Returns true if we can skip npm install
 */
export async function shouldSkipInstall(fingerprint: string): Promise<boolean> {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const request = store.get('current')
      request.onsuccess = () => {
        resolve(request.result === fingerprint)
      }
      request.onerror = () => resolve(false)
    })
  } catch {
    return false
  }
}

/**
 * Clear the cached fingerprint (force fresh install next time)
 */
export async function clearDepsCache(): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      store.delete('current')
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    // Ignore errors
  }
}
