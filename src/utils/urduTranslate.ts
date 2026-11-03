// Urdu Auto-Translation and Phonetic Transliteration Engine for Pakistani Retail POS
// Supports Electrical/Hardware, Grocery, Pharmacy, Fast Food, Sanitary, and General Store catalogs

const URDU_DICTIONARY: Record<string, string> = {
  // Cables & Electrical
  cable: 'کیبل',
  cables: 'کیبلز',
  wire: 'تار',
  wires: 'تاریں',
  copper: 'کاپر / تانبا',
  breaker: 'بریکر',
  breakers: 'بریکرز',
  switch: 'سوئچ',
  switches: 'سوئچز',
  socket: 'ساکٹ',
  sockets: 'ساکٹس',
  board: 'بورڈ',
  plate: 'پلیٹ',
  fan: 'پنکھا',
  fans: 'پنکھے',
  deluxe: 'ڈیلکس',
  ceiling: 'چھت',
  bracket: 'بریکٹ',
  exhaust: 'ایگزاسٹ',
  bulb: 'بلب',
  bulbs: 'بلب',
  led: 'ایل ای ڈی',
  light: 'لائٹ',
  lights: 'لائٹس',
  strip: 'سٹرپ',
  holder: 'ہولڈر',
  plug: 'پلگ',
  extension: 'ایکسٹینشن',
  dimmer: 'ڈمر',
  choke: 'چوک',
  starter: 'سٹارٹر',
  tape: 'ٹیپ',
  conduit: 'کنڈیوٹ',
  pipe: 'پائپ',
  bend: 'بینڈ',
  elbow: 'البو',
  socket_pvc: 'ساکٹ',
  pvc: 'پی وی سی',
  rawat: 'راولپنڈی',
  pakistan: 'پاکستان',
  schneider: 'شنائیڈر',
  gm: 'جی ایم',
  fast: 'فاسٹ',
  osaka: 'اوساکا',
  exide: 'ایکسائڈ',
  faisal: 'فیصل',
  millat: 'ملت',
  anchor: 'اینکر',
  master: 'ماسٹر',
  royal: 'رائل',
  pel: 'پی ایل',
  climax: 'کلائمیکس',
  orient: 'اورینٹ',
  battery: 'بیٹری',
  batteries: 'بیٹریاں',
  inverter: 'انورٹر',
  ups: 'یو پی ایس',
  solar: 'سولر',
  panel: 'پینل',
  charger: 'چارجر',
  tubular: 'ٹیوبلر',
  single: 'سنگل',
  double: 'ڈبل',
  triple: 'ٹرپل',
  pole: 'پول',
  core: 'کور',
  mcb: 'ایم سی بی',
  mccb: 'ایم سی سی بی',
  amp: 'ایمپیئر',
  amps: 'ایمپیئر',
  watt: 'واٹ',
  watts: 'واٹ',
  volt: 'وولٹ',
  volts: 'وولٹ',

  // Hardware, Tools & Sanitary
  drill: 'ڈرل مشین',
  hammer: 'ہتھوڑا',
  screw: 'پیچ',
  screws: 'پیچ',
  nail: 'کیل',
  nails: 'کیلیں',
  tool: 'اوزار',
  tools: 'اوزار',
  cutter: 'کٹر',
  pliers: 'پلاس',
  wrench: 'رینچ',
  spanner: 'پانا',
  tap: 'ٹونٹی',
  taps: 'ٹونٹیاں',
  valve: 'والو',
  shower: 'شاور',
  sink: 'سنک',
  basin: 'بیسن',
  tank: 'ٹینک',
  motor: 'موٹر',
  pump: 'پمپ',

  // Grocery, Mart & Daily Essentials
  sugar: 'چینی',
  oil: 'کوکنگ آئل',
  ghee: 'گھی',
  rice: 'چاول',
  flour: 'آٹا',
  tea: 'چائے کی پتی',
  milk: 'دودھ',
  soap: 'صابن',
  shampoo: 'شیمپو',
  detergent: 'سرف',
  salt: 'نمک',
  chilli: 'لال مرچ',
  spices: 'مصالحہ جات',
  pulse: 'دال',
  pulses: 'دالیں',
  dal: 'دال',
  daal: 'دال',
  biscuit: 'بسکٹ',
  biscuits: 'بسکٹس',
  bread: 'ڈبل روٹی',
  butter: 'مکھن',
  cheese: 'پنیر',
  egg: 'انڈہ',
  eggs: 'انڈے',
  water: 'پانی',
  juice: 'جوس',

  // Pharmacy & Medical
  tablet: 'گولی',
  tablets: 'گولیاں',
  capsule: 'کیپسول',
  capsules: 'کیپسولز',
  syrup: 'شربت',
  injection: 'انجکشن',
  drops: 'قطرے',
  cream: 'کریم',
  ointment: 'مرہم',
  bandage: 'پٹی',
  panadol: 'پیناڈول',
  disprin: 'ڈسپرین',
  brufen: 'بروفین',
  calpol: 'کیلپول',
  arinac: 'ایرینیک',
  augmentin: 'اگمنٹن',
  saniplast: 'سینی پلاسٹ',

  // Units & Colors
  coil: 'کوائل',
  meter: 'میٹر',
  roll: 'رول',
  box: 'ڈبہ',
  packet: 'پیکٹ',
  pack: 'پیک',
  carton: 'کارٹن',
  bottle: 'بوتل',
  kg: 'کلوگرام',
  g: 'گرام',
  gram: 'گرام',
  grams: 'گرام',
  pcs: 'عدد',
  piece: 'عدد',
  pieces: 'عدد',
  dozen: 'درجن',
  red: 'لال',
  black: 'کالا',
  white: 'سفید',
  blue: 'نیلا',
  yellow: 'پیلا',
  green: 'سبز',
  grey: 'سلیٹی',
  gray: 'سلیٹی',
  silver: 'سلور',
  golden: 'سنہری',
};

