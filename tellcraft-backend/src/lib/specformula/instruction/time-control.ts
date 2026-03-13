import type { ISAFeatureArgumentResolver } from '../helper/isa-feature-argument-resolver';

/**
 * 時間控制指令。
 * 設定測試情境的當前時間，供 TIME-System 使用。
 */
export class TimeControl {
  private readonly resolver: ISAFeatureArgumentResolver;

  constructor(resolver: ISAFeatureArgumentResolver) {
    this.resolver = resolver;
  }

  setTime(timeString: string): void {
    if (!timeString || !timeString.trim()) {
      throw new Error('[TimeControl] 缺少時間參數。');
    }

    const trimmed = timeString.trim();

    if (trimmed.startsWith('@time(') && trimmed.endsWith(')')) {
      this.resolver.setNow(trimmed.substring(6, trimmed.length - 1));
    } else if (trimmed.startsWith('@date(') && trimmed.endsWith(')')) {
      this.resolver.setNow(trimmed.substring(6, trimmed.length - 1));
    } else {
      this.resolver.setNow(timeString);
    }
  }
}
