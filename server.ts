import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { Firestore } from "@google-cloud/firestore";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cors from "cors";
import { z } from "zod";
import firebaseConfig from "./firebase-applet-config.json";

dotenv.config();

interface UserProfile {
  id: string;
  name: string;
  phone: string;
  credits: number;
}

interface TopUpTransaction {
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

const memoryUsers = new Map<string, UserProfile>();
const memoryTxs = new Map<string, TopUpTransaction>();
const memoryTrends = new Map<string, any>();

const dbCustom = new Firestore({
  projectId: firebaseConfig.projectId,
  databaseId: firebaseConfig.firestoreDatabaseId,
  preferRest: true,
  ignoreUndefinedProperties: true,
});

const dbDefault = new Firestore({
  projectId: firebaseConfig.projectId,
  preferRest: true,
  ignoreUndefinedProperties: true,
});

let currentMode: "firestore_custom" | "firestore_default" | "memory" = "firestore_custom";

async function executeWithDb<T>(
  op: (fdb: Firestore) => Promise<T>,
  collectionName: string,
  docId: string | null,
  actionType: "get" | "set" | "update" | "list",
  data?: any,
  options?: any
): Promise<any> {
  if (currentMode === "firestore_custom") {
    try {
      return await op(dbCustom);
    } catch (err: any) {
      console.warn(
        `[DB ENGINE - WARNING] Custom Firestore database operation failed. Switching to (default) database. Detail:`,
        err.message || err
      );
      currentMode = "firestore_default";
    }
  }

  if (currentMode === "firestore_default") {
    try {
      return await op(dbDefault);
    } catch (err: any) {
      console.warn(
        `[DB ENGINE - WARNING] (default) Firestore database operation failed. Gracefully falling back to local memory engine. Detail:`,
        err.message || err
      );
      currentMode = "memory";
    }
  }

  // Under Memory Fallback:
  if (actionType === "get" && docId) {
    let memData;
    if (collectionName === "users") {
      memData = memoryUsers.get(docId);
    } else if (collectionName === "scraped_trends") {
      memData = memoryTrends.get(docId);
    } else {
      memData = memoryTxs.get(docId);
    }
    return {
      exists: !!memData,
      data: () => memData,
    };
  }

  if (actionType === "set" && docId) {
    if (collectionName === "users") {
      const existing = memoryUsers.get(docId) || {};
      const newVal = options?.merge ? { ...existing, ...data } : data;
      memoryUsers.set(docId, newVal);
    } else if (collectionName === "scraped_trends") {
      const existing = memoryTrends.get(docId) || {};
      const newVal = options?.merge ? { ...existing, ...data } : data;
      memoryTrends.set(docId, newVal);
    } else {
      const existing = memoryTxs.get(docId) || {};
      const newVal = options?.merge ? { ...existing, ...data } : data;
      memoryTxs.set(docId, newVal);
    }
    return;
  }

  if (actionType === "update" && docId) {
    if (collectionName === "users") {
      const existing = memoryUsers.get(docId) || { id: docId, name: "Member Afiliasi", phone: "-", credits: 5 };
      memoryUsers.set(docId, { ...existing, ...data });
    } else {
      const existing = memoryTxs.get(docId) || {
        id: docId,
        userId: "-",
        userName: "-",
        userPhone: "-",
        packageName: "-",
        amount: 0,
        creditsGained: 0,
        status: "PENDING",
        createdAt: new Date().toISOString(),
      };
      memoryTxs.set(docId, { ...existing, ...data } as any);
    }
    return;
  }

  if (actionType === "list") {
    const list = collectionName === "users" ? Array.from(memoryUsers.values()) : Array.from(memoryTxs.values());
    const docs = list.map((item) => ({
      data: () => item,
    }));
    return { docs };
  }
}

class CustomFirestoreWrapper {
  collection(collectionName: string) {
    return {
      doc: (docId: string) => {
        return {
          get: async () => {
            return await executeWithDb(
              async (fdb) => fdb.collection(collectionName).doc(docId).get(),
              collectionName,
              docId,
              "get"
            );
          },
          set: async (data: any, options?: any) => {
            return await executeWithDb(
              async (fdb) => fdb.collection(collectionName).doc(docId).set(data, options),
              collectionName,
              docId,
              "set",
              data,
              options
            );
          },
          update: async (data: any) => {
            return await executeWithDb(
              async (fdb) => fdb.collection(collectionName).doc(docId).update(data),
              collectionName,
              docId,
              "update",
              data
            );
          },
        };
      },
      get: async () => {
        return await executeWithDb(
          async (fdb) => fdb.collection(collectionName).get(),
          collectionName,
          null,
          "list"
        );
      },
    };
  }
}

const db = new CustomFirestoreWrapper() as any;

const app = express();

// Set trust proxy to true (or 1) so Express knows it is behind Cloud Run/reverse proxies
// and can safely extract client IPs from X-Forwarded-For headers
app.set("trust proxy", 1);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      origin.startsWith("http://localhost:") ||
      origin.startsWith("http://127.0.0.1:") ||
      origin.includes(".run.app") ||
      origin.includes("ai.studio")
    ) {
      return callback(null, true);
    }
    return callback(new Error("CORS request blocked from origin: " + origin));
  },
  credentials: true
}));

app.use(express.json());
app.use("/api/", rateLimit({ 
  windowMs: 60000, 
  max: 30,
  validate: false // Disables the check warnings to prevent ValidationError from crashing/complaining
}));
const PORT = 3000;

// --- ZOD SCHEMAS FOR API INPUT SAFETY ---
const UserProfileQuerySchema = z.object({
  userId: z.string().min(1, "User ID wajib diisi."),
  name: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
});

const ScrapeSchema = z.object({
  niche: z.string().optional()
});

const TopUpRequestSchema = z.object({
  userId: z.string().min(1, "User ID wajib diisi."),
  userName: z.string().optional().nullable(),
  userPhone: z.string().optional().nullable(),
  packageName: z.string().min(1, "Nama paket wajib diisi."),
  amount: z.coerce.number().min(5000, "Nominal minimal top-up adalah Rp 5.000.").max(10000000, "Nominal maksimal top-up adalah Rp 10.000.000."),
  creditsGained: z.coerce.number().int().positive("Jumlah kredit harus lebih dari 0.").max(1000, "Jumlah kredit sekali pengisian maksimal adalah 1000.")
});

const AdminApproveSchema = z.object({
  transactionId: z.string().min(1, "ID Transaksi wajib diisi."),
  password: z.string().min(1, "Password Admin wajib diisi.")
});

const AdminRejectSchema = z.object({
  transactionId: z.string().min(1, "ID Transaksi wajib diisi."),
  password: z.string().min(1, "Password Admin wajib diisi.")
});

const AdminSetCreditsSchema = z.object({
  userId: z.string().min(1, "User ID wajib diisi."),
  credits: z.coerce.number().int().nonnegative("Kredit harus bernilai positif atau nol.").max(2000, "Kredit maksimal adalah 2000."),
  password: z.string().min(1, "Password Admin wajib diisi.")
});

