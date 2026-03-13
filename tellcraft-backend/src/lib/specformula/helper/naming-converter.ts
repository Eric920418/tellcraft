export class NamingConverter {
  static camelToSnake(camelCase: string): string {
    if (!camelCase) return camelCase;
    return camelCase.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
  }

  static snakeToCamel(snake: string): string {
    if (!snake) return snake;
    let result = '';
    let nextUpper = false;
    for (const c of snake) {
      if (c === '_') {
        nextUpper = true;
      } else {
        result += nextUpper ? c.toUpperCase() : c;
        nextUpper = false;
      }
    }
    return result;
  }

  static getRowValue(row: Record<string, string>, key: string): string | null {
    if (key in row) return row[key];
    const camelCase = NamingConverter.snakeToCamel(key);
    if (camelCase in row) return row[camelCase];
    return null;
  }

  static toCamelCaseKeys(snakeCaseMap: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(snakeCaseMap)) {
      result[NamingConverter.snakeToCamel(key)] = value;
    }
    return result;
  }
}
