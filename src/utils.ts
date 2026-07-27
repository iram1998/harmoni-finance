import { Asset } from './types';

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export interface DepreciationResult {
  currentValue: number;
  accumulatedDepreciation: number;
  monthlyDepreciation: number;
  elapsedMonths: number;
  isFullyDepreciated: boolean;
  projections: { year: number; value: number; accumulated: number }[];
}

export function calculateAssetDepreciation(
  purchasePriceOrAsset: number | Asset,
  purchaseDate?: string,
  method: 'none' | 'straight_line' | 'declining_balance' = 'none',
  usefulLifeYears: number = 5,
  salvageValue: number = 0
): DepreciationResult {
  let purchasePrice = 0;
  let dateStr = '';
  let depMethod: 'none' | 'straight_line' | 'declining_balance' = 'none';
  let lifeYears = 5;
  let salvageVal = 0;

  if (typeof purchasePriceOrAsset === 'object' && purchasePriceOrAsset !== null) {
    const asset = purchasePriceOrAsset;
    purchasePrice = asset.purchasePrice || 0;
    dateStr = asset.purchaseDate || new Date().toISOString();
    depMethod = asset.depreciationMethod || 'none';
    lifeYears = asset.depreciationUsefulLife || 5;
    salvageVal = asset.depreciationSalvageValue || 0;
  } else {
    purchasePrice = typeof purchasePriceOrAsset === 'number' ? purchasePriceOrAsset : 0;
    dateStr = purchaseDate || new Date().toISOString();
    depMethod = method;
    lifeYears = usefulLifeYears;
    salvageVal = salvageValue;
  }

  const purchase = new Date(dateStr);
  const now = new Date();
  
  // Calculate difference in months
  const yearsDiff = now.getFullYear() - purchase.getFullYear();
  const monthsDiff = now.getMonth() - purchase.getMonth();
  const elapsedMonths = Math.max(0, (yearsDiff * 12) + monthsDiff);
  
  let currentValue = purchasePrice;
  let accumulatedDepreciation = 0;
  let monthlyDepreciation = 0;
  let isFullyDepreciated = false;
  
  const usefulLifeMonths = Math.max(1, lifeYears * 12);
  const salvage = Math.max(0, Math.min(purchasePrice, salvageVal));

  if (depMethod === 'straight_line') {
    const totaldepreciable = purchasePrice - salvage;
    monthlyDepreciation = totaldepreciable / usefulLifeMonths;
    accumulatedDepreciation = Math.min(totaldepreciable, monthlyDepreciation * elapsedMonths);
    currentValue = Math.max(salvage, purchasePrice - accumulatedDepreciation);
    isFullyDepreciated = elapsedMonths >= usefulLifeMonths;
  } else if (method === 'declining_balance') {
    // Double declining balance: annual rate = 2 / usefulLife
    const annualRate = 2 / Math.max(1, usefulLifeYears);
    const monthlyRate = annualRate / 12;
    currentValue = purchasePrice * Math.pow(1 - monthlyRate, elapsedMonths);
    currentValue = Math.max(salvage, currentValue);
    accumulatedDepreciation = purchasePrice - currentValue;
    isFullyDepreciated = currentValue <= salvage || elapsedMonths >= usefulLifeMonths;
    
    // Monthly depreciation estimate at current point
    monthlyDepreciation = currentValue * monthlyRate;
  }

  // Generate projections for the next 5 years (or usefulLifeYears)
  const projections = [];
  const projectionYears = Math.max(5, usefulLifeYears);
  
  for (let i = 0; i <= projectionYears; i++) {
    const m = i * 12;
    let val = purchasePrice;
    let accum = 0;
    
    if (method === 'straight_line') {
      const totaldepreciable = purchasePrice - salvage;
      const monthlyDep = totaldepreciable / usefulLifeMonths;
      accum = Math.min(totaldepreciable, monthlyDep * m);
      val = Math.max(salvage, purchasePrice - accum);
    } else if (method === 'declining_balance') {
      const annualRate = 2 / Math.max(1, usefulLifeYears);
      const monthlyRate = annualRate / 12;
      val = Math.max(salvage, purchasePrice * Math.pow(1 - monthlyRate, m));
      accum = purchasePrice - val;
    }
    
    projections.push({
      year: i,
      value: Math.round(val),
      accumulated: Math.round(accum)
    });
  }

  return {
    currentValue: Math.round(currentValue),
    accumulatedDepreciation: Math.round(accumulatedDepreciation),
    monthlyDepreciation: Math.round(monthlyDepreciation),
    elapsedMonths,
    isFullyDepreciated,
    projections
  };
}

export function getAssetEffectiveValue(asset: Asset): number {
  if (asset.useAutoDepreciation && asset.depreciationMethod && asset.depreciationMethod !== 'none') {
    const dep = calculateAssetDepreciation(
      asset.purchasePrice,
      asset.purchaseDate,
      asset.depreciationMethod,
      asset.depreciationUsefulLife || 5,
      asset.depreciationSalvageValue || 0
    );
    return dep.currentValue;
  }
  return asset.currentValue;
}

