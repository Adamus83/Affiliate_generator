import { Sparkles, Home, Cpu, Dumbbell, Utensils, Grid } from "lucide-react";
import { Product } from "../types";

interface NicheFilterProps {
  selectedNiche: string;
  onSelectNiche: (niche: string) => void;
  products: Product[];
}

export function NicheFilter({ selectedNiche, onSelectNiche, products }: NicheFilterProps) {
  // Define metadata for tabs
  const niches = [
    { id: "all", label: "All Categories", icon: Grid, color: "border-slate-800 text-slate-300" },
    { id: "beauty", label: "Beauty & Skincare", icon: Sparkles, color: "border-pink-500/20 text-pink-400" },
    { id: "home", label: "Home & Lighting", icon: Home, color: "border-purple-500/20 text-purple-400" },
    { id: "tech", label: "Smart Office Tech", icon: Cpu, color: "border-cyan-500/20 text-cyan-400" },
    { id: "fitness", label: "Sport & Fitness", icon: Dumbbell, color: "border-emerald-500/20 text-emerald-400" },
    { id: "kitchen", label: "Kitchen Gadgets", icon: Utensils, color: "border-amber-500/20 text-amber-400" },
  ];

  const getCountForNiche = (nicheId: string) => {
    if (nicheId === "all") return products.length;
    return products.filter(p => p.niche === nicheId).length;
  };

  return (
    <div id="niche-selector" className="flex flex-wrap gap-2 mb-6">
      {niches.map((niche) => {
        const Icon = niche.icon;
        const isActive = selectedNiche === niche.id;
        const count = getCountForNiche(niche.id);

        return (
          <button
            key={niche.id}
            id={`tab-niche-${niche.id}`}
            onClick={() => onSelectNiche(niche.id)}
            className={`
              flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-[13px] font-bold border-2 transition-all duration-200 cursor-pointer
              ${isActive 
                ? "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-600 shadow-lg shadow-emerald-600/10" 
                : "bg-white hover:bg-slate-50 border-slate-200 text-slate-800 hover:text-slate-950"
              }
            `}
          >
            <Icon size={15} className={`stroke-[2.5] ${isActive ? "text-white" : "text-slate-500"}`} />
            <span>{niche.label}</span>
            <span 
              className={`
                ml-1.5 px-2 py-0.5 rounded-md text-xs font-mono font-black leading-none
                ${isActive 
                  ? "bg-white/20 text-white" 
                  : "bg-slate-100 text-slate-700 border border-slate-200"
                }
              `}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