const GenerateContentSchema = z.object({
  userId: z.string().min(1, "User ID wajib diisi."),
  productName: z.string().min(1, "Nama produk wajib diisi."),
  niche: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  trendingReason: z.string().optional().nullable(),
  priceRange: z.string().optional().nullable(),
  contentType: z.string().optional().nullable(),
  tone: z.string().optional().nullable(),
  targetAudience: z.string().optional().nullable(),
  includeAffiliateDisclaimer: z.coerce.boolean().optional(),
  customKeywords: z.string().optional().nullable(),
  premiumVideoMode: z.coerce.boolean().optional(),
  premiumVoiceCharacter: z.string().optional().nullable(),
});

const GenerateTrendOracleSchema = z.object({
  userId: z.string().min(1, "User ID wajib diisi."),
  niche: z.string().min(1, "Niche wajib diisi."),
  budget: z.string().optional().nullable(),
  platform: z.string().optional().nullable()
});

const PersonaHubDialogueSchema = z.object({
  userId: z.string().min(1, "User ID wajib diisi."),
  personaId: z.string().min(1, "Persona ID wajib diisi."),
  message: z.string().min(1, "Pesan wajib diisi."),
  topic: z.string().optional().nullable(),
  history: z.array(z.any()).optional()
});

// Dynamic simulated scraper crawl state that can be "scraped/refreshed"
interface Product {
  id: string;
  name: string;
  niche: string;
  priceRange: string;
  views: number;
  likes: number;
  shares: number;
  comments: number;
  growth24h: number; // percentage (e.g. 145 = +145%)
  difficulty: number; // 1 - 100
  estCommission: string;
  description: string;
  trendingReason: string;
  videoSearchKeyword: string;
  marketDemand: "Extreme" | "High" | "Stable" | "Soaring";
  viralScore?: number;
}

const BASE_PRODUCTS: Record<string, Omit<Product, "viralScore">[]> = {
  beauty: [
    {
      id: "b1",
      name: "Water-Glow Lip Jelly Tint",
      niche: "beauty",
      priceRange: "Rp 180.000 - Rp 270.000",
      views: 2450000,
      likes: 380000,
      shares: 48000,
      comments: 8900,
      growth24h: 145,
      difficulty: 42,
      estCommission: "20% (Rp 48.000/sale)",
      description: "Non-sticky, high-shine moisturizing lip tint that leaves a long-lasting plump watermelon flush.",
      trendingReason: "ASMR swatches, clean-girl aesthetic vlogs, and satisfying shade transition clips.",
      videoSearchKeyword: "lip jelly stain ASMR review",
      marketDemand: "Extreme"
    },
    {
      id: "b2",
      name: "Volume-Boost Waterless Dry Mist",
      niche: "beauty",
      priceRange: "Rp 285.000 - Rp 375.000",
      views: 980000,
      likes: 120000,
      shares: 14500,
      comments: 3200,
      growth24h: 42,
      difficulty: 65,
      estCommission: "15% (Rp 51.000/sale)",
      description: "A volume-boosting micellar aerosol spray that absorbs oil in seconds without dynamic white residue.",
      trendingReason: "'Get Ready With Me' busy morning reels and quick gym transformation routines.",
      videoSearchKeyword: "greasy hair mist transformation",
      marketDemand: "High"
    },
    {
      id: "b3",
      name: "Cryo Ice-Globe Glass Massagers",
      niche: "beauty",
      priceRange: "Rp 210.000 - Rp 330.000",
      views: 1850000,
      likes: 210000,
      shares: 28000,
      comments: 4900,
      growth24h: 84,
      difficulty: 30,
      estCommission: "25% (Rp 67.500/sale)",
      description: "Shatterproof cryotherapy facial globes designed to depuff skin, stimulate oxygen flow, and soothe morning redness.",
      trendingReason: "Aesthetic skincare routines, ice-globe depuffing micro-videos, and sensory skincare ASMR.",
      videoSearchKeyword: "morning skincare ice globes de-puff",
      marketDemand: "Stable"
    }
  ],
  home: [
    {
      id: "h1",
      name: "Astronaut Sunset Projection Lamp",
      niche: "home",
      priceRange: "Rp 225.000 - Rp 420.000",
      views: 4800000,
      likes: 720000,
      shares: 98005,
      comments: 14200,
      growth24h: 215,
      difficulty: 55,
      estCommission: "18% (Rp 64.500/sale)",
      description: "A cute desktop astronaut figure projecting rotating vibrant sunset and nebula coordinates onto walls.",
      trendingReason: "Room makeover showcases, cozy midnight tea reviews, and chill background aesthetic integrations.",
      videoSearchKeyword: "cozy aesthetic sunset lamp astronaut",
      marketDemand: "Extreme"
    },
    {
      id: "h2",
      name: "Desktop Smart Auto-Watering Plant Pot",
      niche: "home",
      priceRange: "Rp 360.000 - Rp 570.000",
      views: 1200000,
      likes: 190000,
      shares: 18000,
      comments: 5400,
      growth24h: 62,
      difficulty: 28,
      estCommission: "12% (Rp 57.000/sale)",
      description: "Self-watering geometric tabletop pot with integrated dynamic water reservoir level sensors.",
      trendingReason: "Workspace level-up desk tours, minimal smart home tech, and plant-parent aesthetics.",
      videoSearchKeyword: "smart desktop garden plant system",
      marketDemand: "High"
    },
    {
      id: "h3",
      name: "USB-C Handheld Ultrasonic Milk Frother",
      niche: "home",
      priceRange: "Rp 150.000 - Rp 240.000",
      views: 1050000,
      likes: 110000,
      shares: 9200,
      comments: 2100,
      growth24h: 31,
      difficulty: 74,
      estCommission: "20% (Rp 42.000/sale)",
      description: "Ultra-quiet coffee frother with adjustable speeds, a charging dock, and high-velocity microfoam tips.",
      trendingReason: "Home cafe espresso ASMR vlogs, matcha preparation tutorials, and kitchen gadget shortcuts.",
      videoSearchKeyword: "matcha whisk frother aesthetic pouring",
      marketDemand: "Stable"
    }
  ],
  tech: [
    {
      id: "t1",
      name: "Retro Mechanical Switch Calculator",
      niche: "tech",
      priceRange: "Rp 270.000 - Rp 390.000",
      views: 3100000,
      likes: 540000,
      shares: 72000,
      comments: 11200,
      growth24h: 189,
      difficulty: 40,
      estCommission: "15% (Rp 52.500/sale)",
      description: "Sleek pastel desktop calculator configured with clicky mechanical keyboard blue switches and premium feedback.",
      trendingReason: "ASMR typing sounds, keyboard keycap customizations, and beautiful back-to-school setups.",
      videoSearchKeyword: "satisfying clicky calculator mechanical keyboard",
      marketDemand: "Extreme"
    },
    {
      id: "t2",
      name: "Sleek Kickstand MagSafe Power Bank",
      niche: "tech",
      priceRange: "Rp 525.000 - Rp 735.000",
      views: 2200000,
      likes: 310000,
      shares: 41000,
      comments: 8700,
      growth24h: 94,
      difficulty: 62,
      estCommission: "10% (Rp 67.500/sale)",
      description: "Ultra-slim snap-on magnetic battery pack configured with a folded vegan leather kickstand.",
      trendingReason: "Everyday carry alignment posts, smartphone gadget reviews, and travel tech vlogs.",
      videoSearchKeyword: "travel gear magsafe kickstand pack review",
      marketDemand: "High"
    },
    {
      id: "t3",
      name: "App-Customized Desktop Pixel Sign",
      niche: "tech",
      priceRange: "Rp 600.000 - Rp 975.000",
      views: 1400000,
      likes: 175000,
      shares: 24000,
      comments: 3900,
      growth24h: 53,
      difficulty: 48,
      estCommission: "12% (Rp 97.500/sale)",
      description: "Cool RGB pixel grid clock with customizable retro animations, real-time subscriber counts, and notifications.",
      trendingReason: "Cozy gaming desk tours, bedroom lighting ideas, and pixel-art time lapse videos.",
      videoSearchKeyword: "pixel art setup clock screen",
      marketDemand: "High"
    }
  ],
  fitness: [
    {
      id: "f1",
      name: "Smart-Counting Cordless Jump Rope",
      niche: "fitness",
      priceRange: "Rp 240.000 - Rp 360.000",
      views: 1950000,
      likes: 280000,
      shares: 34000,
      comments: 7300,
      growth24h: 110,
      difficulty: 35,
      estCommission: "25% (Rp 75.000/sale)",
      description: "Tangle-free jump rope with count screens, paired with cordless weighted balls for perfect indoor home gym workouts.",
      trendingReason: "'How I lost weight at home' videos, indoor workout motivation, and jump rope tricks.",
      videoSearchKeyword: "cordless skipping rope home workout",
      marketDemand: "High"
    },
    {
      id: "f2",
      name: "Quiet Pocket Deep-Tissue Massage Gun",
      niche: "fitness",
      priceRange: "Rp 435.000 - Rp 675.000",
      views: 1550000,
      likes: 190000,
      shares: 22000,
      comments: 4200,
      growth24h: 45,
      difficulty: 50,
      estCommission: "15% (Rp 82.500/sale)",
      description: "Quiet portable massage gun that releases muscle trigger points in a fits-in-your-pocket layout.",
      trendingReason: "Gym checklist videos, post-workout trigger massage therapy, and satisfying slow-motion impact shots.",
      videoSearchKeyword: "mini pocket massage gun unboxing recovery",
      marketDemand: "Stable"
    },
    {
      id: "f3",
      name: "Pastel Gradient Motivating Straw Bottle",
      niche: "fitness",
      priceRange: "Rp 180.000 - Rp 270.000",
      views: 2900000,
      likes: 410000,
      shares: 55000,
      comments: 9500,
      growth24h: 130,
      difficulty: 72,
      estCommission: "20% (Rp 48.000/sale)",
      description: "Motivating 2L transparent water bottle marked with hourly checkpoints, clean leakproof locks, and beautiful frosted color gradients.",
      trendingReason: "'Water recipe' prep guides, daily aesthetic hydration vlogs, and gym workout aesthetic fits.",
      videoSearchKeyword: "cute hydration water tracker bottle aesthetic",
      marketDemand: "High"
    }
  ],
  kitchen: [
    {
      id: "k1",
      name: "Safe-Edge Side-Cutting Can Opener",
      niche: "kitchen",
      priceRange: "Rp 225.000 - Rp 330.000",
      views: 3400000,
      likes: 510000,
      shares: 61000,
      comments: 12500,
      growth24h: 175,
      difficulty: 32,
      estCommission: "22% (Rp 67.500/sale)",
      description: "One-touch battery-operated automatic can opener cutting cleanly sideways to prevent hazardous metal rims or splinters.",
      trendingReason: "Kitchen accessibility shortcuts, satisfying cooking ASMR prep, and smart home kitchen gadget roundups.",
      videoSearchKeyword: "safe rim electric jar cutter gadget",
      marketDemand: "Extreme"
    },
    {
      id: "k2",
      name: "Mini Rechargeable Food Thermal Sealer",
      niche: "kitchen",
      priceRange: "Rp 120.000 - Rp 210.000",
      views: 1100000,
      likes: 140000,
      shares: 16000,
      comments: 3100,
      growth24h: 55,
      difficulty: 45,
      estCommission: "20% (Rp 36.000/sale)",
      description: "2-in-1 tool featuring a high-heat thermal bag sealer on one end and a sharp safety cutter on the other.",
      trendingReason: "Pantry restocks, fridge organizing makeovers, and snacking hacks compilation videos.",
      videoSearchKeyword: "munchies heat sealer satisfying pocket gadget",
      marketDemand: "Stable"
    }
  ]
};

