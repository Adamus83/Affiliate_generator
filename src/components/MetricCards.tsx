import { Eye, TrendingUp, Activity } from "lucide-react";
import { Product } from "../types";

interface MetricCardsProps {
  products: Product[];
  onTriggerScrape: () => void;
  isScraping: boolean;
}

export function MetricCards({ products, onTriggerScrape, isScraping }: MetricCardsProps) {
  // Aggregate data
  const totalProducts = products.length;
  
  const highViralSpikes = products.filter(p => p.viralScore >= 80).length;
  
  const totalViews = products.reduce((acc, p) => acc + p.views, 0);
  const formattedViews = (totalViews / 1000000).toFixed(1) + "M";

  // Average growth rate
  const avgGrowth = products.length > 0 
    ? Math.round(products.reduce((acc, p) => acc + p.growth24h, 0) / products.length)
    : 0;

  return (
    <div id="stats-panel" className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div id="stat-views" className="bg-white border-2 border-slate-200 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
        <div>
          <p className="text-[13px] text-slate-600 font-bold font-sans uppercase tracking-wider">Accumulated Views</p>
          <p className="text-3xl font-black font-sans text-slate-900 mt-1 tracking-tight">{formattedViews}</p>
          <span className="text-xs text-emerald-600 font-mono font-bold mt-1.5 block">⚡ Real-time engagement</span>
        </div>
        <div id="icon-views" className="p-3 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl">
          <Eye size={22} className="stroke-[2.5]" />
        </div>
      </div>

      <div id="stat-spikes" className="bg-white border-2 border-slate-200 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
        <div>
          <p className="text-[13px] text-slate-600 font-bold font-sans uppercase tracking-wider">Viral Spikes (Score ≥ 80)</p>
          <p className="text-3xl font-black font-sans text-orange-600 mt-1 tracking-tight">{highViralSpikes}</p>
          <span className="text-xs text-orange-600 font-mono font-bold mt-1.5 block">🔥 High surge campaigns</span>
        </div>
        <div id="icon-spikes" className="p-3 bg-orange-50 text-orange-600 border border-orange-100 rounded-xl">
          <TrendingUp size={22} className="stroke-[2.5]" />
        </div>
      </div>

      <div id="stat-growth" className="bg-white border-2 border-slate-200 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
        <div>
          <p className="text-[13px] text-slate-600 font-bold font-sans uppercase tracking-wider">Average 24h Surge</p>
          <p className="text-3xl font-black font-sans text-emerald-600 mt-1 tracking-tight">+{avgGrowth}%</p>
          <span className="text-xs text-emerald-600 font-mono font-bold mt-1.5 block">📈 Rapidly scaling up</span>
        </div>
        <div id="icon-growth" className="p-3 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl">
          <Activity size={22} className="stroke-[2.5]" />
        </div>
      </div>

      <div id="stat-scrape" className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-250/10 rounded-full blur-xl pointer-events-none transform translate-x-4 -translate-y-4"></div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-[13px] text-slate-800 font-black font-sans uppercase tracking-wider">Real-time AI Crawler</p>
            <p className="text-xs text-slate-600 font-medium font-mono mt-0.5">Google Search Grounding</p>
          </div>
          <span className={`h-2.5 w-2.5 rounded-full ${isScraping ? 'bg-orange-500 animate-pulse' : 'bg-emerald-500'} block`}></span>
        </div>
        <button
          id="btn-force-scrape"
          onClick={onTriggerScrape}
          disabled={isScraping}
          className="w-full text-xs font-bold py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-850 text-white transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
        >
          {isScraping ? (
            <>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Scraping Live Web...
            </>
          ) : (
            <>
              <TrendingUp size={15} className="stroke-[2.5]" />
              Scrape Live Trends
            </>
          )}
        </button>
      </div>
    </div>
  );
}
