import React, { useState } from 'react';
import { usePos } from '../../context/PosContext';
import { Product, BusinessVertical } from '../../types';
import { VERTICALS_CONFIG } from '../../data/defaultData';
import {
  Package,
  Plus,
  Search,
  Filter,
  Barcode,
  Edit2,
  Trash2,
  Printer,
  X,
  AlertCircle,
  Tag,
  Check,
  Layers,
  Image as ImageIcon,
  Palette,
  Sparkles,
  Languages,
  Camera,
  Upload,
} from 'lucide-react';
import { autoTranslateToUrdu } from '../../utils/urduTranslate';
import { CameraCaptureModal } from '../common/CameraCaptureModal';

interface InventoryManagerProps {
  onOpenAiIngest: () => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({ onOpenAiIngest }) => {
  const {
    products,
    filteredProducts,
    activeVertical,
    addProduct,
    updateProduct,
    deleteProduct,
    storeProfile,
  } = usePos();

  const [search, setSearch] = useState('');
  const [selectedStockFilter, setSelectedStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [editProductModal, setEditProductModal] = useState<Product | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [barcodeLabelModal, setBarcodeLabelModal] = useState<Product | null>(null);
  const [autoUrduEnabled, setAutoUrduEnabled] = useState(true);

  const verticalConfig = VERTICALS_CONFIG[activeVertical];

  // Filtering
  const displayedProducts = filteredProducts.filter((p) => {
    const query = search.toLowerCase().trim();
    const matchesSearch =
      !query ||
      p.name.toLowerCase().includes(query) ||
      p.barcode.includes(query) ||
      p.category.toLowerCase().includes(query) ||
      (p.color && p.color.toLowerCase().includes(query)) ||
      (p.size && p.size.toLowerCase().includes(query)) ||
      (p.subSize && p.subSize.toLowerCase().includes(query)) ||
      (p.urduName && p.urduName.includes(query));

    if (!matchesSearch) return false;

    if (selectedStockFilter === 'low') return p.stockQuantity <= p.minStockAlert && p.stockQuantity > 0;
    if (selectedStockFilter === 'out') return p.stockQuantity <= 0;
    return true;
  });

  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);

  // Modal Form State for Add / Edit
  const [formState, setFormState] = useState<{
    name: string;
    urduName: string;
    barcode: string;
    category: string;
    costPrice: number;
    retailPrice: number;
    stockQuantity: number;
    minStockAlert: number;
    unit: string;
    image: string;
    color: string;
    size: string;
    subSize: string;
    options: {
      colors?: string[];
      sizes?: string[];
      subSizes?: string[];
    };
    colorVariants: {
      color: string;
      hex?: string;
      stock: number;
      inStock?: boolean;
    }[];
    verticalAttributes: Record<string, any>;
  }>({
    name: '',
    urduName: '',
    barcode: '',
    category: 'General',
    costPrice: 0,
    retailPrice: 0,
    stockQuantity: 10,
    minStockAlert: 5,
    unit: verticalConfig.unitOptions[0] || 'pcs',
    image: '',
    color: '',
    size: '',
    subSize: '',
    options: {
      colors: [],
      sizes: [],
      subSizes: [],
    },
    colorVariants: [],
    verticalAttributes: {},
  });

  const openNewModal = () => {
    const isGarmentOrFabric = activeVertical === 'clothing_apparel';
    const defaultColorVariants = isGarmentOrFabric
      ? [
          { color: 'Navy Blue', hex: '#1e3a8a', stock: 10, inStock: true },
          { color: 'Jet Black', hex: '#09090b', stock: 8, inStock: true },
          { color: 'Off White', hex: '#f8fafc', stock: 6, inStock: true },
          { color: 'Slate Grey', hex: '#64748b', stock: 5, inStock: true },
          { color: 'Camel Brown', hex: '#b45309', stock: 4, inStock: true },
          { color: 'Olive Green', hex: '#3f6212', stock: 3, inStock: true },
          { color: 'Ruby Red', hex: '#dc2626', stock: 2, inStock: true },
          { color: 'Royal Blue', hex: '#2563eb', stock: 0, inStock: false }, // Out of stock design highlight
        ]
      : [
          { color: 'Red', hex: '#ef4444', stock: 15, inStock: true },
          { color: 'Black', hex: '#0f172a', stock: 12, inStock: true },
          { color: 'Blue', hex: '#2563eb', stock: 8, inStock: true },
          { color: 'Yellow', hex: '#eab308', stock: 5, inStock: true },
          { color: 'Green', hex: '#16a34a', stock: 4, inStock: true },
          { color: 'White', hex: '#f8fafc', stock: 0, inStock: false }, // Out of stock
          { color: 'Grey', hex: '#94a3b8', stock: 0, inStock: false }, // Out of stock
        ];

    setFormState({
      name: '',
      urduName: '',
      barcode: `${Math.floor(896000000000 + Math.random() * 9000000000)}`,
      category: isGarmentOrFabric ? 'Fabrics & Suits' : 'General',
      costPrice: 0,
      retailPrice: 0,
      stockQuantity: 10,
      minStockAlert: 5,
      unit: isGarmentOrFabric ? 'suit' : (verticalConfig.unitOptions[0] || 'pcs'),
      image: isGarmentOrFabric
        ? 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&q=80&w=400'
        : 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=300',
      color: isGarmentOrFabric ? 'Navy Blue' : 'Red',
      size: isGarmentOrFabric ? 'L' : '3/29',
      subSize: isGarmentOrFabric ? '4.5m Unstitched' : 'Single Core',
      options: {
        colors: defaultColorVariants.map((c) => c.color),
        sizes: isGarmentOrFabric ? ['S', 'M', 'L', 'XL', 'XXL', '4.5m (Suit)'] : ['3/29', '7/29', '7/36'],
        subSizes: isGarmentOrFabric ? ['Unstitched Fabric', 'Stitched Suit', 'Single Piece'] : ['Single Core', 'Double Core'],
      },
      colorVariants: defaultColorVariants,
      verticalAttributes: {},
    });
    setIsNewModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditProductModal(product);
    setFormState({
      name: product.name ?? '',
      urduName: product.urduName ?? '',
      barcode: product.barcode ?? '',
      category: product.category ?? 'General',
      costPrice: product.costPrice ?? 0,
      retailPrice: product.retailPrice ?? 0,
      stockQuantity: product.stockQuantity ?? 0,
      minStockAlert: product.minStockAlert ?? 5,
      unit: product.unit ?? (verticalConfig.unitOptions[0] || 'pcs'),
      image: product.image ?? '',
      color: product.color ?? '',
      size: product.size ?? '',
      subSize: product.subSize ?? '',
      options: product.options ?? { colors: [], sizes: [], subSizes: [] },
      colorVariants: product.colorVariants ? [...product.colorVariants] : [],
      verticalAttributes: { ...(product.verticalAttributes || {}) },
    });
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name.trim()) return;

    if (editProductModal) {
      updateProduct(editProductModal.id, {
        name: formState.name,
        urduName: formState.urduName,
        barcode: formState.barcode,
        category: formState.category,
        costPrice: Number(formState.costPrice),
        retailPrice: Number(formState.retailPrice),
        stockQuantity: Number(formState.stockQuantity),
        minStockAlert: Number(formState.minStockAlert),
        unit: formState.unit,
        image: formState.image,
        color: formState.color,
        size: formState.size,
        subSize: formState.subSize,
        options: formState.options,
        colorVariants: formState.colorVariants,
        verticalAttributes: formState.verticalAttributes,
      });
      setEditProductModal(null);
    } else {
      addProduct({
        name: formState.name,
        urduName: formState.urduName,
        barcode: formState.barcode,
        category: formState.category,
        vertical: activeVertical,
        costPrice: Number(formState.costPrice),
        retailPrice: Number(formState.retailPrice),
        stockQuantity: Number(formState.stockQuantity),
        minStockAlert: Number(formState.minStockAlert),
        unit: formState.unit,
        taxPercent: 0,
        image: formState.image,
        color: formState.color,
        size: formState.size,
        subSize: formState.subSize,
        options: formState.options,
        colorVariants: formState.colorVariants,
        verticalAttributes: formState.verticalAttributes,
      });
      setIsNewModalOpen(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Inventory & Dynamic Schema Catalog
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-900 text-white font-semibold">
              {verticalConfig.name}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Schema automatically adapts custom fields (e.g. batch/expiry, specs/warranty, sizes/fabrics).
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenAiIngest}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 text-xs font-semibold flex items-center space-x-1.5"
          >
            <Barcode className="w-4 h-4 text-emerald-600" />
            <span>AI Bill Ingest</span>
          </button>
          <button
            onClick={openNewModal}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Item</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search catalog by name, barcode or Urdu..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-hidden"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-slate-400 font-semibold hidden sm:inline">Stock Status:</span>
          {(['all', 'low', 'out'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedStockFilter(filter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize border ${
                selectedStockFilter === filter
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {filter === 'all' ? 'All Items' : filter === 'low' ? 'Low Stock' : 'Out of Stock'}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table with Dynamic Schema Attributes */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5">Product & Barcode</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Dynamic Vertical Schema Attributes</th>
                <th className="p-3.5 text-right">Cost</th>
                <th className="p-3.5 text-right">Retail</th>
                <th className="p-3.5 text-center">In Stock</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <Package className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    No products matching your search criteria.
                  </td>
                </tr>
              ) : (
                displayedProducts.map((p) => {
                  const isLow = p.stockQuantity <= p.minStockAlert;
                  const isOut = p.stockQuantity <= 0;
                  const marginPct = Math.round(
                    ((p.retailPrice - p.costPrice) / (p.costPrice || 1)) * 100
                  );

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center space-x-3">
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0 shadow-2xs"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                              <Package className="w-5 h-5 text-slate-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate max-w-xs">{p.name}</div>
                            {/* Visual Badges: Color Swatch, Size, Sub-size */}
                            <div className="flex items-center flex-wrap gap-1 mt-1">
                              {p.color && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                  <span
                                    className="w-2 h-2 rounded-full border border-black/20"
                                    style={{
                                      backgroundColor:
                                        p.color.toLowerCase() === 'white'
                                          ? '#ffffff'
                                          : p.color.toLowerCase() === 'red'
                                          ? '#ef4444'
                                          : p.color.toLowerCase() === 'black'
                                          ? '#18181b'
                                          : p.color.toLowerCase() === 'blue'
                                          ? '#3b82f6'
                                          : p.color.toLowerCase() === 'yellow'
                                          ? '#eab308'
                                          : p.color.toLowerCase() === 'green'
                                          ? '#22c55e'
                                          : p.color.toLowerCase() === 'copper'
                                          ? '#b45309'
                                          : '#94a3b8',
                                    }}
                                  />
                                  <span>{p.color}</span>
                                </span>
                              )}
                              {p.size && (
                                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                  Size: {p.size}
                                </span>
                              )}
                              {p.subSize && (
                                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-100">
                                  Sub: {p.subSize}
                                </span>
                              )}
                            </div>

                            {/* 1-Set Multi-Color Bundle Preview */}
                            {p.colorVariants && p.colorVariants.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1 mt-1">
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                                  1 Set ({p.colorVariants.length} Colors):
                                </span>
                                {p.colorVariants.map((cv, idx) => (
                                  <span
                                    key={idx}
                                    title={`${cv.color}: ${cv.inStock !== false ? `${cv.stock} in stock` : 'Out of Stock'}`}
                                    className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.2 rounded-md font-bold border transition-all ${
                                      cv.inStock === false
                                        ? 'bg-rose-50 text-rose-700 border-rose-300 line-through'
                                        : 'bg-slate-50 text-slate-700 border-slate-200'
                                    }`}
                                  >
                                    <span
                                      className="w-2 h-2 rounded-full border border-black/20 shrink-0"
                                      style={{ backgroundColor: cv.hex || '#64748b' }}
                                    />
                                    <span>{cv.color}</span>
                                    {cv.inStock === false && (
                                      <span className="text-[8px] bg-rose-600 text-white px-1 rounded no-underline">
                                        0
                                      </span>
                                    )}
                                  </span>
                                ))}
                              </div>
                            )}
                            {p.urduName && (
                              <div className="text-[11px] text-slate-500 font-medium mt-0.5" dir="rtl">
                                {p.urduName}
                              </div>
                            )}
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                              <Barcode className="w-3 h-3" />
                              <span>{p.barcode}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                          {p.category}
                        </span>
                      </td>

                      {/* Dynamic Schema Display */}
                      <td className="p-3.5 max-w-xs">
                        <div className="space-y-0.5">
                          {Object.entries(p.verticalAttributes || {}).map(([key, val]) => {
                            if (!val) return null;
                            const fieldDef = verticalConfig.customFields.find((f) => f.key === key);
                            const label = fieldDef?.label || key;
                            return (
                              <div key={key} className="text-[11px] text-slate-600">
                                <span className="text-slate-400 font-medium">{label}:</span>{' '}
                                <strong className="text-slate-800">{String(val)}</strong>
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      <td className="p-3.5 text-right font-mono-numbers text-slate-600">
                        {storeProfile.currency} {p.costPrice.toLocaleString()}
                      </td>

                      <td className="p-3.5 text-right font-mono-numbers">
                        <div className="font-bold text-emerald-700">
                          {storeProfile.currency} {p.retailPrice.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400">+{marginPct}% margin</div>
                      </td>

                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold font-mono-numbers ${
                            isOut
                              ? 'bg-rose-100 text-rose-700'
                              : isLow
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {p.stockQuantity} {p.unit}
                        </span>
                      </td>

                      <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => setBarcodeLabelModal(p)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                          title="Generate printable barcode sticker"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-slate-100"
                          title="Edit product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete "${p.name}"?`)) deleteProduct(p.id);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100"
                          title="Delete product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add / Edit Product with Dynamic Schema Fields */}
      {(isNewModalOpen || editProductModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  {verticalConfig.name} Dynamic Schema
                </span>
                <h3 className="text-lg font-bold">
                  {editProductModal ? 'Edit Product' : 'Add New Product'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsNewModalOpen(false);
                  setEditProductModal(null);
                }}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-900">
                      Product Title / Name (English / Roman) *
                    </label>
                    <span className="text-[10px] text-purple-700 font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
                      Auto-Urdu Active
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    value={formState.name ?? ''}
                    onChange={(e) => {
                      const newName = e.target.value;
                      setFormState((prev) => ({
                        ...prev,
                        name: newName,
                        urduName: autoUrduEnabled ? autoTranslateToUrdu(newName) : prev.urduName,
                      }));
                    }}
                    placeholder="e.g. Pakistan Cables 7/0.029 Coil Red"
                    className="w-full px-3 py-2 text-xs border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-semibold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Languages className="w-3.5 h-3.5 text-purple-600" />
                      <span>اردو نام (Urdu Name - Auto-Filled)</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const translated = autoTranslateToUrdu(formState.name);
                          setFormState((prev) => ({ ...prev, urduName: translated }));
                        }}
                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 hover:bg-purple-200 text-purple-700 border border-purple-300 flex items-center gap-1 transition-all cursor-pointer"
                        title="Click to automatically fill Urdu name based on product title"
                      >
                        <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                        <span>Auto-Fill Urdu</span>
                      </button>
                      <label className="flex items-center gap-1 text-[10px] text-slate-600 font-semibold cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={autoUrduEnabled}
                          onChange={(e) => setAutoUrduEnabled(e.target.checked)}
                          className="rounded text-purple-600 focus:ring-0 w-3 h-3"
                        />
                        <span>Auto-Sync</span>
                      </label>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={formState.urduName ?? ''}
                    onChange={(e) => setFormState({ ...formState, urduName: e.target.value })}
                    placeholder="e.g. پاکستان کیبلز 7/0.029 کوائل لال"
                    className="w-full px-3 py-2 text-xs font-bold border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                    dir="rtl"
                  />
                  <p className="text-[10px] text-slate-500 font-medium mt-1">
                    Automatically fills in Nastaliq Urdu as you type. Appears on printed bills and WhatsApp receipts.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Barcode / EAN-13
                  </label>
                  <input
                    type="text"
                    value={formState.barcode ?? ''}
                    onChange={(e) => setFormState({ ...formState, barcode: e.target.value })}
                    placeholder="e.g. 896011245890"
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 rounded-lg focus:outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">Category</label>
                  <input
                    type="text"
                    value={formState.category ?? ''}
                    onChange={(e) => setFormState({ ...formState, category: e.target.value })}
                    placeholder="e.g. Cables & Wires"
                    className="w-full px-3 py-2 text-xs border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 rounded-lg focus:outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">Unit</label>
                  <select
                    value={formState.unit ?? (verticalConfig.unitOptions[0] || 'pcs')}
                    onChange={(e) => setFormState({ ...formState, unit: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-hidden font-medium"
                  >
                    {verticalConfig.unitOptions.map((u) => (
                      <option key={u} value={u} className="bg-white text-slate-900">
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Cost Price ({storeProfile.currency})
                  </label>
                  <input
                    type="number"
                    value={formState.costPrice ?? 0}
                    onChange={(e) => setFormState({ ...formState, costPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs font-mono-numbers border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-hidden font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Retail Selling Price ({storeProfile.currency}) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formState.retailPrice ?? 0}
                    onChange={(e) => setFormState({ ...formState, retailPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs font-mono-numbers font-bold text-slate-900 border border-slate-300 bg-white rounded-lg focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Current Stock Quantity
                  </label>
                  <input
                    type="number"
                    value={formState.stockQuantity ?? 0}
                    onChange={(e) => setFormState({ ...formState, stockQuantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs font-mono-numbers border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-hidden font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Low Stock Alert Threshold
                  </label>
                  <input
                    type="number"
                    value={formState.minStockAlert ?? 0}
                    onChange={(e) => setFormState({ ...formState, minStockAlert: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs font-mono-numbers border border-slate-300 bg-white text-slate-900 rounded-lg focus:outline-hidden font-bold"
                  />
                </div>
              </div>

              {/* Product Visuals & Variant Specifications (Image, Color, Size, Sub-size, Multi-Options) */}
              <div className="pt-3 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                    Product Visuals & Variant Options
                  </h4>
                  <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded font-bold">
                    Image • Color • Size • Sub-size
                  </span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                  {/* Image URL, File Upload & Live Camera Capture */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                        Product Visual (Photo / Garment / Fabric)
                      </label>
                      <span className="text-[10px] text-purple-600 font-bold">
                        Upload or Live Camera
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <div className="w-14 h-14 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
                        {formState.image ? (
                          <img
                            src={formState.image}
                            alt="preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-slate-400" />
                        )}
                      </div>

                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          {/* File Upload Input */}
                          <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-800 text-[11px] font-bold inline-flex items-center gap-1.5 transition-colors shadow-2xs">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload Image</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  const base64 = ev.target?.result as string;
                                  if (base64) setFormState({ ...formState, image: base64 });
                                };
                                reader.readAsDataURL(file);
                              }}
                            />
                          </label>

                          {/* Live Camera Capture Button */}
                          <button
                            type="button"
                            onClick={() => setIsCameraModalOpen(true)}
                            className="px-3 py-1.5 rounded-lg bg-linear-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white text-[11px] font-bold inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5 text-white" />
                            <span>Capture Photo</span>
                          </button>

                          {formState.image && (
                            <button
                              type="button"
                              onClick={() => setFormState({ ...formState, image: '' })}
                              className="text-[10px] text-rose-500 hover:underline px-1 font-semibold"
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        <input
                          type="url"
                          value={formState.image ?? ''}
                          onChange={(e) => setFormState({ ...formState, image: e.target.value })}
                          placeholder="Or paste image web link..."
                          className="w-full px-2.5 py-1.5 text-xs bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-hidden placeholder:text-slate-400 font-medium"
                        />
                      </div>
                    </div>

                    {/* Quick sample presets */}
                    <div className="flex flex-wrap items-center gap-1 mt-2">
                      <span className="text-[10px] text-slate-700 font-bold">Presets:</span>
                      {[
                        { label: '👗 Fabric Suit (8 Colors)', url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&q=80&w=400' },
                        { label: '👕 Polo Garment (9 Colors)', url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=400' },
                        { label: '🔴 Cable Coil (Red)', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=300' },
                        { label: '⚫ Wire Reel (Black)', url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=300' },
                      ].map((sample) => (
                        <button
                          key={sample.label}
                          type="button"
                          onClick={() => setFormState({ ...formState, image: sample.url })}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-slate-300 text-slate-800 hover:border-purple-500 hover:text-purple-700 font-medium transition-colors shadow-2xs cursor-pointer"
                        >
                          {sample.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Garment Size Selection & Fabrics Length Chips */}
                  <div className="pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-900">
                        Garment Size / Fabric Cut Length
                      </label>
                      <span className="text-[10px] text-slate-600 font-semibold">
                        Standard Ready-made & Unstitched
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-1.5">
                      <input
                        type="text"
                        value={formState.size ?? ''}
                        onChange={(e) => setFormState({ ...formState, size: e.target.value })}
                        placeholder="e.g. M, L, XL, 4.5m, 3/29"
                        className="w-full px-2.5 py-1.5 text-xs bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-hidden font-bold placeholder:text-slate-400"
                      />
                    </div>

                    {/* Garment Size Grid */}
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] text-slate-500 font-bold shrink-0">Garment Sizes:</span>
                        {['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size'].map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setFormState({ ...formState, size: sz })}
                            className={`text-[10px] px-2 py-0.5 rounded-md border font-bold transition-all cursor-pointer ${
                              formState.size === sz
                                ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-purple-400'
                            }`}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] text-slate-500 font-bold shrink-0">Fabric / Cut Length:</span>
                        {['4.0 Meter', '4.5 Meter (Suit)', '7.0 Meter (Double)', 'Single Kurta (2.5m)', '3/29', '7/29'].map((fl) => (
                          <button
                            key={fl}
                            type="button"
                            onClick={() => setFormState({ ...formState, size: fl })}
                            className={`text-[10px] px-2 py-0.5 rounded-md border font-medium transition-all cursor-pointer ${
                              formState.size === fl
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-400'
                            }`}
                          >
                            {fl}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Fabrics & Clothes 1-Set Color Options (7, 8, 9 Colors) & Out-of-Stock Highlights */}
                  <div className="pt-2 border-t border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                        <Palette className="w-3.5 h-3.5 text-purple-600" />
                        <span>Fabric & Garment 1-Set Multi-Color Bundle</span>
                      </label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            const sevenSet = [
                              { color: 'Navy Blue', hex: '#1e3a8a', stock: 10, inStock: true },
                              { color: 'Jet Black', hex: '#09090b', stock: 8, inStock: true },
                              { color: 'Off White', hex: '#f8fafc', stock: 6, inStock: true },
                              { color: 'Slate Grey', hex: '#64748b', stock: 5, inStock: true },
                              { color: 'Camel Brown', hex: '#b45309', stock: 4, inStock: true },
                              { color: 'Olive Green', hex: '#3f6212', stock: 3, inStock: true },
                              { color: 'Maroon', hex: '#881337', stock: 0, inStock: false }, // Out of stock design highlight
                            ];
                            setFormState({
                              ...formState,
                              colorVariants: sevenSet,
                              options: { ...formState.options, colors: sevenSet.map((s) => s.color) },
                            });
                          }}
                          className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors cursor-pointer"
                        >
                          7 Colors
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const eightSet = [
                              { color: 'Navy Blue', hex: '#1e3a8a', stock: 8, inStock: true },
                              { color: 'Jet Black', hex: '#09090b', stock: 6, inStock: true },
                              { color: 'Crisp White', hex: '#f8fafc', stock: 5, inStock: true },
                              { color: 'Slate Grey', hex: '#64748b', stock: 4, inStock: true },
                              { color: 'Camel Brown', hex: '#b45309', stock: 3, inStock: true },
                              { color: 'Olive Green', hex: '#3f6212', stock: 3, inStock: true },
                              { color: 'Ruby Red', hex: '#dc2626', stock: 0, inStock: false }, // Out of stock
                              { color: 'Charcoal', hex: '#334155', stock: 0, inStock: false }, // Out of stock
                            ];
                            setFormState({
                              ...formState,
                              colorVariants: eightSet,
                              options: { ...formState.options, colors: eightSet.map((s) => s.color) },
                            });
                          }}
                          className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors cursor-pointer"
                        >
                          8 Colors
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const nineSet = [
                              { color: 'Navy Blue', hex: '#1e3a8a', stock: 12, inStock: true },
                              { color: 'Jet Black', hex: '#09090b', stock: 10, inStock: true },
                              { color: 'Crisp White', hex: '#f8fafc', stock: 8, inStock: true },
                              { color: 'Royal Blue', hex: '#2563eb', stock: 6, inStock: true },
                              { color: 'Emerald Green', hex: '#16a34a', stock: 4, inStock: true },
                              { color: 'Ruby Red', hex: '#dc2626', stock: 3, inStock: true },
                              { color: 'Heather Grey', hex: '#94a3b8', stock: 0, inStock: false }, // Out of stock
                              { color: 'Mustard Yellow', hex: '#ca8a04', stock: 0, inStock: false }, // Out of stock
                              { color: 'Burgundy', hex: '#701a75', stock: 0, inStock: false }, // Out of stock
                            ];
                            setFormState({
                              ...formState,
                              colorVariants: nineSet,
                              options: { ...formState.options, colors: nineSet.map((s) => s.color) },
                            });
                          }}
                          className="px-2 py-0.5 rounded text-[10px] font-bold bg-fuchsia-100 text-fuchsia-700 hover:bg-fuchsia-200 transition-colors cursor-pointer"
                        >
                          9 Colors Set
                        </button>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-500">
                      1 Set bundle colors with stock and out-of-stock highlights. Click status badge to toggle Out of Stock.
                    </p>

                    {/* Color Swatch & Stock Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[220px] overflow-y-auto p-1 bg-white rounded-xl border border-slate-200">
                      {(formState.colorVariants || []).map((variant, idx) => (
                        <div
                          key={variant.color + idx}
                          className={`p-2 rounded-lg border flex flex-col justify-between text-xs transition-all ${
                            !variant.inStock
                              ? 'bg-rose-50 border-rose-300'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0 shadow-2xs"
                                style={{ backgroundColor: variant.hex || '#64748b' }}
                              />
                              <span className="font-bold text-[11px] truncate text-slate-900">
                                {variant.color}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...(formState.colorVariants || [])];
                                const currentInStock = updated[idx].inStock !== false;
                                updated[idx] = {
                                  ...updated[idx],
                                  inStock: !currentInStock,
                                  stock: !currentInStock ? (updated[idx].stock > 0 ? updated[idx].stock : 5) : 0,
                                };
                                setFormState({ ...formState, colorVariants: updated });
                              }}
                              className={`text-[9px] px-1.5 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                                variant.inStock !== false
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : 'bg-rose-600 text-white shadow-2xs hover:bg-rose-700'
                              }`}
                              title="Click to toggle Out of Stock status"
                            >
                              {variant.inStock !== false ? 'In Stock' : 'Out of Stock'}
                            </button>
                          </div>

                          <div className="flex items-center justify-between gap-1 mt-1 text-[10px]">
                            <span className="text-slate-600 font-semibold">Stock:</span>
                            <input
                              type="number"
                              min="0"
                              value={variant.stock ?? 0}
                              onChange={(e) => {
                                const newStock = Number(e.target.value);
                                const updated = [...(formState.colorVariants || [])];
                                updated[idx] = {
                                  ...updated[idx],
                                  stock: newStock,
                                  inStock: newStock > 0,
                                };
                                setFormState({ ...formState, colorVariants: updated });
                              }}
                              className="w-14 px-1 py-0.5 text-center font-mono-numbers font-bold bg-white text-slate-900 border border-slate-300 rounded text-[10px]"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Multi-Options Summary Chips */}
                  <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-600 uppercase">Available Options:</span>
                    <span className="text-[10px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded-md font-medium">
                      Colors: {formState.options?.colors?.length ? formState.options.colors.join(', ') : 'Red, Black, Blue'}
                    </span>
                    <span className="text-[10px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded-md font-medium">
                      Sizes: {formState.options?.sizes?.length ? formState.options.sizes.join(', ') : '3/29, 7/29, 7/36'}
                    </span>
                    <span className="text-[10px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded-md font-medium">
                      Sub-sizes: {formState.options?.subSizes?.length ? formState.options.subSizes.join(', ') : 'Single Core, Double Core, 90m'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dynamic Schema Fields Section */}
              <div className="pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    {verticalConfig.name} Specific Fields
                  </h4>
                  <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-semibold">
                    Dynamic Schema
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {verticalConfig.customFields.map((field) => (
                    <div key={field.key} className={field.type === 'text' && field.key === 'brand' ? 'sm:col-span-2' : ''}>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        {field.label}
                      </label>
                      {field.type === 'select' ? (
                        <select
                          value={formState.verticalAttributes[field.key] || ''}
                          onChange={(e) =>
                            setFormState({
                              ...formState,
                              verticalAttributes: {
                                ...formState.verticalAttributes,
                                [field.key]: e.target.value,
                              },
                            })
                          }
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden"
                        >
                          <option value="">Select...</option>
                          {field.options?.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : field.type === 'boolean' ? (
                        <label className="flex items-center space-x-2 mt-1">
                          <input
                            type="checkbox"
                            checked={!!formState.verticalAttributes[field.key]}
                            onChange={(e) =>
                              setFormState({
                                ...formState,
                                verticalAttributes: {
                                  ...formState.verticalAttributes,
                                  [field.key]: e.target.checked,
                                },
                              })
                            }
                            className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                          />
                          <span className="text-xs text-slate-700">Yes / Enabled</span>
                        </label>
                      ) : (
                        <input
                          type={field.type}
                          value={formState.verticalAttributes[field.key] || ''}
                          onChange={(e) =>
                            setFormState({
                              ...formState,
                              verticalAttributes: {
                                ...formState.verticalAttributes,
                                [field.key]: e.target.value,
                              },
                            })
                          }
                          placeholder={field.placeholder}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewModalOpen(false);
                    setEditProductModal(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-700/20"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Sticker Label Print Modal */}
      {barcodeLabelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 p-6 text-center space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Printable Barcode Label</h3>

            <div className="p-4 bg-white border-2 border-dashed border-slate-400 rounded-xl space-y-2">
              <div className="text-[11px] font-bold text-slate-900 uppercase truncate">
                {storeProfile.name}
              </div>
              <div className="text-xs font-bold text-slate-900 truncate">
                {barcodeLabelModal.name}
              </div>
              {/* Barcode graphic */}
              <div className="flex justify-center items-end h-10 space-x-[2px] py-1">
                {[2, 1, 3, 4, 1, 2, 4, 1, 3, 2, 1, 4, 3, 1, 2, 4, 1, 3, 2, 4].map((h, i) => (
                  <div
                    key={i}
                    className="bg-black"
                    style={{
                      width: i % 2 === 0 ? '2px' : '1.5px',
                      height: `${h * 7 + 10}px`,
                    }}
                  />
                ))}
              </div>
              <div className="font-mono text-[11px] font-bold text-slate-900">
                {barcodeLabelModal.barcode}
              </div>
              <div className="text-base font-extrabold text-slate-900 font-mono-numbers">
                Price: {storeProfile.currency} {barcodeLabelModal.retailPrice.toLocaleString()}
              </div>
            </div>

            <div className="flex justify-center space-x-2">
              <button
                onClick={() => setBarcodeLabelModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center space-x-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Sticker</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Camera Snapshot Modal */}
      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        title="Capture Product / Garment Photo"
        onCapture={(base64) => {
          setFormState((prev) => ({ ...prev, image: base64 }));
        }}
      />
    </div>
  );
};