// State stored in memory on the server. Recalculated / randomized slightly on "Scrape Refresh" command.
let activeProducts: Record<string, Product[]> = {};

function calculateViralScore(p: Omit<Product, "viralScore">): number {
  // Balanced weights for dynamic score calculation:
  // 1. View influence (30% weight, baseline 1.5M is standard high)
  const viewScore = Math.min(30, (p.views / 2000000) * 30);
  // 2. Growth influence (40% weight, baseline +150% is standard high)
  const growthScore = Math.min(40, (p.growth24h / 150) * 40);
  // 3. User interaction ratio score (30% weight, sharing rate multiplier)
  const shareRatio = p.likes > 0 ? (p.shares / p.likes) : 0;
  const interactionScore = Math.min(30, shareRatio * 200);

  return Math.min(100, Math.max(10, Math.round(viewScore + growthScore + interactionScore)));
}

// Initalize products with exact calculations
function initializeState() {
  const newState: Record<string, Product[]> = {};
  for (const niche in BASE_PRODUCTS) {
    newState[niche] = BASE_PRODUCTS[niche].map(item => {
      const p = { ...item };
      return {
        ...p,
        viralScore: calculateViralScore(p)
      };
    });
  }
  activeProducts = newState;
}

initializeState();

// API: Get Trends
app.get("/api/trends", (req, res) => {
  const niche = req.query.niche as string;
  const search = (req.query.search as string || "").toLowerCase().trim();

  let results: Product[] = [];

  if (niche && niche !== "all") {
    results = activeProducts[niche] || [];
  } else {
    // Collect all
    results = Object.values(activeProducts).flat();
  }

  // Filter by search terms if any
  if (search) {
    results = results.filter(p => 
      p.name.toLowerCase().includes(search) || 
      p.description.toLowerCase().includes(search) ||
      p.videoSearchKeyword.toLowerCase().includes(search)
    );
  }

  // Sort by viral score descending
  results = results.sort((a, b) => (b.viralScore || 0) - (a.viralScore || 0));

  // Limit to top 5 trends to save screen space
  const topFive = results.slice(0, 5);

  res.json({
    timestamp: new Date().toISOString(),
    items: topFive
  });
});

