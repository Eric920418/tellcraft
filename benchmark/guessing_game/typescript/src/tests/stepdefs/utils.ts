/**
 * Example: "user.email.host" => ["user", "email", "host"]
 */
export function splitPath(path: string): string[] {
  return path.split('.').filter(key => key.length > 0);
}

/**
 * Example: setNestedField(obj, "user.email.host", "example.com")
 *
 * @param obj - The target object
 * @param path - The dot-notation path (e.g., "user.email.host")
 * @param value - The value to set
 */
export function setNestedField(
  obj: Record<string, any>,
  path: string,
  value: any
): void {
  const keys = splitPath(path);

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in obj) || typeof obj[key] !== 'object' || obj[key] === null) {
      obj[key] = {};
    }
    obj = obj[key];
  }

  obj[keys[keys.length - 1]] = value;
}

/**
 * Example: getNestedField(obj, "user.email.host") => "example.com"
 *
 * @param obj - The source object
 * @param path - The dot-notation path (e.g., "user.email.host")
 * @returns The value at the specified path, or undefined if not found
 */
export function getNestedField(
  obj: Record<string, any>,
  path: string
): any {
  const keys = splitPath(path);
  let current = obj;

  for (const key of keys) {
    if (current === null || current === undefined || !(key in current)) {
      return undefined;
    }
    current = current[key];
  }

  return current;
}

/**
 * Example:
 * | name | email.host | email.local |
 * | John | example.com | john        |
 *
 * Result:
 * {
 *   name: "John",
 *   email: {
 *     host: "example.com",
 *     local: "john"
 *   }
 * }
 */
export function dataTableToObject(dataTable: any): Record<string, any> {
  const rows = dataTable.hashes();
  if (rows.length === 0) {
    return {};
  }

  const row = rows[0];
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(row)) {
    setNestedField(result, key, value);
  }

  return result;
}
