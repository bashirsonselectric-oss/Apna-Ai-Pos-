import { SaleRecord, StoreProfile } from '../types';

export interface ReceiptImageOptions {
  customerPhone?: string;
  customNote?: string;
  includeBankDetails?: boolean;
  scale?: number; // default 2 for retina / high-resolution crispness
}

/**
 * Draws a high-resolution 4:5 modern digital sales receipt card on canvas,
 * isolated on a soft neutral light gray background, matching the clean minimalist SaaS style.
 */
export function generateReceiptCanvas(
  receipt: SaleRecord,
  storeProfile: StoreProfile,
  options: ReceiptImageOptions = {}
): HTMLCanvasElement {
  const scale = options.scale || 2;
  const cardWidth = 720;
  const paddingX = 44;
  const currency = storeProfile.currency || 'Rs.';

  // Prepare items
  const items = receipt.items && receipt.items.length > 0
    ? receipt.items
    : [
        {
          productId: 'demo',
          name: 'Yyy',
          quantity: 1,
          unit: 'pcs',
          unitPrice: 85,
          subtotal: 85,
          costPrice: 60,
        },
      ];

  // Calculate dynamic card height based on items count
  const baseHeaderHeight = 240;
  const itemRowHeight = 44;
  const itemsTotalHeight = items.length * itemRowHeight;
  const summaryHeight = receipt.discountAmount > 0 ? 190 : 160;
  const footerBoxHeight = 110;
  const bottomNoteHeight = 70;
  const innerCardHeight = baseHeaderHeight + itemsTotalHeight + summaryHeight + footerBoxHeight + bottomNoteHeight;

  // Outer canvas margins (soft neutral background padding)
  const marginX = 60;
  const marginY = 60;
  const canvasWidth = cardWidth + marginX * 2; // 840
  // Target minimum 4:5 aspect ratio (840 x 1050)
  const targetMinHeight = Math.round((canvasWidth * 5) / 4);
  const canvasHeight = Math.max(targetMinHeight, innerCardHeight + marginY * 2);

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth * scale;
  canvas.height = canvasHeight * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Scale all coordinates for high-DPI rendering
  ctx.scale(scale, scale);

  // 1. Soft neutral light gray background
  ctx.fillStyle = '#edf2f7';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Subtle soft radial vignette highlight behind card
  const bgGrad = ctx.createRadialGradient(
    canvasWidth / 2,
    canvasHeight / 2,
    100,
    canvasWidth / 2,
    canvasHeight / 2,
    canvasWidth
  );
  bgGrad.addColorStop(0, '#f8fafc');
  bgGrad.addColorStop(1, '#e2e8f0');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // 2. Centered White Receipt Card with Drop Shadow
  const cardX = marginX;
  const cardY = marginY;
  const cardH = canvasHeight - marginY * 2;
  const cornerRadius = 24;

  // Drop shadow
  ctx.save();
  ctx.shadowColor = 'rgba(15, 23, 42, 0.10)';
  ctx.shadowBlur = 36;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 16;
  ctx.fillStyle = '#ffffff';

  drawRoundedRect(ctx, cardX, cardY, cardWidth, cardH, cornerRadius);
  ctx.fill();
  ctx.restore();

  // Subtle card border
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  drawRoundedRect(ctx, cardX, cardY, cardWidth, cardH, cornerRadius);
  ctx.stroke();

  // 3. Card Content Rendering
  let currentY = cardY + 44;
  const contentLeft = cardX + paddingX;
  const contentRight = cardX + cardWidth - paddingX;
  const contentCenter = cardX + cardWidth / 2;

  // Top Label: "SALE RECEIPT"
  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SALE RECEIPT', contentCenter, currentY);
  currentY += 28;

  // Store Title: Bold, dark professional
  ctx.fillStyle = '#0f172a';
  ctx.font = '800 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const storeTitle = storeProfile.name || 'Bashir Sons Electric & Hardware Store';
  ctx.fillText(storeTitle, contentCenter, currentY);
  currentY += 22;

  // Subtitle / Address & NTN
  ctx.fillStyle = '#64748b';
  ctx.font = '400 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const addressLine = storeProfile.address || 'Shop # 14-16, Madina Electric Market, Brandreth Road, Lahore';
  const ntnLine = storeProfile.taxRegistrationNo ? ` • NTN: ${storeProfile.taxRegistrationNo}` : ' • NTN: 7892140-5';
  ctx.fillText(addressLine + ntnLine, contentCenter, currentY);
  currentY += 24;

  // Divider line 1: Thin, dashed light grey rule
  drawDashedLine(ctx, contentLeft, currentY, contentRight, currentY);
  currentY += 26;

  // Meta info row: Invoice # left, Counter / Status right
  ctx.font = '600 14px "SF Mono", Menlo, Consolas, monospace';
  ctx.fillStyle = '#1e293b';
  ctx.textAlign = 'left';
  ctx.fillText(`Invoice ${receipt.invoiceNo}`, contentLeft, currentY);

  ctx.textAlign = 'right';
  ctx.fillStyle = receipt.paymentMethod === 'udhar' ? '#d97706' : '#64748b';
  const paymentStatusLabel = receipt.paymentMethod === 'udhar' ? 'Counter 1 / Credit' : 'Counter 1 / Paid';
  ctx.fillText(paymentStatusLabel, contentRight, currentY);
  currentY += 22;

  // Extra Meta Details: Date, Time & Customer
  const dateObj = new Date(receipt.timestamp);
  const dateFormatted = dateObj.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeFormatted = dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  ctx.font = '400 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.textAlign = 'left';
  ctx.fillText(`Date: ${dateFormatted} • ${timeFormatted}`, contentLeft, currentY);

  if (receipt.customerName && receipt.customerName !== 'Walk-in Customer') {
    ctx.textAlign = 'right';
    ctx.fillStyle = '#334155';
    ctx.fillText(`Customer: ${receipt.customerName}`, contentRight, currentY);
  } else if (options.customerPhone) {
    ctx.textAlign = 'right';
    ctx.fillStyle = '#334155';
    ctx.fillText(`Tel: ${options.customerPhone}`, contentRight, currentY);
  }
  currentY += 18;

  // Divider line 2: Thin, dashed light grey rule
  drawDashedLine(ctx, contentLeft, currentY, contentRight, currentY);
  currentY += 30;

  // Items List
  items.forEach((item) => {
    // Left: item name
    ctx.textAlign = 'left';
    ctx.fillStyle = '#0f172a';
    ctx.font = '600 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

    // Truncate name if too long
    let displayName = item.name;
    if (ctx.measureText(displayName).width > 340) {
      while (ctx.measureText(displayName + '...').width > 340 && displayName.length > 5) {
        displayName = displayName.slice(0, -1);
      }
      displayName += '...';
    }
    ctx.fillText(displayName, contentLeft, currentY);

    // Center: quantity
    ctx.textAlign = 'center';
    ctx.fillStyle = '#64748b';
    ctx.font = '500 14px "SF Mono", Menlo, Consolas, monospace';
    ctx.fillText(`×${item.quantity}`, contentCenter + 40, currentY);

    // Right: subtotal
    ctx.textAlign = 'right';
    ctx.fillStyle = '#0f172a';
    ctx.font = '700 15px "SF Mono", Menlo, Consolas, monospace';
    ctx.fillText(`${currency} ${item.subtotal.toFixed(2)}`, contentRight, currentY);

    currentY += itemRowHeight;
  });

  // Divider line 3: Thin, dashed light grey rule
  drawDashedLine(ctx, contentLeft, currentY, contentRight, currentY);
  currentY += 28;

  // Summary Section:
  const subtotalVal = receipt.items && receipt.items.length > 0 ? receipt.subtotal : 85.0;
  const totalVal = receipt.items && receipt.items.length > 0 ? receipt.grandTotal : 85.0;

  // Subtotal row
  ctx.textAlign = 'left';
  ctx.font = '400 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('Subtotal', contentLeft, currentY);

  ctx.textAlign = 'right';
  ctx.font = '600 14px "SF Mono", Menlo, Consolas, monospace';
  ctx.fillStyle = '#1e293b';
  ctx.fillText(`${currency} ${subtotalVal.toFixed(2)}`, contentRight, currentY);
  currentY += 26;

  // Discount row (if any)
  if (receipt.discountAmount > 0) {
    ctx.textAlign = 'left';
    ctx.font = '400 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#e11d48';
    ctx.fillText('Discount', contentLeft, currentY);

    ctx.textAlign = 'right';
    ctx.font = '600 14px "SF Mono", Menlo, Consolas, monospace';
    ctx.fillStyle = '#e11d48';
    ctx.fillText(`-${currency} ${receipt.discountAmount.toFixed(2)}`, contentRight, currentY);
    currentY += 26;
  }

  // Delivery / Tax row
  ctx.textAlign = 'left';
  ctx.font = '400 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('Delivery / Tax', contentLeft, currentY);

  ctx.textAlign = 'right';
  ctx.font = '600 14px "SF Mono", Menlo, Consolas, monospace';
  ctx.fillStyle = '#64748b';
  ctx.fillText(`${currency} 0.00`, contentRight, currentY);
  currentY += 24;

  // Solid thin separator for Total
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(contentLeft, currentY);
  ctx.lineTo(contentRight, currentY);
  ctx.stroke();
  currentY += 26;

  // Total (bold, larger text)
  ctx.textAlign = 'left';
  ctx.font = '800 19px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('Total', contentLeft, currentY);

  ctx.textAlign = 'right';
  ctx.font = '800 22px "SF Mono", Menlo, Consolas, monospace';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(`${currency} ${totalVal.toFixed(2)}`, contentRight, currentY);
  currentY += 34;

  // 4. Footer Box: A light gray rounded container at the bottom
  const footerBoxH = 68;
  const footerBoxY = currentY;
  ctx.fillStyle = '#f8fafc';
  drawRoundedRect(ctx, contentLeft, footerBoxY, contentRight - contentLeft, footerBoxH, 14);
  ctx.fill();
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  drawRoundedRect(ctx, contentLeft, footerBoxY, contentRight - contentLeft, footerBoxH, 14);
  ctx.stroke();

  // Draw simulated crisp QR Code on the left of footer box
  const qrX = contentLeft + 16;
  const qrY = footerBoxY + 12;
  const qrSize = 44;
  drawSimulatedQrCode(ctx, qrX, qrY, qrSize, receipt.invoiceNo);

  // Footer Box Text: "PAYMENT: CASH / RAAST" with small green checkmark badge "✓ PAID"
  const paymentMethodLabel = receipt.paymentMethod === 'udhar'
    ? 'PAYMENT: KHATA / UDHAR'
    : receipt.paymentMethod === 'jazzcash'
    ? 'PAYMENT: JAZZCASH'
    : receipt.paymentMethod === 'easypaisa'
    ? 'PAYMENT: EASYPAISA'
    : receipt.paymentMethod === 'bank_transfer'
    ? 'PAYMENT: RAAST / BANK'
    : 'PAYMENT: CASH / RAAST';

  const badgeText = receipt.paymentMethod === 'udhar' ? '⏳ CREDIT' : '✓ PAID';
  const badgeBg = receipt.paymentMethod === 'udhar' ? '#fef3c7' : '#dcfce7';
  const badgeTextColor = receipt.paymentMethod === 'udhar' ? '#92400e' : '#15803d';

  // Badge on the right
  ctx.font = '700 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const badgeWidth = ctx.measureText(badgeText).width + 18;
  const badgeX = contentRight - 16 - badgeWidth;
  const badgeY = footerBoxY + (footerBoxH - 26) / 2;

  ctx.fillStyle = badgeBg;
  drawRoundedRect(ctx, badgeX, badgeY, badgeWidth, 26, 6);
  ctx.fill();

  ctx.fillStyle = badgeTextColor;
  ctx.textAlign = 'center';
  ctx.fillText(badgeText, badgeX + badgeWidth / 2, badgeY + 17);

  // Payment text before badge
  ctx.textAlign = 'right';
  ctx.fillStyle = '#334155';
  ctx.font = '700 12px "SF Mono", Menlo, Consolas, monospace';
  ctx.fillText(paymentMethodLabel, badgeX - 14, footerBoxY + footerBoxH / 2 + 4);

  currentY += footerBoxH + 24;

  // 5. Bottom text: Centered subtle footer note
  ctx.textAlign = 'center';
  ctx.font = '400 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#94a3b8';
  const footerNote = storeProfile.receiptFooter || 'Thank you for shopping with us! No cash refund after 7 days.';
  ctx.fillText(footerNote, contentCenter, currentY);

  return canvas;
}

