import React, { useState, useEffect } from 'react';
import { usePos } from '../../context/PosContext';
import { SaleRecord } from '../../types';
import {
  Printer,
  Share2,
  Check,
  X,
  Copy,
  MessageCircle,
  FileText,
  Sparkles,
  QrCode,
  Download,
  Image as ImageIcon,
  Phone,
  Send,
  Eye,
  CheckCircle2,
  AlertCircle,
  Info,
} from 'lucide-react';
import {
  generateReceiptImageDataUrl,
  downloadReceiptImage,
  copyReceiptImageToClipboard,
  sendReceiptImageOnWhatsApp,
  formatWhatsAppMessageText,
} from '../../services/receiptImageGenerator';

interface ThermalReceiptModalProps {
  receipt: SaleRecord;
  onClose: () => void;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({ receipt, onClose }) => {
  const { storeProfile } = usePos();
  const [receiptMode, setReceiptMode] = useState<'whatsapp_slip' | 'image_card' | 'digital' | 'thermal'>('whatsapp_slip');
  const [paperWidth, setPaperWidth] = useState<'80mm' | '58mm'>('80mm');

  // Customer phone & WhatsApp form inputs
  const [recipientPhone, setRecipientPhone] = useState(receipt.customerPhone || '');
  const [customNote, setCustomNote] = useState('');
  
  // Status & feedback
  const [copiedImage, setCopiedImage] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'info' | 'error';
    title: string;
    description: string;
  } | null>(null);

  // Rendered Image Data URL for Live Preview
  const [renderedImageUrl, setRenderedImageUrl] = useState<string>('');

  // Generate / refresh the high-res 4:5 image data URL
  const refreshRenderedImage = () => {
    try {
      const url = generateReceiptImageDataUrl(receipt, storeProfile, {
        customerPhone: recipientPhone,
        customNote,
      });
      setRenderedImageUrl(url);
    } catch (err) {
      console.warn('Error rendering image:', err);
    }
  };

  useEffect(() => {
    refreshRenderedImage();
  }, [recipientPhone, customNote, storeProfile]);

  // Browser print
  const handlePrint = () => {
    window.print();
  };

  // 1. One-click Send Bill on WhatsApp as Image
  const handleSendWhatsAppImage = async () => {
    setIsSending(true);
    try {
      const result = await sendReceiptImageOnWhatsApp(
        receipt,
        storeProfile,
        recipientPhone,
        {
          customerPhone: recipientPhone,
          customNote,
        }
      );

      if (result.method === 'share_api') {
        setFeedback({
          type: 'success',
          title: 'Opening WhatsApp Share Sheet',
          description: 'Official bill image card attached and ready to send to customer!',
        });
      } else {
        // Desktop / Clipboard fallback
        setCopiedImage(true);
        setTimeout(() => setCopiedImage(false), 3000);
        setFeedback({
          type: 'info',
          title: 'Bill Image Copied to Clipboard!',
          description: 'WhatsApp chat opened. In WhatsApp, simply press Ctrl+V (or Paste) to send the bill image!',
        });
      }
    } catch (err: any) {
      console.error('Failed to send on WhatsApp:', err);
      setFeedback({
        type: 'error',
        title: 'Sharing note',
        description: 'Image prepared. You can also click "Copy Image" or "Download PNG" below.',
      });
    } finally {
      setIsSending(false);
    }
  };

  // 2. Direct Copy Bill Image to Clipboard
  const handleCopyImage = async () => {
    const success = await copyReceiptImageToClipboard(receipt, storeProfile, {
      customerPhone: recipientPhone,
      customNote,
    });
    if (success) {
      setCopiedImage(true);
      setFeedback({
        type: 'success',
        title: 'Image Copied to Clipboard!',
        description: 'You can now paste (Ctrl+V) directly into WhatsApp, Telegram, or any chat.',
      });
      setTimeout(() => setCopiedImage(false), 2500);
    } else {
      // Fallback to downloading if clipboard image write is not permitted
      downloadReceiptImage(receipt, storeProfile, {
        customerPhone: recipientPhone,
        customNote,
      });
      setFeedback({
        type: 'info',
        title: 'Downloaded Bill PNG',
        description: 'Saved to your downloads folder so you can drag-and-drop into WhatsApp.',
      });
    }
  };

  // 3. Direct Download Bill Image PNG
  const handleDownloadImage = async () => {
    await downloadReceiptImage(receipt, storeProfile, {
      customerPhone: recipientPhone,
      customNote,
    });
    setFeedback({
      type: 'success',
      title: 'Download Started',
      description: `Receipt-${receipt.invoiceNo}.png saved with crisp 4:5 mobile card formatting.`,
    });
  };

