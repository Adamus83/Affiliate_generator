export interface Product {
  id: string;
  name: string;
  niche: string;
  priceRange: string;
  views: number;
  likes: number;
  shares: number;
  comments: number;
  growth24h: number;
  difficulty: number;
  estCommission: string;
  description: string;
  trendingReason: string;
  videoSearchKeyword: string;
  marketDemand: "Extreme" | "High" | "Stable" | "Soaring";
  viralScore: number;
}

export interface SavedCampaign {
  id: string;
  productName: string;
  productId: string;
  niche: string;
  contentType: string;
  tone: string;
  targetAudience: string;
  generatedContent: string;
  affiliateUrl: string;
  savedAt: string;
  customNotes?: string;
}

export interface GenerationParams {
  productId: string;
  productName: string;
  niche: string;
  description: string;
  trendingReason: string;
  priceRange: string;
  contentType: string;
  tone: string;
  targetAudience: string;
  includeAffiliateDisclaimer: boolean;
  customKeywords: string;
}

export interface NicheTab {
  id: string;
  label: string;
  iconName: string;
  color: string;
}

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  credits: number;
}

export interface TopUpTransaction {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  packageName: string;
  amount: number;
  creditsGained: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}