/**
 * Draws rounded rectangle path
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Draws a dashed line on canvas
 */
function drawDashedLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) {
  ctx.save();
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

/**
 * Draws a clean simulated QR code matrix on canvas with authentic corner finder patterns
 */
function drawSimulatedQrCode(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  seedStr: string
) {
  ctx.save();
  // White background for QR code
  ctx.fillStyle = '#ffffff';
  drawRoundedRect(ctx, x, y, size, size, 4);
  ctx.fill();
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  drawRoundedRect(ctx, x, y, size, size, 4);
  ctx.stroke();

  const moduleCount = 15;
  const cellSize = (size - 6) / moduleCount;
  const startX = x + 3;
  const startY = y + 3;

  ctx.fillStyle = '#0f172a';

  // Seeded pseudo-random generator for consistent aesthetic
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = (seed * 31 + seedStr.charCodeAt(i)) % 10007;
  }

  // Draw modules
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      // 3 Corner finder patterns (Top-left, Top-right, Bottom-left)
      const isTopLeft = r < 5 && c < 5;
      const isTopRight = r < 5 && c >= moduleCount - 5;
      const isBottomLeft = r >= moduleCount - 5 && c < 5;

      if (isTopLeft || isTopRight || isBottomLeft) {
        // Draw nested square finder pattern
        const localR = isBottomLeft ? r - (moduleCount - 5) : r;
        const localC = isTopRight ? c - (moduleCount - 5) : c;
        const isOuterBorder = localR === 0 || localR === 4 || localC === 0 || localC === 4;
        const isCenter = localR === 2 && localC === 2;

        if (isOuterBorder || isCenter) {
          ctx.fillRect(startX + c * cellSize, startY + r * cellSize, cellSize + 0.3, cellSize + 0.3);
        }
      } else {
        // Data bits
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        if (seed % 3 !== 0) {
          ctx.fillRect(startX + c * cellSize, startY + r * cellSize, cellSize + 0.3, cellSize + 0.3);
        }
      }
    }
  }

  ctx.restore();
}

