/**
 * Returns the calculated price for each EDI tier based on transaction count.
 * Returns an array of prices for each tier (Tier 1 is always $175).
 */
export function getTierPrices(monthlyTransactions: number): number[] {
  const prices: number[] = [];
  let remaining = monthlyTransactions;
  // Tier thresholds and rates
  const tierThresholds = [150, 1000, 5000, 8000, 12000, 15000, 50000, 100000];
  const tierRates = [175, 0.97, 0.74, 0.51, 0.35, 0.23, 0.15, 0.04];

  // Tier 1: always $175 for first 150 transactions
  prices.push(175);
  remaining = Math.max(0, monthlyTransactions - 150);

  for (let i = 1; i < tierThresholds.length; i++) {
    const prev = tierThresholds[i - 1];
    const curr = tierThresholds[i];
    const tierTrans = Math.max(0, Math.min(remaining, curr - prev));
    prices.push(tierTrans * tierRates[i]);
    remaining -= tierTrans;
  }
  // If any transactions above 100000, charge at last tier rate
  if (remaining > 0) {
    prices[prices.length - 1] += remaining * tierRates[tierRates.length - 1];
  }
  return prices;
}
/**
 * Returns only the tiers whose threshold is reached by the given transaction count.
 * Shows all tiers up to and including the highest tier reached.
 */
export function getReachedTiers(tiers: Tier[], totalTransactions: number): Tier[] {
  if (!tiers || tiers.length === 0) return [];
  let lastIdx = -1;
  for (let i = 0; i < tiers.length; i++) {
    if (totalTransactions >= tiers[i].min) {
      lastIdx = i;
    }
  }
  return lastIdx >= 0 ? tiers.slice(0, lastIdx + 1) : [];
}
// utils.ts

// -------- Types --------
export type DocTypeKey = string;

export type TradingPartner = {
  id: string;
  name: string;
  docs: Record<DocTypeKey, number>; // monthly document count per type
};

export type Tier = {
  id: string;
  label: string;       // e.g., "1–150"
  min: number;         // inclusive threshold at which this tier starts being charged
  max: number;         // can be informational; stacking logic uses "min"
  monthlyCost: number; // flat monthly cost when tier is reached (stacked)
};

export type MinutesPerDoc = Record<DocTypeKey, number>;

export type Totals = {
  totalByType: Record<DocTypeKey, number>;
  monthlyTransactions: number;
  monthlyLaborMinutes: number;
  // monthlyManualCost: number;
  annualManualCost: number;

  monthlyEDICost: number;
  annualEDICost: number;

  netAnnualSavings: number;     // annualManualCost - annualEDICost
  // breakEvenPerTrans: number;    // $/transaction to match manual cost (>= 0)
  monthlyHoursSaved: number;    // monthlyLaborMinutes / 60
};

// -------- Constants --------
export const DEFAULT_DOC_TYPES: DocTypeKey[] = ["850_PO", "810_INV", "855_ACK", "856_ASN"];

// Extend as needed
export const EDI_NAME_BY_CODE: Record<string, string> = {
  "204": "Motor Carrier Load Tender",
  "210": "Freight Invoice",
  "214": "Shipment Status",
  "810": "Invoice",
  "820": "Payment/Remittance",
  "832": "Price/Sales Catalog",
  "840": "RFQ",
  "843": "Response to RFQ",
  "846": "Inventory Advice",
  "850": "Purchase Order",
  "852": "Product Activity Data",
  "855": "Purchase Order Acknowledgment",
  "856": "Advance Ship Notice",
  "860": "PO Change Request",
  "940": "Warehouse Shipping Order",
  "943": "Stock Transfer Shipment Advice",
  "944": "Stock Transfer Receipt Advice",
  "945": "Warehouse Shipping Advice",
  "946": "Delivery Information",
  "997": "Functional Acknowledgment",
};

// -------- Helpers --------
export const currency = (n: number) =>
  n.toLocaleString(undefined, { style: "currency", currency: "USD" });

let _idCounter = 0;
export function genId() {
  return `id_${Date.now()}_${_idCounter++}`;
}

/** Validate 3 digits + underscore + 2+ letters, e.g. 850_PO */
export function isValidDocKey(key: string): boolean {
  return /^\d{3}_[A-Za-z]{2,}$/.test(key.trim());
}

/** "850_PO" → "Purchase Order (850)" (falls back to suffix if no mapping) */
export function getFriendlyLabelFromKey(key: DocTypeKey): string {
  const [codeDigits, suffix = ""] = key.split("_");
  const friendly = EDI_NAME_BY_CODE[codeDigits] ?? suffix.toUpperCase();
  return `${friendly} (${codeDigits})`;
}

/**
 * Compute totals & economics.
 * Manual cost = (minutes per doc × volumes) × (1 + buffer) × hourly rate / 60
 * EDI monthly = base + hosted + portal + stacked tiers (if monthlyTransactions >= tier.min) + perTx * transactions
 */
export function computeTotals(
  partners: TradingPartner[],
  minutesPerDoc: MinutesPerDoc,
  hourlyRate: number,
  // applyErrorBuffer: boolean,
  errorPctFraction: number,        // e.g., 0.015 for 1.5%
  // baseMonthlyFee: number,
  // hostedEDI: number,
  // portalFee: number,
  // finalCostPerTrans: number,
  // tiers: Tier[],
): Totals {
  const totalByType: Record<DocTypeKey, number> = {};
  for (const p of partners) {
    for (const [k, v] of Object.entries(p.docs)) {
      totalByType[k] = (totalByType[k] || 0) + (v || 0);
    }
  }

  const monthlyTransactions = Object.values(totalByType).reduce((a, b) => a + (b || 0), 0);

  // Labor minutes: sum(count * minutesPerDoc[k])
  let monthlyLaborMinutes = 0;
  for (const [k, count] of Object.entries(totalByType)) {
    const mins = minutesPerDoc[k] || 0;
    monthlyLaborMinutes += (count || 0) * mins;
  }

  // Manual cost ($/mo)
  // const buffer = applyErrorBuffer ? (1 + (errorPctFraction || 0)) : 1;
  const estErrHrs = Math.ceil((monthlyTransactions * errorPctFraction * (10 / 60)) * 10) / 10;
  // const monthlyManualCost = (monthlyLaborMinutes * buffer * (hourlyRate || 0)) / 60;
  // const annualManualCost = monthlyManualCost * 12;
  const annualManualCost = ((monthlyLaborMinutes + estErrHrs) / 60) * hourlyRate * 12;

  // Custom EDI cost calculation by tier (use getTierPrices)
  const tierPrices = getTierPrices(monthlyTransactions);
  const monthlyEDICost = tierPrices.reduce((a, b) => a + b, 0);
  const annualEDICost = monthlyEDICost * 12;

  // Savings & break-even variable per-transaction
  const netAnnualSavings = annualManualCost - annualEDICost;

  // const fixedMonthly = 175; // Only tier 1 is fixed
  // const breakEvenPerTrans = monthlyTransactions > 0
  //   ? Math.max(0, (monthlyManualCost - fixedMonthly) / monthlyTransactions)
  //   : 0;

  return {
    totalByType,
    monthlyTransactions,
    monthlyLaborMinutes,
    // monthlyManualCost,
    annualManualCost,
    monthlyEDICost,
    annualEDICost,
    netAnnualSavings,
  // breakEvenPerTrans,
    monthlyHoursSaved: monthlyLaborMinutes / 60,
  };
}
