/**
 * Offline-safe, crisp SVG data URI thumbnails & emblem presets.
 * Ensures product cards and store presets render reliably with zero external network dependencies.
 */

function toSvgDataUri(svg: string): string {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg.trim())}`;
}

export const PRODUCT_PRESET_IMAGES = {
  fabricSuit: toSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#eef2ff"/>
          <stop offset="100%" stop-color="#e0e7ff"/>
        </linearGradient>
      </defs>
      <rect width="240" height="240" rx="28" fill="url(#bg)"/>
      <rect x="44" y="42" width="152" height="122" rx="18" fill="#1e3a8a"/>
      <rect x="56" y="54" width="128" height="98" rx="12" fill="#334155" opacity="0.35"/>
      <path d="M44 128h152v20a16 16 0 0 1-16 16H60a16 16 0 0 1-16-16v-20z" fill="#64748b"/>
      <circle cx="64" cy="194" r="9" fill="#1e3a8a"/>
      <circle cx="86" cy="194" r="9" fill="#64748b"/>
      <circle cx="108" cy="194" r="9" fill="#09090b"/>
      <circle cx="130" cy="194" r="9" fill="#b45309"/>
      <circle cx="152" cy="194" r="9" fill="#3f6212"/>
      <circle cx="174" cy="194" r="9" fill="#881337"/>
    </svg>
  `),
  poloGarment: toSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#f0fdf4"/>
          <stop offset="100%" stop-color="#dcfce7"/>
        </linearGradient>
      </defs>
      <rect width="240" height="240" rx="28" fill="url(#bg)"/>
      <path d="M88 44l32 18 32-18 42 28-18 32-18-10v92H82V94l-18 10-18-32 42-28z" fill="#1e3a8a"/>
      <path d="M104 48l16 24 16-24" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>
      <line x1="120" y1="72" x2="120" y2="108" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>
      <circle cx="66" cy="206" r="8" fill="#1e3a8a"/>
      <circle cx="88" cy="206" r="8" fill="#dc2626"/>
      <circle cx="110" cy="206" r="8" fill="#16a34a"/>
      <circle cx="132" cy="206" r="8" fill="#2563eb"/>
      <circle cx="154" cy="206" r="8" fill="#ca8a04"/>
      <circle cx="176" cy="206" r="8" fill="#7f1d1d"/>
    </svg>
  `),
  cableRed: toSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">
      <rect width="240" height="240" rx="28" fill="#fef2f2"/>
      <circle cx="120" cy="116" r="68" fill="none" stroke="#dc2626" stroke-width="22"/>
      <circle cx="120" cy="116" r="44" fill="none" stroke="#ef4444" stroke-width="12"/>
      <circle cx="120" cy="116" r="24" fill="#ffffff" stroke="#fecaca" stroke-width="4"/>
      <rect x="64" y="190" width="112" height="22" rx="11" fill="#dc2626"/>
      <text x="120" y="205" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="12" font-weight="700">3/29 COIL</text>
    </svg>
  `),
  wireBlack: toSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">
      <rect width="240" height="240" rx="28" fill="#f1f5f9"/>
      <circle cx="120" cy="116" r="68" fill="none" stroke="#0f172a" stroke-width="22"/>
      <circle cx="120" cy="116" r="44" fill="none" stroke="#334155" stroke-width="12"/>
      <circle cx="120" cy="116" r="24" fill="#ffffff" stroke="#cbd5e1" stroke-width="4"/>
      <rect x="64" y="190" width="112" height="22" rx="11" fill="#0f172a"/>
      <text x="120" y="205" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="12" font-weight="700">7/29 REEL</text>
    </svg>
  `),
} as const;

export const STORE_EMBLEM_PRESETS = {
  goldShield: toSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <rect width="120" height="120" rx="24" fill="#0f172a"/>
      <path d="M60 18l34 14v28c0 22-14 38-34 44-20-6-34-22-34-44V32l34-14z" fill="#f59e0b"/>
      <path d="M46 60l10 10 20-22" fill="none" stroke="#0f172a" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `),
  electricBolt: toSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <rect width="120" height="120" rx="24" fill="#4f46e5"/>
      <path d="M68 18L30 66h28l-6 36 38-48H62l6-36z" fill="#ffffff"/>
    </svg>
  `),
  classicStore: toSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <rect width="120" height="120" rx="24" fill="#059669"/>
      <path d="M24 50l8-22h56l8 22H24zm6 8h60v36H30V58zm20 12v24h20V70H50z" fill="#ffffff"/>
    </svg>
  `),
} as const;
