import React, { useState } from "react";
import { X, Search, Calculator, ArrowRight, Award, Target, MessageSquareCode } from "lucide-react";
import { Product } from "../types";

interface ProductDetailsProps {
  product: Product;
  onClose: () => void;
  onGenerateAI: (p: Product) => void;
}

export function ProductDetails({ product, onClose, onGenerateAI }: ProductDetailsProps) {
  // Calculator Local State
  const [calcMode, setCalcMode] = useState<"auto" | "custom">("auto");
  const [targetViews, setTargetViews] = useState<number>(100000); // Default 100K views goal
  const [conversionRate, setConversionRate] = useState<number>(1.2); // Default 1.2% checkout conversion
  const [customPrice, setCustomPrice] = useState<number>(150000);
  const [customCommission, setCustomCommission] = useState<number>(7);
  
  // Extract numerical commission estimate Rupiah value
  const parseCommissionCost = (commStr: string): number => {
    // E.g. "20% (Rp 48.000/sale)"
    const match = commStr.match(/Rp\s*([\d.]+)/);
    if (match) {
      const cleanNum = match[1].replace(/\./g, "");
      return parseInt(cleanNum, 10);
    }
    // Fallback if legacy or different structure
    const dollarMatch = commStr.match(/\$(\d+\.\d+)/);
    if (dollarMatch) {
      return Math.round(parseFloat(dollarMatch[1]) * 15000);
    }
    return 45000; // fallback Rp 45.000
  };

  const selectedPriceRangeMax = (): number => {
    const cleanStr = product.priceRange.replace(/\./g, "").replace(/\s/g, "");
    const match = cleanStr.match(/Rp\s*([\d.]+)/g);
    if (match && match.length > 0) {
      const lastPrice = match[match.length - 1].replace(/Rp\s*/g, "");
      return parseInt(lastPrice, 10) || 150000;
    }
    return 150000;
  };

  const autoCommPerUnit = parseCommissionCost(product.estCommission);
  const commissionPerUnit = calcMode === "auto" 
    ? autoCommPerUnit 
    : Math.round(customPrice * (customCommission / 100));
  
  // Calculations:
  const estimatedConversionSales = Math.round(targetViews * (conversionRate / 100));
  const estimatedNetProfit = estimatedConversionSales * commissionPerUnit;

  // Format helper using Indonesian locale grouping
  const commaSeparated = (num: number) => {
    return num.toLocaleString("id-ID");
  };

  return (
    <div id="product-details-drawer" className="bg-white border-2 border-slate-300 rounded-3xl p-6.5 shadow-xl relative backdrop-blur-md">
      {/* Target header actions */}
      <button 
        id="btn-close-details"
        onClick={onClose}
        className="absolute top-4 right-4 text-slate-500 hover:text-slate-900 transition-colors p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 cursor-pointer border border-slate-200"
        aria-label="Close panel"
      >
        <X size={16} className="stroke-[2.5]" />
      </button>

      <span className="text-xs font-black font-mono tracking-wider text-emerald-700 bg-emerald-100/60 px-3 py-1.5 rounded-lg border border-emerald-200 uppercase">
        In-Depth Diagnostic Panel
      </span>

      <h2 id="details-product-title" className="text-slate-900 text-2xl font-sans font-black mt-4.5 tracking-tight leading-snug">
        {product.name}
      </h2>

      <p className="text-sm text-slate-700 font-bold mt-2.5 leading-relaxed">
        {product.description}
      </p>

      {/* Grid: 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 border-t-2 border-slate-200 pt-6">
        
        {/* Left Column: Viral Insights & Analytics Details */}
        <div className="space-y-4">
          <h3 className="text-xs font-black font-mono tracking-wider uppercase text-slate-600">Viral Mechanics Details</h3>
          
          <div className="bg-slate-50 rounded-2xl border-2 border-slate-200 p-5 space-y-4">
            <div>
              <span className="text-[11px] font-black font-mono text-slate-500 block uppercase tracking-wider">Scraper Validation Method</span>
              <p className="text-sm text-slate-900 mt-1 font-black">{product.trendingReason}</p>
            </div>

            <div>
              <span className="text-[11px] font-black font-mono text-slate-500 block uppercase tracking-wider">Competitive Difficulty Index</span>
              <div className="flex items-center gap-3 mt-1.5">
                <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden border border-slate-300">
                  <div 
                    className={`h-full ${product.difficulty > 65 ? 'bg-amber-500' : 'bg-emerald-500'} rounded-full`}
                    style={{ width: `${product.difficulty}%` }}
                  ></div>
                </div>
                <span className="text-sm font-black font-mono text-slate-800">{product.difficulty}/100</span>
              </div>
              <span className="text-xs text-slate-600 font-medium block mt-1.5 leading-normal">
                Lower scores indicate open markets with fewer concurrent videos competing for the same hook keywords.
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white p-3 border border-slate-200 rounded-xl text-center shadow-xs">
                <span className="text-[10px] font-black font-mono text-slate-500 block">DEMAND</span>
                <span className="text-xs text-slate-900 font-black block mt-1">{product.marketDemand}</span>
              </div>
              <div className="bg-white p-3 border border-slate-200 rounded-xl text-center shadow-xs">
                <span className="text-[10px] font-black font-mono text-slate-500 block">BASE PRICE</span>
                <span className="text-xs text-slate-900 font-black block mt-1">{product.priceRange.split(" ").pop()}</span>
              </div>
              <div className="bg-white p-3 border border-slate-200 rounded-xl text-center shadow-xs">
                <span className="text-[10px] font-black font-mono text-slate-500 block font-bold">COMMISSION</span>
                <span className="text-xs text-emerald-700 font-black block mt-1">{product.estCommission.split(" ")[0]}</span>
              </div>
            </div>
          </div>

          {/* Video SEO Helper */}
          <div className="bg-cyan-50/50 rounded-2xl border-2 border-cyan-100 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Search size={15} className="text-cyan-700 stroke-[2.5]" />
              <h4 className="text-xs font-black text-cyan-900 font-mono uppercase tracking-wide">Affiliate Link SEO Anchor</h4>
            </div>
            <p className="text-xs text-slate-700 font-bold leading-normal">
              For best conversion rates, insert this exact text inside your video tags and comments to ground your viewer's search intent:
            </p>
            <div className="mt-3 text-sm font-mono bg-white text-cyan-800 px-3.5 py-2.5 rounded-xl border border-cyan-200 flex items-center justify-between select-all font-black shadow-sm">
              <span>{product.videoSearchKeyword}</span>
              <span className="text-[10px] bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded border border-cyan-200">Anchor Tag</span>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Earnings Estimator */}
        <div id="earnings-estimator" className="bg-slate-50 p-5 rounded-2xl border-2 border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calculator size={16} className="text-emerald-600 stroke-[2.5]" />
              <h3 className="text-xs font-black text-slate-700 font-mono uppercase tracking-wider">Earnings Estimator</h3>
            </div>
            <span className="bg-white text-xs font-black text-emerald-700 border border-slate-200 px-2.5 py-1 rounded-lg">
              Est. Rp {commissionPerUnit.toLocaleString("id-ID")}/sale
            </span>
          </div>

          {/* Calculator Mode Tabs */}
          <div className="grid grid-cols-2 gap-2 mb-4 p-1 bg-slate-200/60 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setCalcMode("auto");
                // Reset to active product pricing values
                setCustomPrice(selectedPriceRangeMax());
              }}
              className={`py-1.5 text-xs font-black font-sans rounded-lg transition-all ${
                calcMode === "auto" 
                  ? "bg-white text-slate-900 shadow-xs" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              🔄 Auto-Sync ID
            </button>
            <button
              type="button"
              onClick={() => {
                setCalcMode("custom");
                setCustomPrice(selectedPriceRangeMax());
                // Try to parse percentage
                const pctMatch = product.estCommission.match(/(\d+)%/);
                if (pctMatch) {
                  setCustomCommission(parseInt(pctMatch[1], 10));
                }
              }}
              className={`py-1.5 text-xs font-black font-sans rounded-lg transition-all ${
                calcMode === "custom" 
                  ? "bg-white text-emerald-700 shadow-xs" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              ⚙️ Kustom Manual
            </button>
          </div>

          {/* Custom Input Fields if Mode is Custom */}
          {calcMode === "custom" ? (
            <div className="grid grid-cols-2 gap-3 mb-4 bg-white p-3 border border-slate-200 rounded-xl shadow-xs">
              <div>
                <label className="text-[10px] font-black font-mono text-slate-500 uppercase block mb-1">Harga Produk (Rp)</label>
                <input
                  type="number"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-black font-mono text-slate-900 focus:outline-emerald-600"
                />
              </div>
              <div>
                <label className="text-[10px] font-black font-mono text-slate-500 uppercase block mb-1">Komisi (%)</label>
                <input
                  type="number"
                  value={customCommission}
                  onChange={(e) => setCustomCommission(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-black font-mono text-slate-900 focus:outline-emerald-600"
                />
              </div>
            </div>
          ) : (
            <div className="mb-4 text-xs font-semibold text-slate-600 bg-white/50 p-2.5 border border-slate-200/60 rounded-xl leading-relaxed">
              Mensinkronisasi data komisi bawaan produk nyata: <span className="font-black text-slate-800">{product.estCommission}</span> dengan harga rata-rata sekitar <span className="font-black text-slate-800">Rp {commaSeparated(selectedPriceRangeMax())}</span>.
            </div>
          )}

          {/* Views Goal Input */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between items-center text-xs font-mono font-bold text-slate-700">
              <span>Target Bulanan Views</span>
              <span className="text-slate-900 font-black text-sm">{commaSeparated(targetViews)} views</span>
            </div>
            <input 
              type="range"
              min={10000}
              max={500000}
              step={10000}
              value={targetViews}
              onChange={(e) => setTargetViews(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="flex justify-between text-[10px] font-mono font-semibold text-slate-500">
              <span>10K views</span>
              <span>250K views</span>
              <span>500K views</span>
            </div>
          </div>

          {/* Conversion Click Rate Goal Input */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between items-center text-xs font-mono font-bold text-slate-705">
              <span>Checkout Conversion Rate</span>
              <span className="text-emerald-700 font-black text-sm">{conversionRate.toFixed(1)}%</span>
            </div>
            <input 
              type="range"
              min={0.2}
              max={5.0}
              step={0.1}
              value={conversionRate}
              onChange={(e) => setConversionRate(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="flex justify-between text-[10px] font-mono font-semibold text-slate-500">
              <span>0.2% (Cold)</span>
              <span>2.5% (Steady)</span>
              <span>5.0% (Explosive viral)</span>
            </div>
          </div>

          {/* Calculator Output Display */}
          <div className="mt-5 bg-white border border-slate-200 rounded-2xl p-4.5 flex justify-between items-center relative overflow-hidden shadow-sm">
            <div>
              <p className="text-[11px] font-black font-mono text-slate-500 uppercase">Estimated Sales Generated</p>
              <p className="text-lg font-sans font-black text-slate-800 mt-0.5">{commaSeparated(estimatedConversionSales)} units</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-mono text-emerald-700 uppercase font-black">Projected Commission</p>
              <p className="text-2xl font-sans font-black text-emerald-600 mt-0.5">
                Rp {commaSeparated(Math.round(estimatedNetProfit))}
              </p>
            </div>
          </div>

          <p className="text-[10px] text-slate-500 font-bold italic mt-4.5 text-center leading-normal">
            Calculations are estimations. Actual conversion is heavily influenced by the quality of Hook and copywriting generated below.
          </p>
        </div>
      </div>

      {/* Draw Action Row */}
      <div className="flex items-center justify-end gap-3 mt-6.5 pt-5 border-t-2 border-slate-200">
        <button 
          id="btn-close-details-footer"
          onClick={onClose}
          className="px-4.5 py-2.5 text-xs font-black border-2 border-slate-250 bg-white hover:bg-slate-50 text-slate-700 rounded-xl transition-all cursor-pointer"
        >
          Close Diagnostics
        </button>
        <button
          id="btn-launch-ai-generator"
          onClick={() => onGenerateAI(product)}
          className="px-5.5 py-2.5 text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors cursor-pointer flex items-center gap-2 font-sans hover:shadow-lg shadow-sm"
        >
          <span>Instantiate Creator Engine</span>
          <ArrowRight size={14} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}