// API: Perform "Force Real-time Scrape & Crawl" Action using Real-time Google Search Grounding when available!
app.post("/api/scrape", async (req, res) => {
  const parseResult = ScrapeSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.issues[0].message });
  }
  const targetNiche = parseResult.data.niche; // option to restrict to one, or all
  const categoriesToUpdate = targetNiche && targetNiche !== "all" ? [targetNiche] : Object.keys(activeProducts);

  const apiKey = process.env.GEMINI_API_KEY;
  let useRealScraper = false;
  let scrapeErrors: string[] = [];

  if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
    useRealScraper = true;
  }

  if (useRealScraper) {
    try {
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Loop over categories to update and fetch real product data using Google Search Grounding to guarantee real-time results
      for (const niche of categoriesToUpdate) {
        // Caching Check: Look up Firestore cache (or custom wrapper memory cache)
        let cacheFound = false;
        try {
          const cacheKey = `niche_cache_${niche}`;
          const cacheDoc = await db.collection("scraped_trends").doc(cacheKey).get();
          if (cacheDoc.exists) {
            const cacheData = cacheDoc.data();
            // Demarcate 15-minute validity window (15 * 60 * 1000 = 900,000 miliseconds)
            if (cacheData && cacheData.ts && Date.now() - cacheData.ts < 900000 && Array.isArray(cacheData.products)) {
              console.log(`[SCRAPER CACHE - HIT] Reusing cached real-time trends for niche: ${niche} (age: ${Math.round((Date.now() - cacheData.ts) / 1000)}s)`);
              activeProducts[niche] = cacheData.products;
              cacheFound = true;
            }
          }
        } catch (cacheFetchErr: any) {
          console.warn(`[SCRAPER CACHE] Exception reading cache for ${niche}:`, cacheFetchErr.message);
        }

        if (cacheFound) {
          continue; // skip live Gemini Google Search crawl!
        }

        const prompt = `Kamu adalah AI Web Scraper dan Analis Pasar Afiliasi Indonesia.
Carilah data real-time terbaru menggunakan Google Search mengenai produk-produk fisik nyata (affiliate products) yang saat ini sedang sangat viral, trending, paling banyak dicari, atau memiliki tingkat interaksi (engagement) tinggi di TikTok Shop, Shopee, Tokopedia, atau Instagram Reels di Indonesia untuk kategori/niche: "${niche}".

Temukan produk-produk riil (nyata) yang benar-benar ada di pasaran Indonesia dengan nama barang yang jelas (bahasa Indonesia atau Inggris populer), deskripsi riil, rentang harga nyata (misal: "Rp 120.000 - Rp 180.000"), estimasi pencarian & tontonan, serta perkiraan komisi affiliate yang rill untuk barang sejenis.

Kembalikan TEPAT SEBUAH JSON array berisi objek produk yang terstruktur persis seperti schema TypeScript ini. Jangan menyertakan kata pengantar, penjelasan, atau penutup. Kembalikan HANYA block kode JSON.

Struktur JSON target:
[
  {
    "id": "nama_id_unik_tanpa_spasi_diawali_huruf_kecil_misal_b_tint_glow",
    "name": "Nama Produk Rill yang Sedang Viral di Indonesia Saat Ini",
    "niche": "${niche}",
    "priceRange": "Rp [harga_min] - Rp [harga_max]",
    "views": angka_views_estimasi_bulanan_rill_atau_tinggi (misal: 1200000),
    "likes": angka_likes_estimasi (misal: 180000),
    "shares": angka_shares_estimasi (misal: 25000),
    "comments": angka_comments_estimasi (misal: 5400),
    "growth24h": persentase_pertumbuhan_24jam_terakhir_dalam_angka_bulat (misal: 130),
    "difficulty": tingkat_persaingan_1_sampai_100_angkabulat (misal: 40),
    "estCommission": "Persentase komisi dan nominal Rupiah komisi per sale (misal: 15% (Rp 25.000/sale))",
    "description": "Deskripsi produk nyata, fungsi, dan keunggulan utamanya.",
    "trendingReason": "Alasan nyata kenapa produk ini sangat viral di medsos Indonesia saat ini (sebutkan tren fyp atau kebiasaan pembelinya).",
    "videoSearchKeyword": "keyword pencarian video tiktok populer (misal: review lip tint jelly viral tiktok)",
    "marketDemand": "Extreme"
  }
]

Hasilkan setidaknya 3-5 produk nyata yang paling viral dan aktual. Pastikan JSON valid dan bisa langsung diparsing dengan JSON.parse().`;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
            temperature: 0.7,
          }
        });

        const text = response.text || "";
        let cleanStr = text.trim();
        if (cleanStr.startsWith("```json")) {
          cleanStr = cleanStr.substring(7);
        }
        if (cleanStr.endsWith("```")) {
          cleanStr = cleanStr.substring(0, cleanStr.length - 3);
        }
        cleanStr = cleanStr.trim();

        try {
          const crawledProducts = JSON.parse(cleanStr) as Product[];
          if (Array.isArray(crawledProducts) && crawledProducts.length > 0) {
            const formatted: Product[] = crawledProducts.map(p => {
              const baseProd: Product = {
                id: p.id || `real-${Math.random().toString(36).substring(2, 6)}`,
                name: p.name || "Real-time Viral Product",
                niche: p.niche || niche,
                priceRange: p.priceRange || "Rp 150.000",
                views: Number(p.views) || 500000,
                likes: Number(p.likes) || 50000,
                shares: Number(p.shares) || 12000,
                comments: Number(p.comments) || 2000,
                growth24h: Number(p.growth24h) || 85,
                difficulty: Number(p.difficulty) || 50,
                estCommission: p.estCommission || "15% (Rp 22.500/sale)",
                description: p.description || "The leading item sweeping social media with high quality structure.",
                trendingReason: p.trendingReason || "ASMR reviews, unboxing feeds, and aesthetic lifestyle transitions.",
                videoSearchKeyword: p.videoSearchKeyword || `${p.name} review`,
                marketDemand: p.marketDemand || "High"
              };

              return {
                ...baseProd,
                viralScore: calculateViralScore(baseProd)
              };
            });

            activeProducts[niche] = formatted;

            // Save to Cache: Keep cached results in database for 15 minutes to preserve search grounding allocation
            try {
              const cacheKey = `niche_cache_${niche}`;
              await db.collection("scraped_trends").doc(cacheKey).set({
                ts: Date.now(),
                products: formatted
              });
              console.log(`[SCRAPER CACHE - SET] Saved live crawling results to cache for niche: ${niche}`);
            } catch (cacheSetErr: any) {
              console.warn(`[SCRAPER CACHE] Exception writing cache for ${niche}:`, cacheSetErr.message);
            }
          } else {
            throw new Error("Parsed content is not a non-empty array");
          }
        } catch (parseErr: any) {
          console.error(`[SCRAPER ERROR] Gagal memparsing real-time JSON untuk niche ${niche}:`, parseErr.message);
          scrapeErrors.push(`${niche}: ${parseErr.message}`);
          runSimulationFallbackForNiche(niche);
        }
      }
    } catch (err: any) {
      console.error("[CRAWLER ERROR] Gagal menghubungkan ke Search Grounding API:", err.message);
      scrapeErrors.push(`API Connection Error: ${err.message}`);
      categoriesToUpdate.forEach(niche => runSimulationFallbackForNiche(niche));
    }
  } else {
    categoriesToUpdate.forEach(niche => runSimulationFallbackForNiche(niche));
  }

  function runSimulationFallbackForNiche(niche: string) {
    if (activeProducts[niche]) {
      activeProducts[niche] = activeProducts[niche].map(prod => {
        const growthDelta = Math.floor(Math.random() * 70) - 20;
        const rawGrowth = Math.max(5, prod.growth24h + growthDelta);
        const viewDelta = Math.floor(Math.random() * 100000) + 50000;
        const rawViews = prod.views + viewDelta;
        const likeDelta = Math.floor(viewDelta * (0.1 + Math.random() * 0.05));
        const rawLikes = prod.likes + likeDelta;
        const shareDelta = Math.floor(likeDelta * (0.05 + Math.random() * 0.15));
        const rawShares = prod.shares + shareDelta;
        const commentDelta = Math.floor(likeDelta * (0.01 + Math.random() * 0.03));
        const rawComments = prod.comments + commentDelta;
        const demands: ("Extreme" | "High" | "Stable" | "Soaring")[] = ["Extreme", "High", "Stable", "Soaring"];
        const randDemand = Math.random() > 0.7 ? demands[Math.floor(Math.random() * demands.length)] : prod.marketDemand;

        const updatedProd: Product = {
          ...prod,
          growth24h: rawGrowth,
          views: rawViews,
          likes: rawLikes,
          shares: rawShares,
          comments: rawComments,
          marketDemand: randDemand
        };
        updatedProd.viralScore = calculateViralScore(updatedProd);
        return updatedProd;
      });
    }
  }

  res.json({
    success: true,
    realTime: useRealScraper && scrapeErrors.length === 0,
    message: useRealScraper && scrapeErrors.length === 0
      ? `Real-time search scraping completed successfully! Collected live viral products for: ${categoriesToUpdate.join(", ")}.`
      : `Scraper simulation ran successfully (with fallbacks if needed)! Updated ${categoriesToUpdate.join(", ")} metrics.`,
    errors: scrapeErrors.length > 0 ? scrapeErrors : undefined,
    timestamp: new Date().toISOString()
  });
});