/**
 * Converts DMS (Degrees, Minutes, Seconds) format to Decimal Degrees.
 * Examples:
 *  - "2°51'34.52\"S" -> -2.859589
 *  - "114°54'5.49\"E" -> 114.901525
 *  - "2 51 34.52 S" -> -2.859589
 *  - "-2.859589" -> -2.859589
 */
export function parseDMSToDecimal(dmsStr: string): number | null {
  if (!dmsStr) return null;
  
  // Normalize string: handle smart quotes, prime symbols, degree variations
  let str = dmsStr
    .trim()
    .replace(/[”″“]/g, '"')
    .replace(/[’′‘]/g, "'")
    .replace(/º/g, '°');

  // If it's already a plain numeric string like "-2.859589" or "114.901525"
  if (/^-?\d+(\.\d+)?$/.test(str)) {
    return parseFloat(str);
  }

  // Detect direction first (N/S/E/W/O/U/B/T)
  // S = South (Selatan), W/B = West (Barat), N/U = North (Utara), E/T = East (Timur)
  let isNegative = false;
  const dirMatch = str.match(/([NSEWOUBT])/i);
  if (dirMatch) {
    const dir = dirMatch[1].toUpperCase();
    if (dir === 'S' || dir === 'W' || dir === 'B' || str.startsWith('-')) {
      isNegative = true;
    }
  } else if (str.startsWith('-')) {
    isNegative = true;
  }

  // Extract all numeric components (degrees, minutes, seconds)
  const numbers = str.match(/\d+(\.\d+)?/g);
  if (!numbers || numbers.length === 0) return null;

  const degrees = parseFloat(numbers[0]) || 0;
  const minutes = numbers.length > 1 ? parseFloat(numbers[1]) : 0;
  const seconds = numbers.length > 2 ? parseFloat(numbers[2]) : 0;

  let decimal = degrees + minutes / 60 + seconds / 3600;

  if (isNegative) {
    decimal = -decimal;
  }

  return decimal;
}

/**
 * Parses combined coordinate string containing both Latitude and Longitude.
 * Supports:
 *  - DMS combined: "2°51'34.52\"S 114°54'5.49\"E" or "2°51'34.52\"S, 114°54'5.49\"E"
 *  - Decimal combined: "-2.859589, 114.901525" or "-2.859589 114.901525"
 */
export function parseCombinedCoordinates(input: string): { lat: number; lng: number } | null {
  if (!input || !input.trim()) return null;
  
  const str = input
    .trim()
    .replace(/[”″“]/g, '"')
    .replace(/[’′‘]/g, "'")
    .replace(/º/g, '°');

  // 1. If comma separated
  if (str.includes(',')) {
    const parts = str.split(',');
    if (parts.length === 2) {
      const lat = parseDMSToDecimal(parts[0]);
      const lng = parseDMSToDecimal(parts[1]);
      if (lat !== null && lng !== null) {
        return { lat, lng };
      }
    }
  }

  // 2. Try matching DMS pair: [Lat with N/S] [Lng with E/W]
  const dmsPairMatch = str.match(/^(.+?[NSU])\s*[,;\s]+\s*(.+?[EWBT])$/i);
  if (dmsPairMatch) {
    const lat = parseDMSToDecimal(dmsPairMatch[1]);
    const lng = parseDMSToDecimal(dmsPairMatch[2]);
    if (lat !== null && lng !== null) {
      return { lat, lng };
    }
  }

  // 3. Try matching reversed DMS pair: [Lng with E/W] [Lat with N/S]
  const dmsRevMatch = str.match(/^(.+?[EWBT])\s*[,;\s]+\s*(.+?[NSU])$/i);
  if (dmsRevMatch) {
    const lng = parseDMSToDecimal(dmsRevMatch[1]);
    const lat = parseDMSToDecimal(dmsRevMatch[2]);
    if (lat !== null && lng !== null) {
      return { lat, lng };
    }
  }

  // 4. Try splitting by whitespace if two parts exist
  const parts = str.split(/\s+/);
  if (parts.length === 2) {
    const lat = parseDMSToDecimal(parts[0]);
    const lng = parseDMSToDecimal(parts[1]);
    if (lat !== null && lng !== null) {
      return { lat, lng };
    }
  }

  return null;
}

/**
 * Converts Decimal Degrees to DMS format string.
 * Example:
 *  - lat: -2.859589 -> "2°51'34.52\"S"
 *  - lng: 114.901525 -> "114°54'5.49\"E"
 */
export function decimalToDMS(val: number, isLat: boolean): string {
  if (val === undefined || val === null || isNaN(val)) return '-';
  const dir = isLat ? (val >= 0 ? 'N' : 'S') : (val >= 0 ? 'E' : 'W');
  const absVal = Math.abs(val);
  const degrees = Math.floor(absVal);
  const minutesFull = (absVal - degrees) * 60;
  const minutes = Math.floor(minutesFull);
  const seconds = ((minutesFull - minutes) * 60).toFixed(2);
  return `${degrees}°${minutes}'${seconds}"${dir}`;
}