/**
 * Returns a PNG Blob of the receipt image card
 */
export async function generateReceiptImageBlob(
  receipt: SaleRecord,
  storeProfile: StoreProfile,
  options: ReceiptImageOptions = {}
): Promise<Blob> {
  const canvas = generateReceiptCanvas(receipt, storeProfile, options);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas blob generation failed'));
    }, 'image/png');
  });
}

/**
 * Returns a Data URL (base64 PNG) of the receipt image card
 */
export function generateReceiptImageDataUrl(
  receipt: SaleRecord,
  storeProfile: StoreProfile,
  options: ReceiptImageOptions = {}
): string {
  const canvas = generateReceiptCanvas(receipt, storeProfile, options);
  return canvas.toDataURL('image/png');
}

/**
 * Triggers a direct browser download of the receipt image PNG
 */
export async function downloadReceiptImage(
  receipt: SaleRecord,
  storeProfile: StoreProfile,
  options: ReceiptImageOptions = {}
): Promise<void> {
  const blob = await generateReceiptImageBlob(receipt, storeProfile, options);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Receipt-${receipt.invoiceNo}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Copies the receipt image PNG to the system clipboard
 */
export async function copyReceiptImageToClipboard(
  receipt: SaleRecord,
  storeProfile: StoreProfile,
  options: ReceiptImageOptions = {}
): Promise<boolean> {
  try {
    const blob = await generateReceiptImageBlob(receipt, storeProfile, options);
    if (typeof ClipboardItem !== 'undefined' && navigator.clipboard && navigator.clipboard.write) {
      const item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);
      return true;
    }
    return false;
  } catch (err) {
    console.warn('Clipboard write image failed:', err);
    return false;
  }
}