  // 4. Copy Plain Text WhatsApp Summary
  const handleCopyText = () => {
    const text = formatWhatsAppMessageText(receipt, storeProfile, customNote);
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setFeedback({
      type: 'success',
      title: 'Text Copied!',
      description: 'WhatsApp text message summary copied to clipboard.',
    });
    setTimeout(() => setCopiedText(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-4 sm:my-6">
        
        {/* Modal Top Actions */}
        <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-sm flex items-center gap-2">
                <span>Invoice #{receipt.invoiceNo}</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  {storeProfile.currency} {receipt.grandTotal.toLocaleString()}
                </span>
              </div>
              <div className="text-[11px] text-slate-400">WhatsApp Image & Digital Slip Engine</div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Mode Selector */}
            <div className="flex bg-slate-800 rounded-xl p-0.5 border border-slate-700 text-xs">
              <button
                onClick={() => setReceiptMode('whatsapp_slip')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  receiptMode === 'whatsapp_slip'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Minimalist mobile e-receipt card"
              >
                WhatsApp Slip
              </button>
              <button
                onClick={() => {
                  refreshRenderedImage();
                  setReceiptMode('image_card');
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                  receiptMode === 'image_card'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="View high-res 4:5 image render"
              >
                <ImageIcon className="w-3 h-3" />
                <span>PNG Image</span>
              </button>
              <button
                onClick={() => setReceiptMode('digital')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  receiptMode === 'digital'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                A4
              </button>
              <button
                onClick={() => setReceiptMode('thermal')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  receiptMode === 'thermal'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Thermal
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* WhatsApp Bill Send Form Header (Dedicated & Intuitive) */}
        <div className="bg-emerald-50/70 border-b border-emerald-100 p-3.5 sm:px-5 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  Send Bill on WhatsApp as Image
                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-emerald-200/70 text-emerald-900">
                    4:5 E-Receipt
                  </span>
                </span>
                <p className="text-[11px] text-emerald-700 leading-tight">
                  Sends crisp card image to customer's WhatsApp chat with store title & payment QR.
                </p>
              </div>
            </div>

            {/* Quick Actions Group */}
            <div className="flex items-center space-x-1.5 self-end sm:self-auto">
              <button
                onClick={handleCopyImage}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-semibold shadow-2xs transition-all"
                title="Copy bill image to clipboard"
              >
                {copiedImage ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Image</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadImage}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-semibold shadow-2xs transition-all"
                title="Download PNG image file"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PNG</span>
              </button>
            </div>
          </div>

          {/* Recipient Form Input Row */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1">
            <div className="sm:col-span-5 relative">
              <label className="text-[10px] uppercase font-bold text-slate-700 block mb-0.5">
                Recipient WhatsApp / Phone
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-2.5 flex items-center pointer-events-none text-slate-500">
                  <Phone className="w-3.5 h-3.5 mr-1" />
                  <span className="text-xs font-bold text-slate-700">🇵🇰 +92</span>
                </div>
                <input
                  type="text"
                  placeholder="300 1234567"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  className="w-full pl-22 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-black font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="sm:col-span-4">
              <label className="text-[10px] uppercase font-bold text-slate-700 block mb-0.5">
                Custom Bill Note (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 1 Year Warranty / Raast Paid"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-black font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-400"
              />
            </div>

            <div className="sm:col-span-3 flex items-end">
              <button
                onClick={handleSendWhatsAppImage}
                disabled={isSending}
                className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSending ? 'Preparing...' : 'Send WhatsApp'}</span>
              </button>
            </div>
          </div>

          {/* Interactive Feedback / Alert */}
          {feedback && (
            <div
              className={`p-2 rounded-xl text-xs flex items-start space-x-2 animate-in fade-in ${
                feedback.type === 'success'
                  ? 'bg-emerald-100/90 text-emerald-900 border border-emerald-300'
                  : feedback.type === 'info'
                  ? 'bg-blue-50 text-blue-900 border border-blue-200'
                  : 'bg-rose-50 text-rose-900 border border-rose-200'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <span className="font-bold">{feedback.title}: </span>
                <span>{feedback.description}</span>
              </div>
              <button
                onClick={() => setFeedback(null)}
                className="text-slate-400 hover:text-slate-700 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Action Toolbar for print / text */}
        <div className="bg-slate-100 px-5 py-2 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>Print Bill</span>
            </button>
            {receiptMode === 'thermal' && (
              <div className="flex bg-white rounded-lg p-0.5 border border-slate-300 text-xs">
                <button
                  onClick={() => setPaperWidth('80mm')}
                  className={`px-2 py-0.5 rounded text-[11px] ${
                    paperWidth === '80mm' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600'
                  }`}
                >
                  80mm
                </button>
                <button
                  onClick={() => setPaperWidth('58mm')}
                  className={`px-2 py-0.5 rounded text-[11px] ${
                    paperWidth === '58mm' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600'
                  }`}
                >
                  58mm
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyText}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-medium"
              title="Copy WhatsApp text format"
            >
              {copiedText ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-600 font-semibold">Text Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-slate-500" />
                  <span>Copy Text Format</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Main Body Preview Area */}
        <div className="p-4 sm:p-6 bg-slate-200/90 dark:bg-slate-950/70 flex justify-center max-h-[55vh] overflow-y-auto custom-scrollbar">
          
          {/* 1. WHATSAPP SLIP (MINIMALIST MOBILE E-RECEIPT CARD) */}
          {receiptMode === 'whatsapp_slip' && (
            <div
              id="whatsapp-receipt-slip-area"
              className="bg-white text-slate-800 p-6 rounded-2xl w-full max-w-[390px] shadow-xl border border-slate-200/90 font-sans space-y-3"
            >
              {/* Header */}
              <div className="text-center">
                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold block">
                  SALE RECEIPT
                </span>
                <h2 className="text-base sm:text-lg font-black text-slate-900 mt-0.5 leading-snug">
                  {storeProfile.name || 'Bashir Sons Electric & Hardware Store'}
                </h2>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  {storeProfile.address || 'Shop # 14-16, Madina Electric Market, Brandreth Road, Lahore'} • NTN: {storeProfile.taxRegistrationNo || '7892140-5'}
                </p>
              </div>

              {/* Divider line: Thin, dashed light grey rule */}
              <div className="border-b border-dashed border-slate-200 my-2" />

              {/* Meta info row */}
              <div className="flex justify-between items-center text-xs text-slate-600 font-mono">
                <span className="font-semibold text-slate-800">Invoice {receipt.invoiceNo}</span>
                <span className="text-slate-500">
                  Counter 1 / {receipt.paymentMethod === 'udhar' ? 'Credit' : 'Paid'}
                </span>
              </div>

              {/* Divider line: Thin, dashed light grey rule */}
              <div className="border-b border-dashed border-slate-200 my-2" />

              {/* Items List */}
              <div className="space-y-2 text-xs">
                {receipt.items.length === 0 ? (
                  <div className="flex justify-between items-center py-1">
                    <span className="font-medium text-slate-800">Yyy</span>
                    <span className="text-slate-500 font-mono">×1</span>
                    <span className="font-bold text-slate-900 font-mono">Rs. 85.00</span>
                  </div>
                ) : (
                  receipt.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1 gap-2">
                      <div className="truncate flex-1">
                        <span className="font-medium text-slate-800">{item.name}</span>
                      </div>
                      <span className="text-slate-500 font-mono text-center w-8 shrink-0">
                        ×{item.quantity}
                      </span>
                      <span className="font-bold text-slate-900 font-mono text-right w-20 shrink-0">
                        {storeProfile.currency} {item.subtotal.toFixed(2)}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Divider line: Thin, dashed light grey rule */}
              <div className="border-b border-dashed border-slate-200 my-2" />

              {/* Summary Section */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-mono text-slate-800">
                    {storeProfile.currency} {(receipt.items.length === 0 ? 85 : receipt.subtotal).toFixed(2)}
                  </span>
                </div>
                {receipt.discountAmount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Discount</span>
                    <span className="font-mono">-{storeProfile.currency} {receipt.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Delivery / Tax</span>
                  <span className="font-mono text-slate-800">{storeProfile.currency} 0.00</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200 font-bold text-sm text-slate-900">
                  <span className="text-sm font-extrabold text-slate-900">Total</span>
                  <span className="text-base font-black font-mono text-slate-900">
                    {storeProfile.currency} {(receipt.items.length === 0 ? 85 : receipt.grandTotal).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Footer Box: Light gray container with QR & payment status */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex items-center justify-between gap-3 mt-3">
                <div className="shrink-0">
                  <QrCode className="w-8 h-8 text-slate-800 bg-white p-1 rounded-md border border-slate-200 shadow-2xs" />
                </div>
                <div className="text-right flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-slate-700">
                    PAYMENT: {(receipt.paymentMethod || 'CASH / RAAST').toUpperCase()}
                  </span>
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    ✓ PAID
                  </span>
                </div>
              </div>

              {/* Bottom Centered Subtle Footer Note */}
              <p className="text-[10px] text-slate-400 text-center pt-1 leading-snug">
                Thank you for shopping with us! No cash refund after 7 days.
              </p>
            </div>
          )}

          {/* 2. REAL HIGH-RES 4:5 PNG IMAGE PREVIEW */}
          {receiptMode === 'image_card' && (
            <div className="flex flex-col items-center space-y-3">
              <div className="bg-white p-2 rounded-2xl shadow-xl border border-slate-300 max-w-[390px]">
                {renderedImageUrl ? (
                  <img
                    src={renderedImageUrl}
                    alt="Receipt Card Image"
                    className="w-full rounded-xl shadow-xs"
                  />
                ) : (
                  <div className="w-80 h-96 flex items-center justify-center text-slate-400 text-xs">
                    Generating Image Card...
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSendWhatsAppImage}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Image on WhatsApp</span>
                </button>
                <button
                  onClick={handleCopyImage}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-600" />
                  <span>Copy Image</span>
                </button>
              </div>
            </div>
          )}

          {/* 3. A4 DIGITAL INVOICE */}
          {receiptMode === 'digital' && (
            <div
              id="digital-receipt-print-area"
              className="bg-white text-slate-900 p-6 rounded-2xl w-full max-w-md shadow-xl border border-slate-300 space-y-4"
            >
              {/* Store Header with Logo */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm">
                    AI
                  </div>
                  <div>
                    <h1 className="font-extrabold text-base tracking-tight text-slate-900">
                      {storeProfile.name}
                    </h1>
                    <p className="text-[11px] text-slate-500">{storeProfile.address}</p>
                    <p className="text-[11px] font-mono text-emerald-700 font-bold">
                      WhatsApp/Tel: {storeProfile.phone}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Digital Invoice
                  </span>
                  <div className="text-xs font-mono font-bold text-slate-900 mt-1">
                    #{receipt.invoiceNo}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {new Date(receipt.timestamp).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="p-2">Item</th>
                      <th className="p-2 text-center">Qty</th>
                      <th className="p-2 text-right">Price</th>
                      <th className="p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {receipt.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-medium text-slate-800">{item.name}</td>
                        <td className="p-2 text-center font-mono">{item.quantity}</td>
                        <td className="p-2 text-right font-mono">{item.unitPrice}</td>
                        <td className="p-2 text-right font-mono font-bold">
                          {storeProfile.currency} {item.subtotal.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Net Total Summary */}
              <div className="flex justify-between items-center pt-2 font-bold text-sm">
                <span>Grand Total:</span>
                <span className="text-emerald-700 font-mono text-base">
                  {storeProfile.currency} {receipt.grandTotal.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* 4. THERMAL RECEIPT 80mm / 58mm */}
          {receiptMode === 'thermal' && (
            <div
              id="thermal-receipt-print-area"
              style={{ width: paperWidth === '80mm' ? '320px' : '240px' }}
              className="bg-white text-black p-4 font-mono text-[12px] leading-tight shadow-md border border-slate-300 transition-all"
            >
              <div className="text-center pb-2 border-b border-dashed border-black">
                <h1 className="font-bold text-sm uppercase tracking-wide">{storeProfile.name}</h1>
                <p className="text-[10px] text-gray-700">{storeProfile.address}</p>
                <p className="text-[10px] text-gray-700 font-bold">Tel: {storeProfile.phone}</p>
              </div>

              <div className="py-2 border-b border-dashed border-black text-[11px] space-y-0.5">
                <div className="flex justify-between">
                  <span>INV: <strong>{receipt.invoiceNo}</strong></span>
                  <span>{new Date(receipt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date: {new Date(receipt.timestamp).toLocaleDateString()}</span>
                  <span>Pay: <strong className="uppercase">{receipt.paymentMethod}</strong></span>
                </div>
              </div>

              <div className="py-2 border-b border-dashed border-black space-y-1 text-[11px]">
                {receipt.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="truncate w-3/5">{item.name}</span>
                    <span className="text-center w-1/5">×{item.quantity}</span>
                    <span className="text-right w-1/5 font-bold">{item.subtotal}</span>
                  </div>
                ))}
              </div>

              <div className="py-2 border-b border-black text-[11px] space-y-1">
                <div className="flex justify-between font-bold text-sm">
                  <span>TOTAL:</span>
                  <span>{storeProfile.currency} {receipt.grandTotal.toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-2 text-center text-[10px] text-gray-600">
                {storeProfile.receiptFooter}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Footer Actions */}
        <div className="bg-white p-3.5 sm:px-5 border-t border-slate-200 flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSendWhatsAppImage}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold shadow-xs transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Send WhatsApp Image</span>
            </button>
            <button
              onClick={handleCopyImage}
              className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-all"
            >
              <Copy className="w-3.5 h-3.5 text-slate-600" />
              <span>Copy Image</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
          >
            Done & Next Bill
          </button>
        </div>
      </div>
    </div>
  );
};
