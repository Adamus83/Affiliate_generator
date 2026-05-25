import { Flame, ArrowUpRight, MessageSquare, Heart, ThumbsUp, Send } from "lucide-react";
import { Product } from "../types";

interface ProductCardProps {
  key?: string;
  product: Product;
  onSelectProduct: (p: Product) => void;
  onGenerateAI: (p: Product) => void;
}

export function ProductCard({ product, onSelectProduct, onGenerateAI }: ProductCardProps) {
  // Format numbers to short strings (e.g. 1.2M, 50K)
  const formatNum = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(0) + "K";
    return num.toString();
  };

  // Get color configurations for viral score level
  const getViralScoreStyles = (score: number) => {
    if (score >= 80) return {
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
      textColor: "text-red-400",
      progressBg: "bg-gradient-to-r from-orange-500 to-red-500",
      text: "Extreme Surge 🔥"
    };
    if (score >= 50) return {
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/25",
      textColor: "text-orange-400",
      progressBg: "bg-gradient-to-r from-amber-400 to-orange-500",
      text: "High Velocity 🚀"
    };
    return {
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
      textColor: "text-emerald-400",
      progressBg: "bg-gradient-to-r from-teal-400 to-emerald-400",
      text: "Aesthetic Core 📈"
    };
  };

  const scoreMeta = getViralScoreStyles(product.viralScore);

  const getNicheLabel = (key: string) => {
    switch (key) {
      case "beauty": return "Beauty & Care";
      case "home": return "Home & Kitchen";
      case "tech": return "Smart Tech";
      case "fitness": return "Sport Goods";
      case "kitchen": return "Kitchen Gadget";
      default: return key;
    }
  };

  return (
    <div
      id={`product-card-${product.id}`}
      className="bg-white border-2 border-slate-200/80 hover:border-emerald-500 rounded-2xl transition-all duration-350 hover:shadow-xl hover:-translate-y-0.5 group relative overflow-hidden flex flex-col justify-between"
    >
      {/* Decorative hover light */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100/50 to-transparent pointer-events-none"></div>

      {/* Card Header */}
      <div className="p-6 flex-1">
        <div className="flex items-start justify-between gap-3 mb-3">
          {/* Niche Badge */}
          <span className="px-3 py-1 rounded-full text-[11px] font-black bg-slate-100 text-slate-800 uppercase tracking-widest border border-slate-200">
            {getNicheLabel(product.niche)}
          </span>

          {/* Surge Badge */}
          <span className={`text-xs font-black font-mono px-2.5 py-0.5 rounded-lg ${scoreMeta.bgColor} ${scoreMeta.textColor} border ${scoreMeta.borderColor}`}>
            {scoreMeta.text}
          </span>
        </div>

        {/* Product Title */}
        <h3 
          onClick={() => onSelectProduct(product)}
          className="text-slate-900 hover:text-emerald-700 transition-colors font-sans font-black text-lg mt-2.5 leading-snug cursor-pointer group-hover:underline decoration-emerald-500 decoration-2 underline-offset-4"
        >
          {product.name}
        </h3>

        {/* Target search trigger */}
        <p className="text-xs text-slate-600 font-mono mt-1.5 italic flex items-center gap-1">
          <span className="font-bold">🎥 Hook keyword:</span>
          <span className="text-slate-800 font-black">"{product.videoSearchKeyword}"</span>
        </p>

        {/* Brief description */}
        <p className="text-sm text-slate-600 font-bold line-clamp-2 mt-3.5 mb-4 leading-relaxed font-sans">
          {product.description}
        </p>

        {/* Engagement Numbers Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs font-sans mt-3 rounded-xl bg-slate-100/60 border border-slate-200 p-4">
          <div>
            <div className="text-slate-600 text-[11px] uppercase font-black tracking-wide">24h Viewers</div>
            <div className="text-slate-900 font-black text-sm mt-1 flex items-center justify-between">
              <span>{formatNum(product.views)}</span>
              <span className="text-xs font-mono font-black text-rose-600">+{product.growth24h}%</span>
            </div>
          </div>
          <div>
            <div className="text-slate-600 text-[11px] uppercase font-black tracking-wide">Est. Commission</div>
            <div className="text-emerald-700 text-sm font-black mt-1">{product.estCommission.split(" ")[0]}</div>
          </div>
        </div>

        {/* Interaction metrics icons */}
        <div className="flex items-center gap-4 mt-4.5 text-xs text-slate-705 font-mono border-t border-slate-150 pt-3.5 font-bold">
          <span className="flex items-center gap-1.5 text-slate-700" title="Estimated Likes">
            <ThumbsUp size={13} className="text-slate-500 stroke-[2.5]" />
            {formatNum(product.likes)}
          </span>
          <span className="flex items-center gap-1.5 text-slate-700" title="Estimated Shares">
            <Send size={13} className="text-slate-500 stroke-[2.5]" />
            {formatNum(product.shares)}
          </span>
          <span className="flex items-center gap-1.5 text-slate-700" title="Estimated Comments">
            <MessageSquare size={13} className="text-slate-500 stroke-[2.5]" />
            {formatNum(product.comments)}
          </span>
          <span className="ml-auto flex items-center text-slate-800 font-sans gap-0.5 bg-slate-100 py-1 px-2.5 rounded-lg border border-slate-200 text-[11px] font-black">
            Price: <strong className="text-slate-900 font-black">{product.priceRange.split(" ").pop()}</strong>
          </span>
        </div>
      </div>

      {/* Card Footer Gauge & Buttons */}
      <div className="border-t-2 border-slate-150 bg-slate-50 px-6 py-4.5 flex flex-col gap-3.5 rounded-b-2xl">
        {/* Progress gauge bar */}
        <div>
          <div className="flex justify-between items-center text-xs font-mono text-slate-600 mb-1.5 font-bold">
            <span>VIRAL TEMPERATURE METER</span>
            <span className={`font-black uppercase ${scoreMeta.textColor}`}>SCORE: {product.viralScore}/100</span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${scoreMeta.progressBg} transition-all duration-1000 ease-out`}
              style={{ width: `${product.viralScore}%` }}
            ></div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            id={`btn-view-${product.id}`}
            onClick={() => onSelectProduct(product)}
            className="flex-1 py-2 text-xs font-bold tracking-normal border-2 border-slate-250 bg-white hover:bg-slate-100 text-slate-800 rounded-xl transition-all cursor-pointer text-center"
          >
            Statistics Panel
          </button>
          <button
            id={`btn-ai-${product.id}`}
            onClick={() => onGenerateAI(product)}
            className="flex-1 py-2 text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 font-sans shadow shadow-emerald-600/10"
          >
            Create AI Copy
            <ArrowUpRight size={13} strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
}