/**
 * Formats a clean customer WhatsApp message text
 */
export function formatWhatsAppMessageText(
  receipt: SaleRecord,
  storeProfile: StoreProfile,
  customNote?: string
): string {
  const formattedDate = new Date(receipt.timestamp).toLocaleDateString([], {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const formattedTime = new Date(receipt.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const currency = storeProfile.currency || 'Rs.';

  return `Assalam-o-Alaikum / Hello ${receipt.customerName || 'Valued Customer'}! 👋

Here is your official digital sale invoice from *${storeProfile.name}*:

🧾 *Invoice #:* ${receipt.invoiceNo}
📅 *Date & Time:* ${formattedDate} (${formattedTime})
💰 *Total Amount:* ${currency} ${receipt.grandTotal.toLocaleString()}
💳 *Payment:* ${receipt.paymentMethod === 'udhar' ? 'Khata / Credit' : 'PAID (Clear)'}

${customNote ? `📝 *Note:* ${customNote}\n\n` : ''}📌 *Shop Address:* ${storeProfile.address}
📞 *Contact/WhatsApp:* ${storeProfile.phone}

_Attached above is your official digital receipt card image for your records. Thank you for your business!_`;
}

/**
 * Sends or prepares receipt image on WhatsApp:
 * 1. Checks if Web Share API with image file is supported (mobile devices, Android/iOS WhatsApp)
 * 2. Copies the image to clipboard for instantaneous Paste (Ctrl+V) into WhatsApp Web / Desktop
 * 3. Opens wa.me URL
 */
export async function sendReceiptImageOnWhatsApp(
  receipt: SaleRecord,
  storeProfile: StoreProfile,
  customerPhone?: string,
  options: ReceiptImageOptions = {}
): Promise<{ method: 'share_api' | 'clipboard_and_url'; success: boolean }> {
  const blob = await generateReceiptImageBlob(receipt, storeProfile, options);
  const filename = `Receipt-${receipt.invoiceNo}.png`;
  const file = new File([blob], filename, { type: 'image/png' });

  // Clean phone number (strip spaces, dashes, parentheses)
  let cleanPhone = (customerPhone || receipt.customerPhone || '').replace(/[^0-9]/g, '');
  // If local Pakistani 03xx number (e.g. 03001234567), format to international 923001234567
  if (cleanPhone.startsWith('03') && cleanPhone.length === 11) {
    cleanPhone = '92' + cleanPhone.slice(1);
  }

  const messageText = formatWhatsAppMessageText(receipt, storeProfile, options.customNote);

  // 1. Try native Web Share API with file attachment (works on Android Chrome, iOS Safari, etc.)
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: `Receipt ${receipt.invoiceNo} - ${storeProfile.name}`,
        text: messageText,
        files: [file],
      });
      return { method: 'share_api', success: true };
    } catch (shareErr: any) {
      if (shareErr.name === 'AbortError') {
        // User closed share sheet
        return { method: 'share_api', success: false };
      }
      console.log('Native share failed, falling back to clipboard + wa.me', shareErr);
    }
  }

  // 2. Desktop / Fallback flow:
  // Auto-copy image to clipboard so user can simply paste (Ctrl+V) in WhatsApp!
  await copyReceiptImageToClipboard(receipt, storeProfile, options);

  // Open WhatsApp Web / chat
  const encodedText = encodeURIComponent(messageText);
  const waUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`;

  window.open(waUrl, '_blank');

  return { method: 'clipboard_and_url', success: true };
}
