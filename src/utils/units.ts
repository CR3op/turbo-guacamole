import { UnitSystem } from '../types';

export const KG_TO_LBS = 2.20462;
export const CM_TO_IN = 0.393701;

export function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getOffsetDateISO(daysOffset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Monday = 0 ... Sunday = 6 */
export function getTodayWeekdayIndex(): number {
  const jsDay = new Date().getDay(); // 0=Sun, 1=Mon
  return jsDay === 0 ? 6 : jsDay - 1;
}

export function formatWeight(weightKg: number, unit: UnitSystem, decimals = 1): string {
  if (unit === 'imperial') {
    return `${(weightKg * KG_TO_LBS).toFixed(decimals)} lbs`;
  }
  return `${weightKg.toFixed(decimals)} kg`;
}

export function weightKgToDisplayNumber(weightKg: number, unit: UnitSystem): number {
  const val = unit === 'imperial' ? weightKg * KG_TO_LBS : weightKg;
  return Math.round(val * 10) / 10;
}

export function displayWeightToKg(displayVal: number, unit: UnitSystem): number {
  if (unit === 'imperial') {
    return Math.round((displayVal / KG_TO_LBS) * 100) / 100;
  }
  return Math.round(displayVal * 100) / 100;
}

export function formatHeight(heightCm: number, unit: UnitSystem): string {
  if (unit === 'imperial') {
    const totalInches = Math.round(heightCm * CM_TO_IN);
    const feet = Math.floor(totalInches / 12);
    const inches = totalInches % 12;
    return `${feet}'${inches}"`;
  }
  return `${Math.round(heightCm)} cm`;
}

export function formatLength(cm: number, unit: UnitSystem): string {
  if (unit === 'imperial') {
    return `${(cm * CM_TO_IN).toFixed(1)} in`;
  }
  return `${cm.toFixed(1)} cm`;
}

export function formatVolume(volumeKg: number, unit: UnitSystem): string {
  const val = unit === 'imperial' ? volumeKg * KG_TO_LBS : volumeKg;
  const suffix = unit === 'imperial' ? 'lbs' : 'kg';
  if (val >= 1000) {
    return `${(val / 1000).toFixed(1)}k ${suffix}`;
  }
  return `${Math.round(val)} ${suffix}`;
}

export function formatWater(waterMl: number, unit: UnitSystem): string {
  if (unit === 'imperial') {
    const oz = Math.round(waterMl * 0.033814);
    return `${oz} oz`;
  }
  return `${(waterMl / 1000).toFixed(1)} L`;
}