// Models relocated to the top to avoid duplicate declarations

// Persistent get-or-create user mapper on Firestore
async function getOrCreateUser(id: string, name?: string, phone?: string): Promise<UserProfile> {
  const userRef = db.collection("users").doc(id);
  const docSnap = await userRef.get();
  if (!docSnap.exists) {
    const user: UserProfile = {
      id,
      name: name || "Member Afiliasi",
      phone: phone || "-",
      credits: 5 // Default 5 free trial credits
    };
    await userRef.set(user);
    return user;
  } else {
    const user = docSnap.data() as UserProfile;
    let changed = false;
    if (name && name !== "Member Afiliasi" && user.name !== name) {
      user.name = name;
      changed = true;
    }
    if (phone && phone !== "-" && user.phone !== phone) {
      user.phone = phone;
      changed = true;
    }
    if (changed) {
      await userRef.set(user, { merge: true });
    }
    return user;
  }
}

// Self-healing database seeder to guarantee visual trial data persists out of the box
async function seedDatabase() {
  try {
    const trialUserRef = db.collection("users").doc("USR-TRIAL-01");
    const trialUserSnap = await trialUserRef.get();
    if (!trialUserSnap.exists) {
      await trialUserRef.set({
        id: "USR-TRIAL-01",
        name: "Andi Saputra",
        phone: "081234567890",
        credits: 5
      });
    }

    const trialTxRef = db.collection("transactions").doc("TX-SEED-01");
    const trialTxSnap = await trialTxRef.get();
    if (!trialTxSnap.exists) {
      await trialTxRef.set({
        id: "TX-SEED-01",
        userId: "USR-TRIAL-01",
        userName: "Andi Saputra",
        userPhone: "081234567890",
        packageName: "Starter Package (10 Credits)",
        amount: 10000,
        creditsGained: 10,
        status: "PENDING",
        createdAt: new Date().toISOString()
      });
    }
    console.log("[FIRESTORE] Sandboxed and trial database seeded successfully.");
  } catch (error) {
    console.error("[FIRESTORE SEEDING ERROR]:", error);
  }
}

