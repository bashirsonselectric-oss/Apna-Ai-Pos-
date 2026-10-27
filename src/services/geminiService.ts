// Client service interfacing with server-side Gemini routes

export interface BillParseResult {
  supplierName: string;
  invoiceNumber: string;
  invoiceDate: string;
  totalAmount: number;
  taxAmount: number;
  items: {
    name: string;
    skuOrBarcode?: string;
    category?: string;
    quantity: number;
    unit: string;
    costPrice: number;
    retailPrice: number;
    taxPercent?: number;
    batchNumber?: string;
    expiryDate?: string;
    notes?: string;
  }[];
  confidenceScore: number;
  summaryNotes: string;
}

export interface ShelfRecognizeResult {
  detectedItems: {
    name: string;
    brand: string;
    category: string;
    estimatedCount: number;
    unit: string;
    suggestedCostPrice: number;
    suggestedRetailPrice: number;
    generatedBarcode: string;
    verticalAttributes: Record<string, any>;
    confidence: number;
  }[];
  shelfCondition: string;
  restockAdvice: string;
}

export interface RateListParseResult {
  listTitle: string;
  detectedVendor: string;
  effectiveFrom: string;
  suggestedExpiryDate: string | null;
  columnMappingDetected: Record<string, string>;
  items: {
    name: string;
    barcode: string;
    category: string;
    costPrice: number;
    retailPrice: number;
    marginPercent: number;
    unit: string;
    stockQuantity: number;
    minStockAlert: number;
    verticalSpecs: Record<string, any>;
  }[];
  totalItemsExtracted: number;
  warningsOrAnomalies: string[];
}

export interface ForecastInsightsResult {
  forecastSummary: string;
  projectedWeeklyRevenue: number;
  urgencyLevel: 'Normal' | 'Attention Needed' | 'Critical Stockout Risk';
  reorderAlerts: {
    itemName: string;
    currentStock: number;
    recommendedReorderQty: number;
    reason: string;
  }[];
  deadStockRecommendations: {
    itemName: string;
    action: string;
    expectedCashRelease: number;
  }[];
  profitGrowthTips: string[];
}

export async function parseBillWithAI(payload: {
  imageBase64?: string;
  billText?: string;
  businessVertical: string;
}): Promise<BillParseResult> {
  const res = await fetch('/api/gemini/parse-bill', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to parse bill with AI');
  }
  return data.data;
}

export async function recognizeShelfWithAI(payload: {
  imageBase64: string;
  businessVertical: string;
}): Promise<ShelfRecognizeResult> {
  const res = await fetch('/api/gemini/recognize-shelf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to analyze shelf image with AI');
  }
  return data.data;
}

export async function parseRateListWithAI(payload: {
  rawContent?: string;
  imageBase64?: string;
  fileName?: string;
  businessVertical: string;
  autoExpireDays?: number;
}): Promise<RateListParseResult> {
  const res = await fetch('/api/gemini/parse-ratelist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to parse rate list with AI');
  }
  return data.data;
}

export async function getDemandForecastWithAI(payload: {
  salesSummary: any;
  inventoryStats: any;
  businessVertical: string;
  storeName: string;
}): Promise<ForecastInsightsResult> {
  const res = await fetch('/api/gemini/forecast-insights', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to get forecast with AI');
  }
  return data.data;
}