// Phonetic fallback transliteration mapping for English letters to Urdu letters
const PHONETIC_MAP: Record<string, string> = {
  a: 'ا',
  b: 'ب',
  c: 'ک',
  d: 'ڈ',
  e: 'ی',
  f: 'ف',
  g: 'گ',
  h: 'ہ',
  i: 'آئی',
  j: 'ج',
  k: 'ک',
  l: 'ل',
  m: 'م',
  n: 'ن',
  o: 'او',
  p: 'پ',
  q: 'ق',
  r: 'ر',
  s: 'س',
  t: 'ٹ',
  u: 'یو',
  v: 'وی',
  w: 'ڈبلیو',
  x: 'ایکس',
  y: 'وائی',
  z: 'زیڈ',
  th: 'تھ',
  ch: 'چ',
  sh: 'ش',
  kh: 'خ',
  gh: 'غ',
  ph: 'ف',
};

/**
 * Automatically translates/transliterates an English product title into Urdu
 * Example: "Pakistan Cables 7/0.029 Coil Red" -> "پاکستان کیبلز 7/0.029 کوائل لال"
 */
export function autoTranslateToUrdu(englishText: string): string {
  if (!englishText || !englishText.trim()) return '';

  // Clean and split words while preserving special spec tokens (like 7/29, 3/0.029, 63A, 20W)
  const tokens = englishText.trim().split(/\s+/);

  const translatedTokens = tokens.map((token) => {
    // Preserve pure numbers, fractions, gauges, wattages, or serials
    if (/^[0-9./\\-]+[a-zA-Z]?$/.test(token) || /^[0-9]+(A|W|V|Ah|kg|g|m|mm|cm|oz)?$/i.test(token)) {
      return token;
    }

    const cleanLower = token.toLowerCase().replace(/[^a-z0-9]/g, '');

    // 1. Direct dictionary match
    if (URDU_DICTIONARY[cleanLower]) {
      return URDU_DICTIONARY[cleanLower];
    }

    // 2. Singular check if ends with 's'
    if (cleanLower.endsWith('s')) {
      const singular = cleanLower.slice(0, -1);
      if (URDU_DICTIONARY[singular]) {
        return URDU_DICTIONARY[singular];
      }
    }

    // 3. Fallback: Phonetic transliteration
    let result = '';
    let i = 0;
    while (i < cleanLower.length) {
      const twoChar = cleanLower.substr(i, 2);
      if (PHONETIC_MAP[twoChar]) {
        result += PHONETIC_MAP[twoChar];
        i += 2;
        continue;
      }
      const oneChar = cleanLower.substr(i, 1);
      result += PHONETIC_MAP[oneChar] || oneChar;
      i += 1;
    }

    return result || token;
  });

  return translatedTokens.join(' ');
}