// API: User Profile and Sync
app.get("/api/user/profile", async (req, res) => {
  const result = UserProfileQuerySchema.safeParse(req.query);
  if (!result.success) {
    return res.status(400).json({ error: result.error.issues[0].message });
  }
  const { userId, name, phone } = result.data;

  try {
    const user = await getOrCreateUser(userId, name || undefined, phone || undefined);
    res.json({
      success: true,
      user
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API: Create Top-Up Transaction Request
app.post("/api/topup/request", async (req, res) => {
  const result = TopUpRequestSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.issues[0].message });
  }
  const { userId, userName, userPhone, packageName, amount, creditsGained } = result.data;

  try {
    const user = await getOrCreateUser(userId, userName || undefined, userPhone || undefined);

    const txId = `TX-${Math.floor(100000 + Math.random() * 900000)}`;
    const transaction: TopUpTransaction = {
      id: txId,
      userId,
      userName: userName || user.name,
      userPhone: userPhone || user.phone,
      packageName,
      amount: amount,
      creditsGained: creditsGained,
      status: "PENDING",
      createdAt: new Date().toISOString()
    };

    await db.collection("transactions").doc(txId).set(transaction);

    res.json({
      success: true,
      transaction
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API: Get Admin Panel Data (Secured with Password check: 290916)
app.get("/api/admin/data", async (req, res) => {
  const password = req.query.password as string;
  if (password !== "290916") {
    return res.status(401).json({ error: "Password Admin salah!" });
  }

  try {
    const usersSnapshot = await db.collection("users").get();
    const users = usersSnapshot.docs.map(doc => doc.data() as UserProfile);

    const transactionsSnapshot = await db.collection("transactions").get();
    const transactions = transactionsSnapshot.docs
      .map(doc => doc.data() as TopUpTransaction)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({
      success: true,
      users,
      transactions
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API: Admin Approve Top-up and credit user directly
app.post("/api/admin/topup/approve", async (req, res) => {
  const result = AdminApproveSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.issues[0].message });
  }
  const { transactionId, password } = result.data;
  if (password !== "290916") {
    return res.status(401).json({ error: "Password Admin salah!" });
  }

  try {
    const txRef = db.collection("transactions").doc(transactionId);
    const txSnap = await txRef.get();
    if (!txSnap.exists) {
      return res.status(444).json({ error: "Transaksi tidak ditemukan." });
    }

    const tx = txSnap.data() as TopUpTransaction;
    if (tx.status !== "PENDING") {
      return res.status(400).json({ error: "Transaksi ini sudah diproses sebelumnya." });
    }

    const user = await getOrCreateUser(tx.userId, tx.userName, tx.userPhone);
    user.credits += tx.creditsGained;

    tx.status = "APPROVED";

    await db.collection("users").doc(tx.userId).set(user, { merge: true });
    await txRef.update({ status: "APPROVED" });

    res.json({
      success: true,
      message: `Kredit ${tx.creditsGained} berhasil ditambahkan ke user ${user.name}! Status: APPROVED`,
      user,
      transaction: tx
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API: Admin Reject Top-up
app.post("/api/admin/topup/reject", async (req, res) => {
  const result = AdminRejectSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.issues[0].message });
  }
  const { transactionId, password } = result.data;
  if (password !== "290916") {
    return res.status(401).json({ error: "Password Admin salah!" });
  }

  try {
    const txRef = db.collection("transactions").doc(transactionId);
    const txSnap = await txRef.get();
    if (!txSnap.exists) {
      return res.status(444).json({ error: "Transaksi tidak ditemukan." });
    }

    const tx = txSnap.data() as TopUpTransaction;
    tx.status = "REJECTED";

    await txRef.update({ status: "REJECTED" });

    res.json({
      success: true,
      message: "Transaksi telah ditolak.",
      transaction: tx
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API: Admin Set User Credits Directly
app.post("/api/admin/user/set-credits", async (req, res) => {
  const result = AdminSetCreditsSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.issues[0].message });
  }
  const { userId, credits, password } = result.data;
  if (password !== "290916") {
    return res.status(401).json({ error: "Password Admin salah!" });
  }

  try {
    const userRef = db.collection("users").doc(userId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      return res.status(404).json({ error: "User tidak ditemukan di database." });
    }

    const user = userSnap.data() as UserProfile;
    user.credits = credits;

    await userRef.update({ credits: user.credits });

    res.json({
      success: true,
      message: `Kredit user ${user.name} berhasil diubah menjadi ${credits}.`,
      user
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API: Generate AI Affiliate Copy (Using Gemini API)
app.post("/api/generate-content", async (req, res) => {
  try {
    const result = GenerateContentSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.issues[0].message });
    }
    const { 
      userId,
      productName, 
      niche, 
      description, 
      trendingReason, 
      priceRange,
      contentType, 
      tone, 
      targetAudience, 
      includeAffiliateDisclaimer,
      customKeywords,
      premiumVideoMode,
      premiumVoiceCharacter
    } = result.data;

    // Verify Credits
    const user = await getOrCreateUser(userId);
    if (user.credits <= 0) {
      return res.status(400).json({ 
        error: "Kredit Anda habis! Silakan lakukan pembelian kredit (Top Up) terlebih dahulu menggunakan GoPay dan hubungi admin di WA." 
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      return res.status(400).json({
        error: "Google Gemini API Key is not configured. Please add the GEMINI_API_KEY secret in the AI Studio platform Settings > Secrets menu."
      });
    }

    // Lazy initialization of GoogleGenAI SDK to avoid crashing
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const isPremium = !!premiumVideoMode;
    const voiceCharName = premiumVoiceCharacter || "Sarah (Lifestyle Enthusiast)";

    let prompt = "";
    let configObj: any = {
      temperature: 1.0,
      systemInstruction: "You are a master viral marketer and social media script writer. You know exactly what makes people freeze their scroll and click the link in bio. Write with energy and persuasion."
    };

    if (isPremium) {
      configObj.responseMimeType = "application/json";
      prompt = `You are an elite AI Short Video Director and Affiliate voiceover producer.
Create a high-impact, realistic 25-second short promotional video (like TikTok / Instagram Reels) for the following trending product:

- PRODUCT NAME: ${productName}
- CATEGORY/NICHE: ${niche || 'General'}
- PRODUCT DESCRIPTION: ${description || 'A viral trending gadget'}
- WHY IT IS VIRAL: ${trendingReason || 'Popular unboxing aesthetic clips'}
- PRICE RANGE: ${priceRange || 'Competitive'}
- DESIRED TONE: ${tone}
- TARGET AUDIENCE: ${targetAudience}
${customKeywords ? `- ADDITIONAL KEYWORDS: ${customKeywords}` : ''}

You MUST choose a realistic Indonesian narrator character name matching the brand niche and requested character persona (${voiceCharName}).

Return exactly a JSON object conforming to the following structure:
{
  "isPremiumVideo": true,
  "character": {
    "name": "Full name of the character (e.g., Sarah, Rian, Ayu, Budi )",
    "role": "Short bio matching the niche (e.g., Professional Skincare Aesthetician, Minimal Tech Workspace Builder)",
    "avatarDescription": "Detailed visual outfit & backdrop description for the character (suitable for generating a realistic lifestyle picture)",
    "voicePitch": 1.0, 
    "voiceRate": 0.95,
    "gender": "male" or "female"
  },
  "overallScript": "A continuous written Markdown script of the video as a fallback...",
  "scenes": [
    {
      "id": 1,
      "timeRange": "0s - 5s",
      "visualPrompt": "Detailed, photorealistic scene description of the product or lifestyle context for standard 4K real-life visual representation. High contrast, warm cinematic lighting, shallow depth of field.",
      "speech": "First 5 seconds spoken script in natural, enthusiastic, high-converting Indonesian voiceover. Start with a massive hook!",
      "subtitle": "Subtitle text for the first 5 seconds",
      "sfx": "Short sound effect or transition cue (e.g. [Soft satisfying glass-clink], [Upbeat zoom transition])"
    },
    {
      "id": 2,
      "timeRange": "5s - 10s",
      "visualPrompt": "Detailed photorealistic close-up scene description showcasing the product features or usage. Realistic, high definition.",
      "speech": "Second 5 seconds spoken script in natural Indonesian...",
      "subtitle": "Subtitle text for 5s to 10s...",
      "sfx": "SFX description..."
    },
    {
      "id": 3,
      "timeRange": "10s - 15s",
      "visualPrompt": "Detailed photorealistic scene description tracking action or demonstrating the main benefit of the product...",
      "speech": "Third 5 seconds spoken script in natural Indonesian showing the benefit or solving a pain point...",
      "subtitle": "Subtitle text for 10s to 15s...",
      "sfx": "SFX description..."
    },
    {
      "id": 4,
      "timeRange": "15s - 20s",
      "visualPrompt": "Detailed photorealistic scene description showing happy emotional feedback or satisfying results close-up...",
      "speech": "Fourth 5 seconds spoken script with massive FOMO or highlighting the competitive pricing / discount...",
      "subtitle": "Subtitle text for 15s to 20s...",
      "sfx": "SFX description..."
    },
    {
      "id": 5,
      "timeRange": "20s - 25s",
      "visualPrompt": "Detailed photorealistic scene description of call-to-action (pointing to the bio link, showing shop button)...",
      "speech": "Fifth 5 seconds spoken script calling to action: click link biological or buy immediately with natural disclaimer element built-in!",
      "subtitle": "Subtitle text for 20s to 25s...",
      "sfx": "SFX description..."
    }
  ],
  "hashtags": ["#viral_hashtag1", "#viral_hashtag2", ...]
}

Make sure there are exactly 5 entries in the 'scenes' list, each representing exactly a 5-second interval, summing to 25 seconds of superb storytelling in realistic, authentic Indonesian language. DO NOT return any wrap code comments or surrounding markers outside of the JSON block.`;
    } else {
      // Structure a highly contextual copy instructions based on tone, type, and audience
      prompt = `You are an elite, high-converting social media content creator and affiliate marketer. 
Produce an outstanding piece of promotional content for the following trending product:

- PRODUCT NAME: ${productName}
- CATEGORY/NICHE: ${niche || 'General'}
- PRODUCT DESCRIPTION: ${description || 'A viral trending gadget'}
- WHY IT IS VIRAL: ${trendingReason || 'Popular unboxing aesthetic clips'}
- PRICE RANGE: ${priceRange || 'Competitive'}
- CONTENT TYPE SOUGHT: ${contentType}
- DESIRED TONE: ${tone}
- TARGET AUDIENCE: ${targetAudience}
${customKeywords ? `- ADDITIONAL KEYWORDS TO INCLUDE: ${customKeywords}` : ''}
${includeAffiliateDisclaimer ? `- REQUIREMENT: Include a natural, clever affiliate disclaimer at the bottom.` : ''}

Your output MUST be formatted elegantly in clean Markdown. Avoid talking to the user or saying "Here is your script:". Output only the direct final draft.

Include the following sections clearly as fits the requested Content Type:
1. 🎬 **The Hook / Attention-Grabber**: Provide 3 distinct options for the video hook or header line.
2. 📝 **Core Copy/Script**:
   - If a Video Script (TikTok/Instagram Reels), write it in a multi-column or scripted screen-directions layout (e.g. [Visual: holding container] / "Voiceover: Look at this..."). Make it highly punchy, rhythmic, and perfectly suited for pacing. Include specific cues for sound effects (SFX) or video transitions.
   - If a Review, Post, or Caption, write the high-impact structured paragraphs with emojis, lists, subheadings, and bold highlights.
3. 🏷️ **Affiliate Strategies & Tips**: Provide 3 quick specific advice tips for this product regarding how to film it, where to add links, or how to frame the camera to maximize clicking conversion rates.
4. 📈 **Trending Hashtags**: List 6 highly viral contextual hashtags.
5. ⚠️ **Affiliate Notice** (if requested).
`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: configObj
    });

    const generatedText = response.text || "Failed to generate text from model.";

    // Process Credit Deduction
    user.credits -= 1;
    await db.collection("users").doc(userId).update({ credits: user.credits });

    res.json({
      success: true,
      content: generatedText,
      creditsRemaining: user.credits,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("Gemini API Error in backend proxy:", error);
    res.status(500).json({ 
      error: "An unexpected error occurred while communicating with the Gemini API.",
      details: error?.message || error
    });
  }
});

// API: Trend Oracle Pro (Predictive Product Analysis)
app.post("/api/generate-trend-oracle", async (req, res) => {
  try {
    const result = GenerateTrendOracleSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.issues[0].message });
    }
    const { userId, niche, budget, platform } = result.data;

    // Verify Credits
    const user = await getOrCreateUser(userId);
    if (user.credits <= 0) {
      return res.status(400).json({ 
        error: "Kredit Anda habis! Silakan lakukan pembelian kredit (Top Up) terlebih dahulu menggunakan GoPay dan hubungi admin di WA." 
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      return res.status(400).json({
        error: "Google Gemini API Key is not configured. Please add the GEMINI_API_KEY secret in the AI Studio platform Settings > Secrets menu."
      });
    }

    // Lazy initialization of GoogleGenAI SDK to avoid crashing
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const prompt = `Kamu adalah TREND ORACLE PRO, AI analis prediksi produk viral untuk pasar Indonesia (fokus TikTok Shop, Shopee Affiliate, Instagram Reels).

TUGAS: Prediksi 10 produk yang AKAN viral dalam 14-30 hari ke depan. Bukan yang sudah viral sekarang.

GUNAKAN FORMULA PREDIKSI INI UNTUK MENGEVALUASI SETIAP PRODUK:
1. GROWTH VELOCITY (30%): Hitung (pencarian 7 hari / pencarian 30 hari). Cari lonjakan > 2.5x
2. MENTION INCREASE (25%): Kenaikan mention organik di TikTok + Instagram Reels dalam 7 hari terakhir vs minggu sebelumnya
3. LOW SATURATION (20%): Jumlah seller aktif < 500, atau video produk < 2.000, atau kompetisi rendah di Shopee
4. CREATOR ADOPTION (15%): Jumlah creator baru (follower 5k-100k) yang posting produk dalam 14 hari > 15 orang
5. CPC AFFILIATE VALUE (10%): Komisi affiliate > 10% DAN harga jual Rp50.000 - Rp250.000

CARA KERJA ANALISIS INTERNAL:
- Analisis data berdasarkan indikator Google Trends ID, TikTok Creative Center, Shopee trending, Tokopedia trending, hashtag Instagram
- Beri skor 1-10 untuk tiap faktor di atas
- Hitung TOTAL SCORE = (GV*0.3)+(MI*0.25)+(LS*0.2)+(CA*0.15)+(CPC*0.1)
- Hanya tampilkan produk dengan TOTAL SCORE >= 7.5

Aturan Keras Output:
- Jangan sebut produk yang sudah > 10.000 video di TikTok (hindari produk jenuh)
- Prioritaskan produk evergreen-problem solving, beauty hack, dapur unik, atau gadget < Rp150rb
- Jangan jelaskan metodologi, langsung berikan hasil prediksi
- Bahasa Indonesia, singkat, padat, tanpa basa-basi ataupun prolog/epilog.
- Gunakan format PLAIN TEXT persis seperti berikut untuk masing-masing dari 10 produk:

1. [Nama Produk] - Skor: [Skor]/10
   Kenapa akan viral: [growth velocity, jumlah seller aktif, jumlah creator micro mulai posting]
   Timing masuk: SEKARANG (0-7 hari) atau NANTI (8-14 hari)
   Angle konten: [Berikan 3 ide hook yang kreatif dan clickbait dalam Bahasa Indonesia]
   Estimasi CPC affiliate: [Estimasi Komisi/CPC dalam Rupiah]
   Risiko: [Sebutkan 1 risiko logistik/suplier/kejenuhan dalam satu kalimat singkat]

INPUT USER:
Niche: ${niche}
Budget Riset/Modal Pemula: ${budget || 'Rp 50.000 - Rp 500.000'}
Platform Utama: ${platform || 'TikTok'}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.9,
        systemInstruction: "You are TREND ORACLE PRO, the #1 AI for predictive viral trend analytics in Southeast Asia. You output raw high-impact product lists in Indonesian with zero commentary outside the exact requested list format."
      }
    });

    const generatedText = response.text || "Gagal memprediksi trend.";

    // Process Credit Deduction
    user.credits -= 1;
    await db.collection("users").doc(userId).update({ credits: user.credits });

    res.json({
      success: true,
      content: generatedText,
      creditsRemaining: user.credits,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("Gemini API Error in Oracle endpoint:", error);
    res.status(500).json({ 
      error: "Terjadi kesalahan saat memproses ramalan trend.",
      details: error?.message || error
    });
  }
});

// API: AI Persona Hub (Interactive Strategic Dialogue & Copy Writing Agents)
app.post("/api/persona-hub/dialogue", async (req, res) => {
  try {
    const result = PersonaHubDialogueSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.issues[0].message });
    }
    const { userId, personaId, message, topic, history } = result.data;

    // Verify Credits
    const user = await getOrCreateUser(userId);
    if (user.credits <= 0) {
      return res.status(400).json({ 
        error: "Kredit Anda habis! Silakan lakukan pembelian kredit (Top Up) terlebih dahulu menggunakan GoPay dan hubungi admin di WA." 
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      return res.status(400).json({
        error: "Google Gemini API Key is not configured. Silakan tambahkan GEMINI_API_KEY di menu Secrets AI Studio."
      });
    }

    // Lazy initialization of GoogleGenAI SDK to avoid crashing
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    let systemInstruction = "";
    let personaName = "";

    switch (personaId) {
      case "bude_siska":
        personaName = "Bude Siska (Ratu FOMO Emak-Emak)";
        systemInstruction = `Kamu adalah Bude Siska, seorang pelaku bisnis e-commerce paruh baya Indonesia yang sangat ramah, cerewet, bermulut lincah, dan paling jago memicu FOMO (takut kehabisan) ibu-ibu rumah tangga Indonesia. 
Gaya Bicara: Logat akrab emak-emak Indonesia, suka menyapa 'Astaga jeng!', 'Aduh sori dori ya...', 'Heh!', 'Kece badai!', 'Bisa bangkrut kita kalau kehabisan!'. Selalu merekomendasikan produk dengan hasutan heboh, penekanan emosional, hemat belanja bulanan, dan kepraktisan hidup rumah tangga. Jangan memakai bahasa formal kaku. Kamu harus selalu menjawab konsisten sesuai karakter Bude Siska yang cerewet namun sarat teknik penjualan mutakhir. Gunakan emoji sesekali yang mewakili logat emak-emak (misal 🙋‍♀️, 🤭, 🤫).`;
        break;
      case "kak_farel":
        personaName = "Kak Farel (Tech Guru & Gadget Sleuth)";
        systemInstruction = `Kamu adalah Kak Farel, reviewer teknologi kelas atas Indonesia yang sangat objektif, detail-oriented, mengutamakan build quality, spesifikasi rincian fungsional, dan estetika minimalis. 
Gaya Bicara: Tenang, professional, menggunakan idiom tech reviewer beken di YouTube/TikTok seperti 'Menurut gua...', 'Gokil sih ini...', 'Build quality-nya solid banget...', 'Gak usah banyak gimmick...'. Tahu cara memisahkan fitur murahan dengan inovasi asli. Selalu memberikan review andal dan membuat pembeli merasa cerdas, serta menghasilkan ide video dengan ulasan detail yang mendalam.`;
        break;
      case "ci_michelle":
        personaName = "Ci Michelle (Beauty Hack Specialist)";
        systemInstruction = `Kamu adalah Ci Michelle, influencer skincare & beauty kenamaan asal Jakarta dengan ulasan personal yang estetik, ramah, mencerahkan, dan menenangkan. 
Gaya Bicara: Manis, lembut, penuh rekomendasi 'Racun Glow Up', hobi memuji audiens seolah sahabat dekatnya, gemar memakai frasa 'glowing maksimal', 'racun skincare', 'mantul parah', 'aesthetic bgt', 'gemes banget kemasannya', 'oil-control nya juraaara!'. Fokus pada solusi praktis jerawat, pori-pori, kelembaban kulit, fashion elegan, ramah kantong, dan review sebelum/sesudah (before/after).`;
        break;
      case "mas_jaka":
        personaName = "Mas Jaka (Montir Solutif & DIY King)";
        systemInstruction = `Kamu adalah Mas Jaka, seorang montir, tukang ledeng/pertukangan, dan kreator handal penyedia solusi 'Life Hacks' pria kreatif Indonesia yang senang berbagi trik mempermudah pekerjaan sehari-hari. 
Gaya Bicara: Logat pria pekerja keras yang sederhana, bersahabat, merakyat, suka menyapa 'Bro!', 'Beres joss!', 'Ini solusinya!', 'Nggak ribet!', 'Hemat tenaga!', 'Jangan mau ditipu calo!', 'Siap tempur!'. Sangat menyukai kepraktisan penggunaan alat, keawetan material, dan bagaimana menghemat biaya puluhan juta untuk reparasi pribadi sendiri di rumah.`;
        break;
      case "coach_rio":
        personaName = "Coach Rio (Dewa Copywriting Hipnotis)";
        systemInstruction = `Kamu adalah Coach Rio, seorang guru digital marketing kawakan Indonesia, ahli hipnosis konsumen (neuromarketing), bertipe agresif, penuh energi, persuasif ekstrim, dan sangat oportunistik terhadap traffic. 
Gaya Bicara: Bersemangat membara, otoritatif, suka menggunakan kata bercetak tebal atau KAPITAL untuk penekanan psikologis, memakai kalimat pendek-pendek pemicu emosi. Sering menyapa dengan 'Sahabat digital marketing!', 'BONGKAR!', 'HATI-HATI!', 'Inilah rahasia terlarang...'. Selalu meramu hook pemicu emosi kuat (pain points), sebelum meluncurkan penawaran super mematikan yang mustahil ditolak pembeli.`;
        break;
      case "sasa":
        personaName = "Sasa (Skena Jaksel & Gen-Z Trend Analyst)";
        systemInstruction = `Kamu adalah Sasa, mahasiswi hits Jakarta Selatan dan kreator trend di ranah FYP TikTok. Kamu selalu tahu apa yang sedang dicari generasi milenial & Gen-Z saat ini guna estetika personal maupun visual medsos.
Gaya Bicara: Campuran Indonesia-Inggris (lingo Jaksel), santai, ekspresif, hobi menggunakan slang gaul modern seperti 'literally', 'visually satisfying', 'jujurly', 'bestie', 'gokil badai', 'fomo parah', 'aesthetic-vibe-nya dapet', 'bikin nagih'. Sangat mementingkan sudut estetis produk, keunikan konten video transisi, warna pastel, dan apakah produk tersebut layak di-share (share-worthy) ke Instagram story atau tidak.`;
        break;
      default:
        personaName = "AI Asisten Kreatif";
        systemInstruction = "Kamu adalah AI Asisten Kreatif pemasar yang andal dan ramah, berdedikasi membantu optimasi konten promosi di Indonesia.";
    }

    let finalSystemInstruction = systemInstruction;
    if (topic) {
      finalSystemInstruction += `\n\nFOKUS TOPIK PERCAKAPAN/OUTPUT INI: ${topic}.`;
    }

    // Build contents matching @google/genai guidelines
    let contents: any[] = [];
    if (history && Array.isArray(history)) {
      history.forEach((h: any) => {
        contents.push({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.text }]
        });
      });
    }

    // Push the current user prompt
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        temperature: 0.9,
        systemInstruction: finalSystemInstruction
      }
    });

    const generatedText = response.text || "Aduh mohon maaf, sepertinya sedang ada kendala koneksi dengan asisten. Coba ketuk kirim lagi ya!";

    // Deduct Credit
    user.credits -= 1;
    await db.collection("users").doc(userId).update({ credits: user.credits });

    res.json({
      success: true,
      content: generatedText,
      personaName,
      creditsRemaining: user.credits,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("Gemini API Error in Persona Hub:", error);
    res.status(500).json({ 
      error: "Terjadi gangguan saat memanggil AI Persona Hub.",
      details: error?.message || error
    });
  }
});

// Configure Vite middleware in development or direct static serving in production
async function startServer() {
  await seedDatabase();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[FULL-STACK ENGINE] Server listening on port ${PORT}`);
  });
}

startServer();
