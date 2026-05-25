import React, { useState, useEffect, lazy, Suspense } from "react";
import { AnimatePresence } from "motion/react";

const MotionDiv = lazy(() => import("motion/react").then(m => ({ default: m.motion.div })));
import { 
  TrendingUp, 
  Sparkles, 
  Search, 
  BookOpen, 
  History, 
  ChevronRight, 
  Plus, 
  Check, 
  Copy, 
  Heart, 
  RefreshCw, 
  AlertCircle,
  FileText,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Trash2,
  Coins,
  Lock,
  User,
  MessageSquare,
  Settings
} from "lucide-react";
import { Product, SavedCampaign, GenerationParams } from "./types";
import { MetricCards } from "./components/MetricCards";
import { NicheFilter } from "./components/NicheFilter";
import { ProductCard } from "./components/ProductCard";
import { ProductDetails } from "./components/ProductDetails";
import { PremiumVideoPlayer } from "./components/PremiumVideoPlayer";

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search states
  const [selectedNiche, setSelectedNiche] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Details & Active work states
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<"creator" | "history" | "oracle" | "persona">("creator");

  // Trend Oracle Pro States
  const [oracleNiche, setOracleNiche] = useState<string>("beauty");
  const [oracleBudget, setOracleBudget] = useState<string>("Rp 100.000 - Rp 500.000");
  const [oraclePlatform, setOraclePlatform] = useState<string>("TikTok");
  const [isOracleLoading, setIsOracleLoading] = useState<boolean>(false);
  const [oracleOutput, setOracleOutput] = useState<string>("");
  const [oracleError, setOracleError] = useState<string | null>(null);

  // AI Persona Hub States
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>("bude_siska");
  const [personaTopic, setPersonaTopic] = useState<string>("script_video");
  const [personaMessage, setPersonaMessage] = useState<string>("");
  const [isPersonaLoading, setIsPersonaLoading] = useState<boolean>(false);
  const [personaChatHistory, setPersonaChatHistory] = useState<{ role: "user" | "model"; text: string }[]>([
    { role: "model", text: "Halo jeng! Bude Siska di sini siap bantu racunin dagangan kamu biar viral dapet cuan tumpah-tumpah! Mau dibikinin skrip video racun emak-emak apa hari ini? Bisikin dong produknya!" }
  ]);
  const [personaError, setPersonaError] = useState<string | null>(null);

  // AI Content Generator Form State
  const [contentType, setContentType] = useState<string>("Video Script (TikTok/Reels)");
  const [tone, setTone] = useState<string>("Energetic & Magnetic (FOMO)");
  const [targetAudience, setTargetAudience] = useState<string>("Gen-Z & Impulse Buyers");
  const [customKeywords, setCustomKeywords] = useState<string>("");
  const [includeDisclaimer, setIncludeDisclaimer] = useState<boolean>(true);
  const [customNotes, setCustomNotes] = useState<string>("");

  // Generation status
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedContent, setGeneratedContent] = useState<string>("");
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Premium 25s Realistic AI Video States
  const [premiumVideoMode, setPremiumVideoMode] = useState<boolean>(true); // active by default for premium features
  const [premiumVoiceCharacter, setPremiumVoiceCharacter] = useState<string>("Sarah (Beauty & Lifestyle)");
  const [premiumVideoEngine, setPremiumVideoEngine] = useState<string>("Kling 3 Pro");
  const [premiumVideoScenes, setPremiumVideoScenes] = useState<any[] | null>(null);
  const [premiumVideoCharacter, setPremiumVideoCharacter] = useState<any | null>(null);

  // Saved Campaign Lists
  const [savedCampaigns, setSavedCampaigns] = useState<SavedCampaign[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [successSavedToast, setSuccessSavedToast] = useState<boolean>(false);

  // ==========================================
  // MONETIZATION, CREDIT, & ADMIN STATES
  // ==========================================
  const [userId, setUserId] = useState<string>(() => {
    let stored = localStorage.getItem("affiliate_user_id");
    if (!stored) {
      stored = "USR-" + Math.floor(100000 + Math.random() * 900000);
      localStorage.setItem("affiliate_user_id", stored);
    }
    return stored;
  });
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem("affiliate_user_name") || "Member Afiliasi";
  });
  const [userPhone, setUserPhone] = useState<string>(() => {
    return localStorage.getItem("affiliate_user_phone") || "";
  });
  const [credits, setCredits] = useState<number>(5); // default / server-synced count

  // Dialog & Admin visibility
  const [showTopUpModal, setShowTopUpModal] = useState<boolean>(false);
  const [showAdminPanel, setShowAdminPanel] = useState<boolean>(false);
  const [adminPassword, setAdminPassword] = useState<string>("");
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);

  // Toast notifications
  const [toast, setToast] = useState<{message: string, type: 'success' | 'info' | 'error'} | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Payment Selection state
  const [selectedPackage, setSelectedPackage] = useState<any>({
    name: "Starter Package",
    creditsGained: 10,
    amount: 10000
  });

  // Admin Data states
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminTransactions, setAdminTransactions] = useState<any[]>([]);
  const [adminMessage, setAdminMessage] = useState<string | null>(null);
  const [adminLoading, setAdminLoading] = useState<boolean>(false);
  const [directCreditsUserId, setDirectCreditsUserId] = useState<string>("");
  const [directCreditsAmount, setDirectCreditsAmount] = useState<number>(10);

  const PRICING_PACKAGES = [
    { name: "Starter Package", creditsGained: 10, amount: 10000, desc: "Cocok untuk eksplorasi awal pembuatan skrip fomo." },
    { name: "Pro Marketing Pack", creditsGained: 50, amount: 45000, desc: "Rekomendasi Utama! Efektif bagi komisi masif bulanan.", popular: true },
    { name: "Mega Agency Pack", creditsGained: 150, amount: 100000, desc: "Bagi agensi pemasar multi-akun berskala masal." }
  ];

  // Sync User Credit Profile from express server matching local credentials
  const syncUserProfile = async () => {
    try {
      const url = `/api/user/profile?userId=${userId}&name=${encodeURIComponent(userName)}&phone=${encodeURIComponent(userPhone)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setCredits(data.user.credits);
        }
      }
    } catch (e) {
      console.error("Error syncing user profile:", e);
    }
  };

  useEffect(() => {
    syncUserProfile();

    // Setup quiet automatic syncing every 15s to check for admin manual confirmation approvals reactively
    const interval = setInterval(syncUserProfile, 15000);
    return () => clearInterval(interval);
  }, [userId, userName, userPhone]);

  const handleUpdateProfile = (name: string, phone: string) => {
    setUserName(name);
    setUserPhone(phone);
    localStorage.setItem("affiliate_user_name", name);
    localStorage.setItem("affiliate_user_phone", phone);
    // Submit straight to backend mapping
    fetch(`/api/user/profile?userId=${userId}&name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}`);
  };

  // Submit Top-Up Order to Backend & redirection forward to WA 088989727277
  const handleRequestTopup = async () => {
    if (!userName || userName === "Member Afiliasi" || userName.trim() === "") {
      alert("Harap masukkan Nama Lengkap Anda pada profil pembayaran agar terdeteksi.");
      return;
    }
    if (!userPhone.trim() || userPhone.length < 9) {
      alert("Harap masukkan Nomor WhatsApp Anda yang valid.");
      return;
    }

    try {
      const res = await fetch("/api/topup/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          userName,
          userPhone,
          packageName: `${selectedPackage.name} (${selectedPackage.creditsGained} Kredit)`,
          amount: selectedPackage.amount,
          creditsGained: selectedPackage.creditsGained
        })
      });

      if (!res.ok) throw new Error("Gagal mendaftarkan pesanan ke database.");
      const data = await res.json();
      const tx = data.transaction;

      // Construct elegant Indonesian Whatsapp transfer message for Gopay payment target 088989727277
      const textMessage = `Halo Admin, saya ingin melakukan konfirmasi pembayaran GoPay untuk Pembelian Kredit AI.

Berikut Data Transaksi Saya:
- ID Pengguna: *${userId}*
- Nama Lengkap: *${userName}*
- No WhatsApp: *${userPhone}*
- Paket Terpilih: *${selectedPackage.name} (${selectedPackage.creditsGained} Kredit)*
- Nominal Transfer: *Rp ${selectedPackage.amount.toLocaleString("id-ID")}*
- ID Transaksi: *${tx.id}*

Saya telah menransfer pembayaran GoPay ke nomor *088989727277*. Berikut saya lampirkan bukti transfer saya. Mohon konfirmasi kredit untuk akun saya!`;

      const targetWaUrl = `https://wa.me/6288989727277?text=${encodeURIComponent(textMessage)}`;
      window.open(targetWaUrl, "_blank");

      alert(`Pesanan Pembelian Kredit ${tx.id} Berhasil Didaftarkan!\nSilakan lakukan transfer GoPay ke 088989727277 lalu kirimkan bukti transfer Anda ke WhatsApp Admin agar kredit langsung disetujui.`);
      
      setShowTopUpModal(false);
      syncUserProfile();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  // Fetch admin control center metrics
  const fetchAdminData = async () => {
    setAdminLoading(true);
    setAdminMessage(null);
    try {
      const res = await fetch(`/api/admin/data?password=${adminPassword}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal masuk ke Panel Admin.");
      }
      setAdminUsers(data.users || []);
      setAdminTransactions(data.transactions || []);
      setIsAdminLoggedIn(true);
    } catch (err: any) {
      setAdminMessage(err.message);
    } finally {
      setAdminLoading(false);
    }
  };

  // Admin Approve Action straight from dashboard
  const handleApproveTransaction = async (txId: string) => {
    try {
      const res = await fetch("/api/admin/topup/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: txId, password: adminPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(data.message || "Transaksi berhasil disetujui, kredit ditambahkan!");
      fetchAdminData();
      syncUserProfile();
    } catch (err: any) {
      alert("Gagal menyetujui transaksi: " + err.message);
    }
  };

  // Admin Reject Action
  const handleRejectTransaction = async (txId: string) => {
    try {
      const res = await fetch("/api/admin/topup/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: txId, password: adminPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(data.message || "Transaksi telah ditolak.");
      fetchAdminData();
    } catch (err: any) {
      alert("Gagal menolak transaksi: " + err.message);
    }
  };

  // Admin Set Credits Directly
  const handleDirectSetCredits = async () => {
    if (!directCreditsUserId) {
      alert("Masukkan ID User target terlebih dahulu!");
      return;
    }
    try {
      const res = await fetch("/api/admin/user/set-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: directCreditsUserId,
          credits: directCreditsAmount,
          password: adminPassword
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(data.message || "Kredit user berhasil disesuaikan secara langsung!");
      fetchAdminData();
      syncUserProfile();
      setDirectCreditsUserId("");
    } catch (err: any) {
      alert("Gagal melakukan aksi manual: " + err.message);
    }
  };

  // Load trends initially
  const fetchTrends = async (nicheId: string = "all", searchVal: string = "") => {
    try {
      setLoading(true);
      setError(null);
      const url = `/api/trends?niche=${nicheId}&search=${encodeURIComponent(searchVal)}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Failed to contact the backend service.");
      }
      const data = await res.json();
      setProducts(data.items || []);
      
      // Auto-select first item if none is selected
      if (data.items && data.items.length > 0 && !selectedProduct) {
        setSelectedProduct(data.items[0]);
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch tending metrics from server. Ensure your backend server is loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends(selectedNiche, searchQuery);
  }, [selectedNiche]);

  // Load saved campaigns from localStorage on mount
  useEffect(() => {
    const listStr = localStorage.getItem("affiliate_saved_campaigns");
    if (listStr) {
      try {
        setSavedCampaigns(JSON.parse(listStr));
      } catch (e) {
        console.error("Error reading from localStorage:", e);
      }
    }
  }, []);

  // Force Scraper Simulation Crawl
  const triggerScrapeSim = async () => {
    try {
      setIsScraping(true);
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche: selectedNiche })
      });
      if (!res.ok) throw new Error("Scraper failed to respond.");
      
      const data = await res.json();
      
      // Fetch latest metrics
      await fetchTrends(selectedNiche, searchQuery);

      if (data.realTime) {
        setToast({
          message: `Berhasil menarik produk viral nyata secara real-time dari Google Search kueri "${selectedNiche}"!`,
          type: 'success'
        });
      } else {
        setToast({
          message: data.message || "Berhasil memperbarui statistik tren produk terhangat!",
          type: 'success'
        });
      }
    } catch (err: any) {
      console.error(err);
      setToast({
        message: "Gagal menarik data tren: " + err.message,
        type: 'error'
      });
    } finally {
      setIsScraping(false);
    }
  };

  const generateFallbackScenes = (text: string, prod: Product) => {
    const rawSentences = text.split(/[.!?\n]+/).map(s => s.trim()).filter(s => s.length > 5);
    const sentences = rawSentences.length > 0 ? rawSentences : [
      `Ada produk viral terbaru lho buat kamu! ${prod?.name || "Produk viral"} ini bener-bener keren banget dan lagi trend.`,
      `Banyak banget influencer yang lagi ngereview karena fungsinya emang se-revolusioner itu.`,
      `Gak heran sih kalau peminatnya membludak, kualitasnya emang terbukti premium.`,
      `Mumpung lagi ada promo spesial diskon terbatas untuk minggu ini aja.`,
      `Yuk langsung kepoin sekarang juga, klik link di bio ya sebelum kehabisan!`
    ];
    
    const charList = [
      { name: "Sarah", role: "Beauty & Lifestyle Enthusiast", gender: "female" },
      { name: "Rian", role: "Sleek Gadget Reviewer", gender: "male" },
      { name: "Ayu", role: "Organized Aesthetic Homemaker", gender: "female" },
      { name: "Budi", role: "Active Gadget Explorer", gender: "male" }
    ];
    
    // Select one based on name or randomize
    let chosenChar = charList[0];
    if (premiumVoiceCharacter.includes("Rian")) chosenChar = charList[1];
    else if (premiumVoiceCharacter.includes("Ayu")) chosenChar = charList[2];
    else if (premiumVoiceCharacter.includes("Budi")) chosenChar = charList[3];

    setPremiumVideoCharacter({
      name: chosenChar.name,
      role: chosenChar.role,
      avatarDescription: "A clean realistic portrait of a digital creator with studio micro background.",
      voicePitch: chosenChar.gender === "female" ? 1.15 : 0.9,
      voiceRate: 0.95,
      gender: chosenChar.gender
    });

    const scenes: any[] = [];
    for (let i = 0; i < 5; i++) {
      const line = sentences[i % sentences.length] || `Rekomendasi keren untuk hari ini!`;
      scenes.push({
        id: i + 1,
        timeRange: `${i * 5}s - ${(i + 1) * 5}s`,
        visualPrompt: `Stunning 4K realistic display of ${prod?.name || "the product"} showing detailed usage, cozy warm light.`,
        speech: line,
        subtitle: line,
        sfx: "[Lofi acoustic beat transition]"
      });
    }
    setPremiumVideoScenes(scenes);
  };

  // Trigger content generation
  const generateAIContent = async (prod: Product) => {
    if (!prod) return;
    setIsGenerating(true);
    setGenerationError(null);
    setGeneratedContent("");
    setPremiumVideoScenes(null);
    setPremiumVideoCharacter(null);
    setActiveWorkspaceTab("creator");

    try {
      const response = await fetch("/api/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId, // Pass current persistent user ID context to avoid anonymizing
          productName: prod.name,
          niche: prod.niche,
          description: prod.description,
          trendingReason: prod.trendingReason,
          priceRange: prod.priceRange,
          contentType,
          tone,
          targetAudience,
          includeAffiliateDisclaimer: includeDisclaimer,
          customKeywords,
          premiumVideoMode,
          premiumVoiceCharacter,
          premiumVideoEngine
        })
      });

      // Avoid "Unexpected token '<', '<!doctype'" by checking response status & parsing manually
      if (!response.ok) {
        const text = await response.text();
        let errorMsg = "An integration error has occurred.";
        try {
          const parsed = JSON.parse(text);
          errorMsg = parsed.error || errorMsg;
        } catch (_) {
          errorMsg = text || errorMsg;
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      
      if (premiumVideoMode) {
        try {
          // Clear prefix or clean json if model wraps in markdown backticks
          let cleanStr = data.content.trim();
          if (cleanStr.startsWith("```json")) {
            cleanStr = cleanStr.substring(7);
          }
          if (cleanStr.endsWith("```")) {
            cleanStr = cleanStr.substring(0, cleanStr.length - 3);
          }
          cleanStr = cleanStr.trim();
          
          const parsed = JSON.parse(cleanStr);
          if (parsed && parsed.scenes) {
            setPremiumVideoScenes(parsed.scenes);
            setPremiumVideoCharacter(parsed.character || {
              name: "Sarah",
              role: "Beauty & Lifestyle Specialist",
              gender: "female"
            });
            setGeneratedContent(parsed.overallScript || `[Voiceover script generated successfully. Please view the interactive video player below.]`);
          } else {
            // Unexpected parsed object structure
            setGeneratedContent(data.content);
            generateFallbackScenes(data.content, prod);
          }
        } catch (e) {
          console.error("Error parsing AI Video JSON:", e);
          setGeneratedContent(data.content);
          generateFallbackScenes(data.content, prod);
        }
      } else {
        setGeneratedContent(data.content);
      }
      
      // Sync remaining credits seamlessly
      if (data.creditsRemaining !== undefined) {
        setCredits(data.creditsRemaining);
      } else {
        syncUserProfile();
      }
    } catch (err: any) {
      console.error(err);
      setGenerationError(err?.message || "Ensure GEMINI_API_KEY is configured in Settings > Secrets menu.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Trigger Trend Oracle Prediction Run
  const runTrendOracleOnline = async () => {
    setIsOracleLoading(true);
    setOracleError(null);
    setOracleOutput("");

    try {
      const response = await fetch("/api/generate-trend-oracle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          niche: oracleNiche,
          budget: oracleBudget,
          platform: oraclePlatform
        })
      });

      if (!response.ok) {
        const text = await response.text();
        let errorMsg = "Gagal memproses prediksi trend.";
        try {
          const parsed = JSON.parse(text);
          errorMsg = parsed.error || errorMsg;
        } catch (_) {
          errorMsg = text || errorMsg;
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      setOracleOutput(data.content);

      if (data.creditsRemaining !== undefined) {
        setCredits(data.creditsRemaining);
      } else {
        syncUserProfile();
      }
    } catch (err: any) {
      console.error(err);
      setOracleError(err?.message || "Terjadi kesalahan koneksi saat memanggil model.");
    } finally {
      setIsOracleLoading(false);
    }
  };

  // Generate Persona Response
  const runPersonaDialogue = async () => {
    if (!personaMessage.trim()) return;
    if (credits <= 0) {
      setPersonaError("Kredit Anda habis! Silakan lakukan pembelian kredit terlebih dahulu.");
      return;
    }

    const currentMsg = personaMessage;
    // Optimistic user turn addition
    const userTurn = { role: "user" as const, text: currentMsg };
    setPersonaChatHistory((prev) => [...prev, userTurn]);
    setPersonaMessage("");
    setIsPersonaLoading(true);
    setPersonaError(null);

    try {
      // Send up to 6 last messages of the chat history
      const slicedHistory = personaChatHistory.slice(-6);

      const response = await fetch("/api/persona-hub/dialogue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          personaId: selectedPersonaId,
          message: currentMsg,
          topic: personaTopicText(),
          history: slicedHistory
        })
      });

      if (!response.ok) {
        const text = await response.text();
        let errorMsg = "Gagal memproses obrolan persona.";
        try {
          const parsed = JSON.parse(text);
          errorMsg = parsed.error || errorMsg;
        } catch (_) {
          errorMsg = text || errorMsg;
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      setPersonaChatHistory((prev) => [
        ...prev,
        { role: "model", text: data.content }
      ]);

      if (data.creditsRemaining !== undefined) {
        setCredits(data.creditsRemaining);
      } else {
        syncUserProfile();
      }
    } catch (err: any) {
      console.error(err);
      setPersonaError(err?.message || "Koneksi terganggu. Silakan coba kirim ulang.");
    } finally {
      setIsPersonaLoading(false);
    }
  };

  const personaTopicText = () => {
    switch (personaTopic) {
      case "script_video": return "Skrip Video TikTok/Reels Viral";
      case "copywriting_fomo": return "Copywriting FOMO Emosional";
      case "slogan_hipnotis": return "Slogan & Tagline Hipnotis";
      case "strategi_live": return "Strategi Live Streaming Interaktif";
      case "balas_komentar": return "Membalas Komentar Keberatan Pembeli";
      default: return "Strategi Copywriting & Pemasaran Kreatif";
    }
  };

  // Switch Welcome message on Persona change
  useEffect(() => {
    let welcomeText = "";
    switch (selectedPersonaId) {
      case "bude_siska":
        welcomeText = "Halo jeng! Bude Siska di sini siap bantu racunin dagangan kamu biar viral dapet cuan tumpah-tumpah! Mau dibikinin skrip video racun emak-emak apa hari ini? Bisikin dong produknya!";
        break;
      case "kak_farel":
        welcomeText = "Yo, halo semuanya. Farel di sini. Lu mau dapet ulasan tech atau video script unboxing yang super jujur, minim gimmick, tapi konversi penjualannya tinggi? Kasih tau nama produk & spek kasarnya, langsung kita breakdown tuntas.";
        break;
      case "ci_michelle":
        welcomeText = "Hi everyone! Ci Michelle di sini, seneng banget bisa bantu kalian dapet resep glowing luar dalam buat jualan skincare/beauty. Mau didesain skrip aesthetic racun glow up buat target cewek-cewek hits? Kasih tahu detail produknya ya!";
        break;
      case "mas_jaka":
        welcomeText = "Halo Bro, Mas Jaka di sini. Siap bantu kamu bedah kelebihan produk otomotif atau perkakas unik dengan bahasa praktis biar cowok-cowok makin demen. Apa nih barang yang mau kita bikin laris manis? Sebutin aja!";
        break;
      case "coach_rio":
        welcomeText = "SALAM DIGITAL MARKETING INDONESIA! Coach Rio di sini! Siap BONGKAR emosi pembeli Anda dengan teknik copywriting hipnotis tak tertolak! Tulis nama produk Anda sekarang, kita racik HOOK mematikan di awal detik!";
        break;
      case "sasa":
        welcomeText = "Haii bestie! Sasa di sini, literally super excited buat nemu angle ngetren paling aesthetic & viral buat produk gemes kamu biar FYP parah di TikTok! Kasihan kan kalau produk se-gokil ini gak viral. Spill produknya dong!";
        break;
      default:
        welcomeText = "Halo! Silakan pilih salah satu asisten persona kami di atas untuk merancang materi promosi Anda secara taktis.";
    }

    setPersonaChatHistory([
      { role: "model", text: welcomeText }
    ]);
    setPersonaError(null);
  }, [selectedPersonaId]);


  // Save generated campaign
  const handleSaveCampaign = () => {
    if (!selectedProduct || !generatedContent) return;

    const newCampaign: SavedCampaign = {
      id: "camp_" + Date.now(),
      productName: selectedProduct.name,
      productId: selectedProduct.id,
      niche: selectedProduct.niche,
      contentType,
      tone,
      targetAudience,
      generatedContent,
      affiliateUrl: `https://tiktok.com/shop/checkout?product=${selectedProduct.id}&ref=yourID`,
      savedAt: new Date().toLocaleDateString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        day: "numeric",
        month: "short",
        year: "numeric"
      }),
      customNotes: customNotes
    };

    const updated = [newCampaign, ...savedCampaigns];
    setSavedCampaigns(updated);
    localStorage.setItem("affiliate_saved_campaigns", JSON.stringify(updated));
    setCustomNotes("");
    
    // Toast alert
    setSuccessSavedToast(true);
    setTimeout(() => setSuccessSavedToast(false), 3000);
  };

  // Delete saved campaign
  const handleDeleteCampaign = (id: string) => {
    const updated = savedCampaigns.filter(c => c.id !== id);
    setSavedCampaigns(updated);
    localStorage.setItem("affiliate_saved_campaigns", JSON.stringify(updated));
  };

  // Copy text to clipboard helper
  const handleCopyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  // Search input handler
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTrends(selectedNiche, searchQuery);
  };

  // Quick preset filler
  const handleSelectProduct = (prod: Product) => {
    setSelectedProduct(prod);
    setGeneratedContent("");
    setGenerationError(null);
  };

  return (
    <div id="full-app-root" className="min-h-screen bg-slate-100 text-slate-900 selection:bg-emerald-500 selection:text-slate-950 font-sans antialiased pb-12">
      {/* Toast Notification Container */}
      <div className="fixed top-5 right-5 z-[100] max-w-sm w-full space-y-3 pointer-events-none">
        <AnimatePresence>
          {toast && (
            <Suspense fallback={null}>
              <MotionDiv
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="pointer-events-auto bg-white border-2 border-slate-900 rounded-2xl p-4 shadow-xl flex items-start gap-3 relative overflow-hidden"
              >
                {/* Highlight strip based on type */}
                <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${
                  toast.type === 'success' ? 'bg-emerald-500' : toast.type === 'error' ? 'bg-rose-500' : 'bg-amber-500'
                }`} />
                
                <div className={`p-1.5 rounded-lg ${
                  toast.type === 'success' ? 'bg-emerald-50' : toast.type === 'error' ? 'bg-rose-50' : 'bg-amber-50'
                }`}>
                  {toast.type === 'success' ? (
                    <Check className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-rose-600" />
                  )}
                </div>
                
                <div className="flex-1 pr-6">
                  <p className="text-xs font-black uppercase font-mono tracking-wider text-slate-800">
                    {toast.type === 'success' ? 'Pemberitahuan' : 'Ada Masalah'}
                  </p>
                  <p className="text-xs text-slate-600 font-bold mt-1 leading-relaxed">
                    {toast.message}
                  </p>
                </div>

                <button
                  onClick={() => setToast(null)}
                  className="absolute top-3 right-3 text-slate-400 hover:text-slate-900 text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </MotionDiv>
            </Suspense>
          )}
        </AnimatePresence>
      </div>

      {/* Sleek Top Glow */}
      <div className="absolute top-0 left-1/4 right-1/4 h-[350px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* 1. TOP UP / BELI KREDIT MODAL Overlay */}
      {showTopUpModal && (
        <div id="topup-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-fadeIn">
          <div id="topup-modal-card" className="bg-white border-2 border-slate-300 rounded-3xl p-7 max-w-lg w-full space-y-5 relative shadow-2xl text-slate-800">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Coins className="text-emerald-600 animate-pulse stroke-[2.5]" size={22} />
                  Top Up Kredit AI Pemasaran
                </h3>
                <p className="text-xs text-slate-600 font-bold mt-1.5">
                  Pesan instan kredit pembuatan skrip. Pembayaran otomatis diverifikasi admin.
                </p>
              </div>
              <button 
                onClick={() => setShowTopUpModal(false)}
                className="p-1 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-sm font-bold rounded-lg text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Profile fields segment */}
            <div className="p-4 bg-slate-50 rounded-2xl border-2 border-slate-200 space-y-3">
              <h4 className="text-xs font-mono text-slate-600 uppercase tracking-wider font-black">INFO AKUN AFILIATOR (WAJIB DIISI)</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-700 font-bold block mb-1">Nama Lengkap (Identitas Transfer)</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => handleUpdateProfile(e.target.value, userPhone)}
                    placeholder="Contoh: Andi Saputra"
                    className="w-full bg-white border-2 border-slate-300 rounded-xl p-2.5 text-xs text-slate-905 font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-700 font-bold block mb-1">No. WhatsApp Aktif</label>
                  <input
                    type="text"
                    value={userPhone}
                    onChange={(e) => handleUpdateProfile(userName, e.target.value)}
                    placeholder="Contoh: 0812345678"
                    className="w-full bg-white border-2 border-slate-300 rounded-xl p-2.5 text-xs text-slate-905 font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-600 font-mono font-black text-center">User ID Anda: {userId}</p>
            </div>

            {/* Package selector */}
            <div className="space-y-2">
              <label className="text-sm text-slate-800 block font-black">Pilih Paket Kredit:</label>
              <div className="grid grid-cols-1 gap-2.5">
                {PRICING_PACKAGES.map((pkg) => (
                  <div
                    key={pkg.name}
                    onClick={() => setSelectedPackage(pkg)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden flex items-center justify-between
                      ${selectedPackage.name === pkg.name
                        ? "bg-emerald-50 text-slate-950 border-emerald-500 shadow-md"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }
                    `}
                  >
                    {pkg.popular && (
                      <div className="absolute top-0 right-0 bg-gradient-to-l from-emerald-600 to-teal-600 text-white font-black font-mono text-[9px] py-1 px-3 rounded-bl-lg uppercase">
                        Terpopuler
                      </div>
                    )}
                    <div className="space-y-1 pr-6">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black text-slate-900">{pkg.name}</span>
                        <span className="text-xs font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-lg font-black">
                          +{pkg.creditsGained} Kredit
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-bold leading-normal">{pkg.desc}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-base font-black text-emerald-700 block">Rp {pkg.amount.toLocaleString("id-ID")}</span>
                      <span className="text-xs text-slate-500 font-black font-mono block">Instan / GoPay</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live payment instruction banner */}
            <div className="p-4 bg-emerald-50 rounded-2xl border-2 border-emerald-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-emerald-800 uppercase tracking-wider">
                <Smartphone size={15} className="stroke-[2.5]" />
                <span>Metode Pembayaran GoPay</span>
              </div>
              <p className="text-xs text-slate-800 font-bold leading-relaxed">
                Silakan transfer sebesar <strong className="text-slate-950 font-black">Rp {selectedPackage.amount.toLocaleString("id-ID")}</strong> ke nomor GoPay: <strong className="text-emerald-700 font-mono font-black text-sm">088989727277</strong> atas nama <span className="underline font-bold">Affiliate Admin</span>.
              </p>
            </div>

            {/* Checkouts call action button */}
            <button
              onClick={handleRequestTopup}
              className="w-full bg-slate-900 hover:bg-slate-850 text-white py-3 px-4 rounded-2xl text-xs font-bold font-sans tracking-wide transition-all shadow-md active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
            >
              <MessageSquare size={14} className="stroke-[2.5]" />
              Lanjut Bayar & Konfirmasi via WhatsApp
            </button>
          </div>
        </div>
      )}      {/* Header bar */}
      <header id="main-navigation" className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b-2 border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col xl:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div id="brand-logo" className="h-11 w-11 bg-gradient-to-tr from-emerald-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/15">
              <TrendingUp className="text-slate-950 font-black" size={24} strokeWidth={3} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 tracking-tight font-sans">
                  TRENDING AFFILIATE ENGINE
                </h1>
                <span className="text-[10px] font-mono font-black bg-emerald-100 text-emerald-800 border-2 border-emerald-200 px-1.5 py-0.5 rounded uppercase">
                  v2.5 Live
                </span>
              </div>
              <p className="text-xs text-slate-600 font-bold font-sans mt-0.5">
                AI-Powered Viral Shopee/TikTok Product Catcher & Copywriter
              </p>
            </div>
          </div>

          {/* Dynamic Credit Tracker Balance Hub */}
          <div id="status-panel-indicator" className="flex flex-wrap items-center justify-center gap-3 text-xs bg-slate-50 p-2 rounded-2xl border-2 border-slate-200">
            {/* User Profile Sync section */}
            <div className="flex items-center gap-2 px-1 text-xs text-slate-800 font-bold">
              <User size={14} className="text-emerald-700 stroke-[2.5]" />
              <span className="font-sans font-black text-slate-900 max-w-[120px] truncate">{userName}</span>
              <span className="text-[10px] font-mono font-bold text-slate-500">({userId})</span>
            </div>

            <div className="h-4 w-px bg-slate-300 hidden sm:block"></div>

            {/* Credit Hub balance coin dynamic display */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-200 shadow-xs">
              <Coins size={14} className="text-emerald-700 shrink-0 stroke-[2.5]" />
              <span className="font-mono font-black text-emerald-800">{credits} Kredit</span>
            </div>

            {/* Quick Top Up key call-to-action button */}
            <button
              onClick={() => setShowTopUpModal(true)}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 font-black font-sans text-white text-xs rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1 shadow-sm"
            >
              <Coins size={12} strokeWidth={3} className="text-white font-bold" />
              Top Up
            </button>

            <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>

            {/* Admin trigger button with 290916 password target */}
            <button
              onClick={() => {
                setShowAdminPanel(!showAdminPanel);
                if (!showAdminPanel && isAdminLoggedIn) {
                  fetchAdminData();
                }
              }}
              className={`px-3 py-1.5 text-xs font-mono font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer border-2
                ${showAdminPanel || isAdminLoggedIn
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                  : "bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }
              `}
            >
              <Lock size={12} className="stroke-[2.5]" />
              Admin Panel
            </button>
          </div>
        </div>
      </header>

      {/* Main page container */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 mt-6">        {/* 2. ADMIN PANEL OVERLAP / OVERRIDE BLOCK SENSITIVE SECTION */}
        {showAdminPanel && (
          <div id="admin-panel-segment-parent" className="bg-white border-2 border-indigo-200 rounded-3xl p-6 mb-8 space-y-6 animate-fadeIn relative overflow-hidden shadow-lg text-slate-900">
            <div className="absolute top-0 right-0 h-20 w-20 bg-indigo-500/5 rounded-full blur-xl pointer-events-none"></div>

            <div className="flex justify-between items-center border-b-2 border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-indigo-600 animate-pulse stroke-[2.5]" size={20} />
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">KONTROL PORTAL ADMIN (PASS: 290916)</h3>
                  <p className="text-xs text-slate-600 font-mono font-bold">Panel Persetujuan Kredit Gopay & WhatsApp v2.5</p>
                </div>
              </div>
              
              <button
                onClick={() => setShowAdminPanel(false)}
                className="p-1 px-3 bg-slate-100 hover:bg-slate-250 border border-slate-205 text-xs font-black rounded-lg text-slate-700 hover:text-slate-900 transition-all cursor-pointer"
              >
                ✕ Tutup Panel
              </button>
            </div>

            {!isAdminLoggedIn ? (
              <div className="max-w-md mx-auto py-6 space-y-4">
                <div className="space-y-1.5 text-center">
                  <span className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl inline-block mb-1">
                    <Lock size={18} className="stroke-[2.5]" />
                  </span>
                  <p className="text-xs font-black text-slate-900">Autentikasi Diperlukan</p>
                  <p className="text-xs text-slate-600 font-bold">Masukkan kata sandi admin untuk mengelola kredit & transaksi penyerahan.</p>
                </div>

                <div className="flex gap-2">
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Masukkan sandi admin (e.g. 290916)"
                    className="flex-1 bg-white border-2 border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-mono text-center font-black"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') fetchAdminData();
                    }}
                  />
                  <button
                    onClick={fetchAdminData}
                    disabled={adminLoading}
                    className="px-5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition-all select-none flex items-center justify-center cursor-pointer shadow-sm"
                  >
                    {adminLoading ? "Logging..." : "Masuk"}
                  </button>
                </div>

                {adminMessage && (
                  <p className="text-xs text-red-650 text-center font-mono font-bold bg-red-50 p-2.5 rounded-xl border border-red-200">
                    {adminMessage}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Manual Credit Grantor Section */}
                <div className="bg-slate-50 p-5 rounded-2xl border-2 border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  <div className="md:col-span-4 max-w-sm">
                    <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <Coins size={14} className="text-emerald-600 stroke-[2.5]" />
                      Suntik / Atur Kredit Langsung
                    </h4>
                    <p className="text-[11px] text-slate-600 font-bold mt-0.5">Suntikkan langsung koin ke user ID pemasar.</p>
                  </div>
                  <div className="md:col-span-3">
                    <input
                      type="text"
                      value={directCreditsUserId}
                      onChange={(e) => setDirectCreditsUserId(e.target.value)}
                      placeholder="User ID Target (Contoh: USR-1234)"
                      className="w-full bg-white border-2 border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-mono font-black animate-none"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <input
                      type="number"
                      value={directCreditsAmount}
                      onChange={(e) => setDirectCreditsAmount(Number(e.target.value))}
                      placeholder="Jumlah Saldo Kredit Baru"
                      className="w-full bg-white border-2 border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-mono font-black"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <button
                      onClick={handleDirectSetCredits}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl transition-all cursor-pointer shadow-sm"
                    >
                      Konfirmasi Saldo
                    </button>
                  </div>
                </div>

                {/* Grid 2 Columns for Transaction queue & User Registry */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* 1. Transaction Ledger (Spans 8 Columns) */}
                  <div className="lg:col-span-8 space-y-3">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[11px] font-mono text-indigo-700 uppercase font-bold tracking-wider">
                        📋 DAFTAR PERMINTAAN TOP-UP GOPAY MASUK ({adminTransactions.length})
                      </span>
                      <button
                        onClick={fetchAdminData}
                        className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 uppercase transition-colors font-bold"
                      >
                        <RefreshCw size={11} /> Perbarui Transaksi
                      </button>
                    </div>

                    <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden max-h-72 overflow-y-auto">
                      {adminTransactions.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-xs font-mono font-bold">
                          Tidak ada transaksi top-up yang terdaftar.
                        </div>
                      ) : (
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-slate-600 font-mono text-[11px] border-b-2 border-slate-200">
                              <th className="p-3 font-black">ID & Paket</th>
                              <th className="p-3 font-black">Identitas User</th>
                              <th className="p-3 text-right font-black">Nominal</th>
                              <th className="p-3 text-center font-black">Aksi Konfirmasi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-150 text-xs text-slate-800">
                            {adminTransactions.map((tx) => (
                              <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                                <td className="p-3">
                                  <div className="font-mono text-indigo-700 font-extrabold">{tx.id}</div>
                                  <div className="text-[11px] text-slate-800 font-black mt-0.5">{tx.packageName}</div>
                                  <span className="text-[10px] text-slate-500 block mt-0.5 font-semibold">{new Date(tx.createdAt).toLocaleDateString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
                                </td>
                                <td className="p-3">
                                  <div className="font-black text-slate-950">{tx.userName}</div>
                                  <div className="text-[11px] text-slate-605 font-mono font-bold mt-0.5">{tx.userPhone}</div>
                                  <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 mt-1 inline-block font-bold">ID: {tx.userId}</span>
                                </td>
                                <td className="p-3 text-right font-mono font-black text-emerald-700 text-sm">
                                  Rp {tx.amount.toLocaleString("id-ID")}
                                </td>
                                <td className="p-3 text-center">
                                  {tx.status === "PENDING" ? (
                                    <div className="flex gap-1.5 justify-center">
                                      <button
                                        onClick={() => handleApproveTransaction(tx.id)}
                                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-550 text-white font-black text-xs rounded-lg transition-all cursor-pointer shadow"
                                        title="Setujui transaksi dan tambahkan kredit otomatis ke user"
                                      >
                                        Setuju ✔
                                      </button>
                                      <button
                                        onClick={() => handleRejectTransaction(tx.id)}
                                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-red-650 text-xs border border-red-200 rounded-lg transition-all cursor-pointer font-bold"
                                        title="Tolak Transaksi"
                                      >
                                        Tolak
                                      </button>
                                    </div>
                                  ) : (
                                    <span className={`px-2 py-1 text-[10px] font-mono font-black rounded border-2 uppercase
                                      ${tx.status === "APPROVED"
                                        ? "bg-emerald-50 text-emerald-800 border-emerald-250 animate-none"
                                        : "bg-red-50 text-red-700 border-red-250"
                                      }
                                    `}>
                                      {tx.status}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>

                  {/* 2. Registered Users (Spans 4 Columns) */}
                  <div className="lg:col-span-4 space-y-3">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[11px] font-mono text-indigo-700 uppercase font-bold tracking-wider">
                        👥 REKOR USER LIST ({adminUsers.length})
                      </span>
                    </div>

                    <div className="bg-white rounded-2xl border-2 border-slate-200 p-4 max-h-72 overflow-y-auto divide-y divide-slate-100 space-y-3">
                      {adminUsers.map((usr) => (
                        <div key={usr.id} className="pt-2 flex justify-between items-center text-xs">
                          <div>
                            <div className="font-extrabold text-slate-900">{usr.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">ID: {usr.id}</div>
                            <div className="text-[10px] text-slate-505 font-mono mt-0.5">{usr.phone}</div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-mono font-black text-emerald-700 block">{usr.credits} Kredit</span>
                            <button
                              onClick={() => {
                                setDirectCreditsUserId(usr.id);
                                setDirectCreditsAmount(usr.credits);
                              }}
                              className="text-xs font-mono text-indigo-700 hover:text-indigo-900 font-black underline block mt-1 cursor-pointer"
                            >
                              Edit Kredit
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-indigo-50 text-indigo-900 font-sans text-xs font-bold rounded-xl border border-indigo-200 flex items-start gap-2">
                  <AlertCircle size={15} className="shrink-0 mt-0.5 text-indigo-700 stroke-[2.5]" />
                  <span>Tips Admin: Klik tombol "Edit Kredit" pada baris database user atau masukkan ID manual untuk memberikan trial koin tambahan atau bonus secara instan.</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Indonesian Banner Announcement */}
        <div id="indo-intro-banner" className="bg-gradient-to-r from-indigo-50 to-emerald-50/50 p-6 rounded-3xl border-2 border-indigo-100 mb-8 flex items-start gap-4 relative overflow-hidden shadow-xs">
          <div className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl">
            <Sparkles size={20} className="stroke-[2.5]" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-black text-slate-900 leading-normal">
              Selamat Datang di Portal Afiliasi Cerdas Anda!
            </h2>
            <p className="text-xs text-slate-700 font-bold mt-2 leading-relaxed">
              Temukan produk dengan rasio keterlibatan (engagement) tertinggi yang ditarik otomatis oleh sistem pengklasifikasi kami. Estimasi pendapatan komisi Anda langsung melalui kalkulator diagnostik, rancang skrip pemasaran AI persuasif dengan satu tombol, serta ikuti panduan deployment penuh pada tab di sebelah kanan.
            </p>
          </div>
          <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-[0.04] pointer-events-none hidden md:block">
            <BookOpen size={110} className="text-slate-900" />
          </div>
        </div>

        {/* Aggregated view stats */}
        <MetricCards 
          products={products} 
          onTriggerScrape={triggerScrapeSim} 
          isScraping={isScraping} 
        />

        {/* Dynamic Filters Bar */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-5">
          {/* Niche Categories */}
          <NicheFilter 
            selectedNiche={selectedNiche} 
            onSelectNiche={setSelectedNiche} 
            products={products} 
          />

          {/* Real Search form */}
          <form id="search-filter-form" onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1 md:w-64">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
                <Search size={14} className="stroke-[2.5]" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products or seo keywords..."
                className="w-full pl-9 pr-4 py-2.5 text-xs bg-white border-2 border-slate-205 rounded-xl focus:border-emerald-500 focus:outline-none placeholder:text-slate-400 text-slate-900 font-bold transition-colors"
              />
            </div>
            <button
              id="btn-search-execute"
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-xs font-black text-white rounded-xl hover:scale-[1.02] transition-all cursor-pointer"
            >
              Apply Filter
            </button>
            {(searchQuery || selectedNiche !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedNiche("all");
                  fetchTrends("all", "");
                }}
                className="bg-white hover:bg-slate-100 p-2.5 text-slate-600 rounded-xl border-2 border-slate-200 hover:text-slate-900"
                title="Reset active filter"
              >
                <RefreshCw size={13} />
              </button>
            )}
          </form>
        </div>

        {/* Core Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: Products Stream List (Spans 7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-bold font-mono tracking-wider text-slate-400 uppercase flex items-center gap-2">
                <span>🔴 Top 5 Viral Trends</span>
                <span className="text-[10px] bg-red-400/10 text-red-400 font-bold px-1.5 py-0.5 rounded">
                  Live Sorted
                </span>
              </span>
              <span className="text-xs text-slate-500 font-sans">
                Capped at 5 trends max
              </span>
            </div>

            {loading ? (
              <div id="loading-spinner-state" className="flex flex-col items-center justify-center py-20 border border-slate-900 bg-slate-900/10 rounded-2xl">
                <div className="h-8 w-8 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-xs text-slate-400 font-mono">Querying live metrics from automated crawler...</p>
              </div>
            ) : error ? (
              <div id="error-screen-state" className="p-8 border border-red-500/20 bg-red-500/5 text-center rounded-2xl flex flex-col items-center justify-center">
                <AlertCircle className="text-red-500 mb-3" size={32} />
                <p className="text-sm font-semibold text-white">Metrics Server Unavailable</p>
                <p className="text-xs text-slate-400 max-w-sm mt-1">{error}</p>
                <button 
                  onClick={() => fetchTrends(selectedNiche, searchQuery)} 
                  className="mt-4 px-4 py-1.5 bg-slate-900 border border-red-500/20 text-xs text-slate-300 rounded-lg hover:text-white"
                >
                  Reload Connector
                </button>
              </div>
            ) : products.length === 0 ? (
              <div id="empty-screen-state" className="p-16 border border-slate-900 bg-slate-900/10 text-center rounded-2xl">
                <Search className="text-slate-700 mx-auto mb-3" size={36} />
                <p className="text-sm text-slate-400">No matching trending products found.</p>
                <p className="text-xs text-slate-600 mt-1">Try resetting filters to show full catalog.</p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedNiche("all");
                    fetchTrends("all", "");
                  }}
                  className="mt-4 px-4 py-1.5 bg-slate-900 border border-slate-800 text-xs text-slate-400 rounded-lg hover:text-white"
                >
                  Reset Search
                </button>
              </div>
            ) : (
              <div id="product-stream" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onSelectProduct={handleSelectProduct}
                    onGenerateAI={(prod) => {
                      setSelectedProduct(prod);
                      generateAIContent(prod);
                    }}
                  />
                ))}
              </div>
            )}

            {/* In-Depth Selected Metrics Details Display */}
            {selectedProduct && (
              <div id="selected-diagnostics-wrapper" className="mt-6">
                <ProductDetails 
                  product={selectedProduct} 
                  onClose={() => setSelectedProduct(null)} 
                  onGenerateAI={(prod) => {
                    setSelectedProduct(prod);
                    generateAIContent(prod);
                  }}
                />
              </div>
            )}
          </div>

          {/* RIGHT: AI Creator Studio Workspace (Spans 5 cols) */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Workspace Tab Header */}
            <div id="workspace-tabs" className="bg-slate-150 border-2 border-slate-200 rounded-2xl p-1 flex flex-wrap lg:flex-nowrap gap-1">
              <button
                id="tab-creator-studio"
                onClick={() => setActiveWorkspaceTab("creator")}
                className={`flex-1 py-2 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer min-w-[100px]
                  ${activeWorkspaceTab === "creator"
                    ? "bg-white text-emerald-800 shadow border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                  }
                `}
              >
                <Sparkles size={13} className={activeWorkspaceTab === "creator" ? "animate-spin text-emerald-600" : ""} />
                Creator Studio
              </button>

              <button
                id="tab-scripts-history"
                onClick={() => setActiveWorkspaceTab("history")}
                className={`flex-1 py-2 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer relative min-w-[110px]
                  ${activeWorkspaceTab === "history"
                    ? "bg-white text-emerald-800 shadow border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                  }
                `}
              >
                <History size={13} />
                Campaign Vault
                {savedCampaigns.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 rounded-full bg-emerald-600 text-white text-[9px] font-mono font-black flex items-center justify-center border border-white">
                    {savedCampaigns.length}
                  </span>
                )}
              </button>

              <button
                id="tab-trend-oracle"
                onClick={() => setActiveWorkspaceTab("oracle")}
                className={`flex-1 py-2 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer relative overflow-hidden min-w-[100px]
                  ${activeWorkspaceTab === "oracle"
                    ? "bg-indigo-900 text-white shadow border border-indigo-950"
                    : "text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50"
                  }
                `}
              >
                <span className="absolute top-0 right-0 bg-amber-500 text-[8px] text-white font-black px-1 leading-3 rounded-bl">PRO</span>
                <TrendingUp size={13} className={activeWorkspaceTab === "oracle" ? "animate-bounce text-amber-300" : "text-indigo-600"} />
                Trend Oracle
              </button>

              <button
                id="tab-persona-hub"
                onClick={() => setActiveWorkspaceTab("persona")}
                className={`flex-1 py-2 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer relative overflow-hidden min-w-[100px]
                  ${activeWorkspaceTab === "persona"
                    ? "bg-indigo-600 text-white shadow border border-indigo-700"
                    : "text-indigo-800 hover:text-indigo-900 hover:bg-indigo-50"
                  }
                `}
              >
                <span className="absolute top-0 right-0 bg-indigo-500 text-[8px] text-white font-black px-1 leading-3 rounded-bl">HUB</span>
                <User size={13} className={activeWorkspaceTab === "persona" ? "animate-pulse text-amber-300" : "text-indigo-500"} />
                Persona Hub
              </button>
            </div>

            {/* TAB CONTENT: 1. CREATOR STUDIO */}
            {activeWorkspaceTab === "creator" && (
              <div id="creator-workspace-content" className="bg-white border-2 border-slate-250 rounded-2xl p-5 space-y-5 text-slate-800">
                
                {selectedProduct ? (
                  <>
                    {/* Active product display */}
                    <div className="bg-slate-50 p-4 rounded-xl border-2 border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-black font-mono text-slate-500 block uppercase tracking-wider">SELECTED CAMPAIGN ANCHOR</span>
                        <h4 className="text-slate-900 font-black text-sm mt-1">{selectedProduct.name}</h4>
                        <span className="text-[11px] text-slate-600 font-bold block mt-1 italic">Niche: {selectedProduct.niche} | Comm: {selectedProduct.estCommission}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black font-mono text-emerald-700 block bg-emerald-150 px-2 py-0.5 rounded border border-emerald-250">{selectedProduct.viralScore}/100</span>
                        <span className="text-[9px] text-slate-500 block uppercase mt-0.5 font-black font-mono">VIRAL</span>
                      </div>
                    </div>

                    {/* Generator tuning sliders */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 flex-wrap gap-2">
                        <h5 className="text-[11px] font-mono text-slate-500 uppercase tracking-widest font-black">AI Generation Parameters</h5>
                        
                        {/* Premium Mode Toggle Badge */}
                        <button
                          onClick={() => setPremiumVideoMode(!premiumVideoMode)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-mono font-black tracking-wider uppercase transition-all flex items-center gap-1 cursor-pointer
                            ${premiumVideoMode 
                              ? "bg-amber-400 text-slate-950 border-2 border-amber-500 shadow-sm animate-pulse" 
                              : "bg-slate-100 text-slate-500 border border-slate-300 hover:text-slate-705"
                            }
                          `}
                        >
                          <Sparkles size={11} className={premiumVideoMode ? "fill-slate-950 animate-pulse text-slate-950" : "text-slate-500"} />
                          {premiumVideoMode ? "Mode Premium AKTIF" : "Mode Standar"}
                        </button>
                      </div>

                      {/* Premium AI Video Narrator Selectors */}
                      {premiumVideoMode && (
                        <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100/30 border-2 border-amber-200 rounded-2xl space-y-3.5 overflow-hidden animate-fadeIn">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black font-mono text-amber-900">⭐ CONFIG GENERATOR VIDEO 25s</span>
                            <span className="text-[9px] font-mono bg-amber-200 text-amber-900 px-2 py-0.5 rounded border border-amber-300 uppercase font-black">REALISTIK VO</span>
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-[11px] text-slate-705 block font-bold font-sans">Karakter & Pengisi Suara (Voice Cover):</label>
                            <select
                              value={premiumVoiceCharacter}
                              onChange={(e) => setPremiumVoiceCharacter(e.target.value)}
                              className="w-full bg-white border-2 border-amber-200 text-xs rounded-xl p-2.5 text-slate-800 font-bold focus:outline-none focus:border-amber-500"
                            >
                              <option value="Sarah (Beauty & Lifestyle)">Sarah - Beauty & Lifestyle Host (Female, Warm & Natural)</option>
                              <option value="Rian (Sleek Tech Reviewer)">Rian - Tech Enthusiast & Gadget Reviewer (Male, Fast & Professional)</option>
                              <option value="Ayu (Cozy Home Organizer)">Ayu - Lifestyle & Kitchen Organizer (Female, Energetic & Direct)</option>
                              <option value="Budi (Active Gadget Explorer)">Budi - Consumer Shopping Guide (Male, Convincing & Realistic)</option>
                            </select>
                          </div>

                          {/* Interactive "Alat Ajaib" Multi-AI Selector Grid corresponding to user's screenshot */}
                          <div className="space-y-1.5 pt-1">
                            <div className="flex items-center justify-between">
                              <label className="text-[11px] text-slate-700 font-black font-sans flex items-center gap-1">
                                <span>🔮 Pilih Engine AI ("Alat Ajaib"):</span>
                              </label>
                              <span className="text-[10px] font-mono text-amber-900 font-bold bg-amber-200/80 px-2 py-0.5 rounded border border-amber-300">
                                {premiumVideoEngine}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-1 bg-white p-2 rounded-xl border-2 border-amber-200">
                              {[
                                { id: "Kling 3 Pro", name: "👑 Kling 3 Pro/Std" },
                                { id: "K3 Omni Pro", name: "🔮 K3 Omni Pro/Std" },
                                { id: "K3 MC Pro", name: "🕹️ K3 MC Pro/Std" },
                                { id: "Kling 3 SE", name: "🎬 Kling 3 SE Std" },
                                { id: "Kling 01 Pro", name: "🧠 Kling 01 Pro" },
                                { id: "Kling 2.5 Pro", name: "⚡ Kling 2.5 Pro" },
                                { id: "Kling 2.1 SE", name: "⭐ Kling 2.1 SE" },
                                { id: "Seedance 2.0", name: "✨ Seedance 2.0" },
                                { id: "Seedance 1.5", name: "🌱 Seedance 1.5 Pro" },
                                { id: "WAN 2.6 I2V", name: "🌊 WAN 2.6 I2V" },
                                { id: "WAN 2.6 T2V", name: "📝 WAN 2.6 T2V" },
                                { id: "WAN 2.5", name: "🌀 WAN 2.5" },
                                { id: "WAN 2.7", name: "⛵ WAN 2.7" },
                                { id: "Veo 3.1", name: "🌐 Veo 3.1" },
                                { id: "Veo 3.1 T2V", name: "🌅 Veo 3.1 T2V" },
                                { id: "Veo 3.1 Ref", name: "🎯 Veo 3.1 Ref" },
                                { id: "Happy Horse", name: "🐴 Happy Horse T2V" }
                              ].map((engine) => {
                                const isSelected = premiumVideoEngine === engine.id;
                                return (
                                  <button
                                    key={engine.id}
                                    type="button"
                                    onClick={() => setPremiumVideoEngine(engine.id)}
                                    className={`p-1.5 px-2.5 rounded-lg text-[10px] text-left font-mono font-bold tracking-tight transition-all flex items-center justify-between border cursor-pointer
                                      ${isSelected 
                                        ? "bg-amber-400 text-slate-950 border-amber-400 shadow font-black" 
                                        : "bg-slate-50 text-slate-700 border-slate-205 hover:bg-slate-100 hover:text-slate-900"
                                      }
                                    `}
                                  >
                                    <span className="truncate">{engine.name}</span>
                                    {isSelected && <span className="text-[8px] bg-slate-900 text-white px-1 rounded font-black font-sans">ON</span>}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          
                          <p className="text-[10px] text-amber-900 font-medium leading-normal">
                            Setiap pembuatan di Premium Mode akan menjabarkan skrip video menjadi 5 adegan spesifik (durasi penuh 25-detik) diselaraskan narasi vokal & overlay visual instan.
                          </p>
                        </div>
                      )}
                      
                      {/* Content Type */}
                      <div className="space-y-1">
                        <label className="text-[11px] text-slate-700 font-black font-sans">Content Format Seeked</label>
                        <select
                          value={contentType}
                          onChange={(e) => setContentType(e.target.value)}
                          className="w-full bg-white border-2 border-slate-200 text-xs rounded-xl p-2.5 text-slate-800 font-bold focus:outline-none focus:border-emerald-500"
                        >
                          <option value="TikTok / Reels Video Script with visual cues">Video Script (TikTok/Reels with SFX/cues)</option>
                          <option value="Catchy high-converting product caption container">Short Caption with engaging emojis</option>
                          <option value="Long Form written detailed product review container">Honest Review Post (Pros & Cons, detailed)</option>
                          <option value="Hook variations generator (10 options to test)">10 Aesthetic hook options to test</option>
                        </select>
                      </div>

                      {/* Tone */}
                      <div className="space-y-1">
                        <label className="text-[11px] text-slate-700 font-black font-sans">Brand Vibe & Tone</label>
                        <select
                          value={tone}
                          onChange={(e) => setTone(e.target.value)}
                          className="w-full bg-white border-2 border-slate-200 text-xs rounded-xl p-2.5 text-slate-800 font-bold focus:outline-none focus:border-emerald-500"
                        >
                          <option value="Energetic, Urgant, FOMO, fast paced sound hook">Energetic, Impulsive & Magnetic (FOMO)</option>
                          <option value="Slow ASMR, satisfying, whispering, sensory focused text">Intimate Skincare ASMR or Cozy Desk ASMR</option>
                          <option value="Aesthetic, clean, lifestyle minimalism and storytelling">Clean Minimalist Lifestyle</option>
                          <option value="Direct Problem-Solving education, objective and analytical text">Product Problem-Solver Tutorial</option>
                          <option value="Humorous, dramatized scenario relative to normal habits">Comedy Skit or Dramatic Storyline</option>
                        </select>
                      </div>

                      {/* Target Audience */}
                      <div className="space-y-1">
                        <label className="text-[11px] text-slate-700 font-black font-sans">Target Buyer Persona</label>
                        <select
                          value={targetAudience}
                          onChange={(e) => setTargetAudience(e.target.value)}
                          className="w-full bg-white border-2 border-slate-200 text-xs rounded-xl p-2.5 text-slate-800 font-bold focus:outline-none focus:border-emerald-500"
                        >
                          <option value="Gen-Z & active social media impulse buyers">Gen-Z Trend Hunters</option>
                          <option value="Organized moms, homemakers, and aesthetic pantry fans">Busy Moms & Homemakers</option>
                          <option value="Tech accessory lovers, sleek desk set-uppers, and rgb fans">Minimal Workspace Technologists</option>
                          <option value="Active gym trainers, health conscious and busy commuters">Fitness Lovers & Muscle Restorers</option>
                        </select>
                      </div>

                      {/* Keywords */}
                      <div className="space-y-1">
                        <label className="text-[11px] text-slate-705 font-bold font-sans flex justify-between">
                          <span className="font-sans font-black">Custom Keywords (Optional)</span>
                          <span className="text-[10px] text-slate-500 font-mono font-bold">Comma separated</span>
                        </label>
                        <input
                          type="text"
                          value={customKeywords}
                          onChange={(e) => setCustomKeywords(e.target.value)}
                          placeholder="e.g. unboxing ASMR, diskon besar, link bio"
                          className="w-full bg-white border-2 border-slate-200 text-xs rounded-xl p-2.5 text-slate-805 font-bold focus:outline-none focus:border-emerald-500 placeholder:text-slate-400"
                        />
                      </div>

                      {/* Disclaimer Toggle */}
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          id="chk-disclaimer"
                          type="checkbox"
                          checked={includeDisclaimer}
                          onChange={(e) => setIncludeDisclaimer(e.target.checked)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-slate-200 bg-white h-4 w-4"
                        />
                        <label htmlFor="chk-disclaimer" className="text-xs text-slate-700 cursor-pointer font-sans select-none font-bold">
                          Auto-inject natural affiliate disclosure notice
                        </label>
                      </div>

                      {/* Trigger Button */}
                      <button
                        id="btn-generate-ai"
                        onClick={() => generateAIContent(selectedProduct)}
                        disabled={isGenerating}
                        className="w-full bg-emerald-600 hover:bg-emerald-555 text-white py-3 px-4 rounded-xl text-xs font-black font-sans tracking-wide transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                      >
                        {isGenerating ? (
                          <>
                            <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Gemini 3.5 Generating High-Impact Script...
                          </>
                        ) : (
                          <>
                            <Sparkles size={14} className="text-white shrink-0 stroke-[2.5]" />
                            Instantiate Creator Copy Engine (Gemini AI)
                          </>
                        )}
                      </button>

                      <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono px-1 font-bold">
                        <span>Biaya Pembuatan: 1 Kredit</span>
                        <span className={credits === 0 ? "text-red-500 font-black animate-pulse" : "text-slate-600 font-black"}>
                          Saldo Anda: {credits} Kredit {credits === 0 && "(Klik Top Up!)"}
                        </span>
                      </div>

                      {generationError && (
                        <div className="p-3 bg-red-500/10 border-2 border-red-200 rounded-xl text-xs text-red-700 leading-normal flex gap-2 font-black">
                          <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-600 stroke-[2.5]" />
                          <span>{generationError}</span>
                        </div>
                      )}
                    </div>

                    {/* RENDER SYSTEM OUTPUT CONTAINER */}
                    {generatedContent && (
                      <div className="mt-4 border-t-2 border-slate-100 pt-4 space-y-4 animate-fadeIn">
                        
                        {/* Interactive Premium Video Player & Natural Speech Synthesis Studio UI */}
                        {premiumVideoMode && premiumVideoScenes && premiumVideoCharacter && (
                          <div className="border-2 border-amber-300 bg-gradient-to-br from-white to-amber-50/20 p-5 rounded-3xl space-y-3">
                            <div className="text-center">
                              <span className="text-[10px] font-mono text-amber-900 font-black tracking-wider uppercase bg-amber-100 px-3 py-1 border border-amber-300 rounded-full inline-block shadow-sm">
                                ⭐ PREMIUM VEO 25s REALISTIC VIDEO GENERATED
                              </span>
                            </div>
                            <PremiumVideoPlayer
                              scenes={premiumVideoScenes}
                              character={premiumVideoCharacter}
                              productName={selectedProduct.name}
                              niche={selectedProduct.niche}
                              selectedEngine={premiumVideoEngine}
                            />
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-emerald-900 font-black tracking-wider uppercase bg-emerald-50 px-2.5 py-1 border border-emerald-250 rounded">
                            {premiumVideoMode ? "RAW VOICE-OVER SCRIPT BACKUP" : "MARKETING ENGINE OUTPUT"}
                          </span>

                          <button
                            onClick={() => handleCopyToClipboard(generatedContent, "ai-copy")}
                            className="bg-white hover:bg-slate-105 border-2 border-slate-200 text-slate-800 hover:text-slate-950 px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                          >
                            {copiedId === "ai-copy" ? (
                              <>
                                <Check size={12} className="text-emerald-700 stroke-[2.5]" />
                                <span className="text-emerald-700 font-mono text-xs font-black">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy size={12} className="text-slate-600" />
                                <span className="text-slate-750 font-mono text-xs font-black">Copy Script</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Interactive Script Teleprompter Block */}
                        <div className="bg-slate-50 border-2 border-slate-205 rounded-xl p-4 text-[13px] leading-relaxed text-slate-900 font-mono max-h-96 overflow-y-auto whitespace-pre-wrap select-text selection:bg-indigo-100 font-black">
                          {generatedContent}
                        </div>

                        {/* Post-Generation Actions */}
                        <div className="bg-slate-50 p-4 rounded-xl border-2 border-slate-200 space-y-2">
                          <span className="text-[10px] font-mono text-slate-600 uppercase block tracking-wider font-extrabold">Save script to catalog</span>
                          
                          <input
                            type="text"
                            value={customNotes}
                            onChange={(e) => setCustomNotes(e.target.value)}
                            placeholder="Optional custom identifier (e.g., TikTok Campaign Rencana B)"
                            className="w-full bg-white border-2 border-slate-200 text-[11px] rounded-xl p-2.5 text-slate-900 font-bold focus:outline-none focus:border-indigo-500 placeholder:text-slate-400 mb-2"
                          />

                          <button
                            onClick={handleSaveCampaign}
                            className="w-full py-2.5 bg-slate-900 hover:bg-slate-855 text-xs font-black text-emerald-450 rounded-xl transition-all cursor-pointer shadow-sm"
                          >
                            Save Draft to Campaign Vault
                          </button>

                          {successSavedToast && (
                            <p className="text-xs text-emerald-800 font-bold mt-2 text-center animate-pulse">
                              ✔ Successfully added script template to vault history.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
                    <Sparkles className="text-slate-400 animate-spin mb-3" size={28} />
                    <p className="text-xs font-black text-slate-800">Creator Engine Offline</p>
                    <p className="text-xs font-bold text-slate-600 max-w-xs mt-1">Please select "Create AI Copy" or "Statistics Panel" on any product below to populate the workspace.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: 2. CAMPAIGN HISTORY VAULT */}
            {activeWorkspaceTab === "history" && (
              <div id="vault-workspace-content" className="bg-white border-2 border-slate-250 rounded-2xl p-5 space-y-4">
                
                <div className="flex justify-between items-center border-b-2 border-slate-100 pb-3">
                  <div>
                    <h4 className="text-xs font-black font-mono text-indigo-900 uppercase tracking-widest">Script Catalog Vault</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5 font-black">Stored locally inside your browser cache</p>
                  </div>
                  <span className="text-xs bg-indigo-50 border-2 border-indigo-200 text-indigo-800 font-mono font-black px-2.5 py-0.5 rounded-lg">
                    {savedCampaigns.length} campaigns
                  </span>
                </div>

                {savedCampaigns.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
                    <History className="text-slate-400 mb-3" size={28} />
                    <p className="text-xs font-black text-slate-700">Vault Currently Empty</p>
                    <p className="text-xs text-slate-605 max-w-xs mt-1 font-bold">Scripts that you save from instructions will accumulate here for easy extraction later.</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                    {savedCampaigns.map((c) => (
                      <div 
                        key={c.id} 
                        id={`saved-campaign-item-${c.id}`}
                        className="bg-slate-50 border-2 border-slate-200 hover:border-indigo-200 rounded-xl p-4 space-y-3 relative group"
                      >
                        {/* Title line */}
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="text-[10px] font-mono text-indigo-700 uppercase tracking-wider block font-black">ID: {c.productId}</span>
                            <h5 className="font-black text-slate-900 text-xs mt-1">{c.productName}</h5>
                            {c.customNotes && (
                              <span className="text-[11px] text-indigo-805 font-mono mt-0.5 block font-black">🏷️ Note: {c.customNotes}</span>
                            )}
                          </div>

                          <button
                            onClick={() => handleDeleteCampaign(c.id)}
                            className="text-red-500 hover:text-red-700 transition-colors p-1 cursor-pointer absolute right-2 top-2 block"
                            title="Remove script from vault"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        {/* Copy details */}
                        <div className="grid grid-cols-2 gap-2 bg-white border border-slate-205 p-2.5 rounded-lg text-[10px]">
                          <div>
                            <span className="text-slate-500 block font-bold">Vibe & Tone:</span>
                            <span className="text-slate-800 font-black truncate block">{c.tone}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block font-sans font-bold">Compiled on:</span>
                            <span className="text-slate-800 font-black block">{c.savedAt}</span>
                          </div>
                        </div>

                        {/* Script view button & action block */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCopyToClipboard(c.generatedContent, c.id)}
                            className="flex-1 py-1.5 bg-white hover:bg-slate-100 text-slate-800 hover:text-slate-950 border-2 border-slate-205 text-[11px] rounded-lg font-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            {copiedId === c.id ? (
                              <>
                                <Check size={11} className="text-emerald-700 stroke-[2.5]" />
                                <span className="text-emerald-700">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy size={11} className="text-slate-600" />
                                <span>Copy Script</span>
                              </>
                            )}
                          </button>
                          
                          <button
                            onClick={() => {
                              setSelectedProduct(products.find(p => p.id === c.productId) || null);
                              setGeneratedContent(c.generatedContent);
                              setActiveWorkspaceTab("creator");
                            }}
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] rounded-lg border-2 border-indigo-200 font-black transition-colors cursor-pointer"
                          >
                            Load to Studio
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: TREND ORACLE PRO */}
            {activeWorkspaceTab === "oracle" && (
              <div id="oracle-workspace-content" className="bg-white border-2 border-slate-250 rounded-2xl p-6 space-y-6">
                <div className="flex justify-between items-start border-b-2 border-slate-150 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-indigo-800 font-extrabold tracking-wider uppercase bg-indigo-50 px-2 py-0.5 border border-indigo-200 rounded">
                        TREND ORACLE PRO AI
                      </span>
                      <span className="text-[10px] font-mono text-amber-800 font-extrabold tracking-wider uppercase bg-amber-50 px-2 py-0.5 border border-amber-200 rounded animate-pulse">
                        PREMIUM EXTRA
                      </span>
                    </div>
                    <h4 className="text-xl font-black text-slate-900 mt-2">Indonesia Predictive Viral Analytics</h4>
                    <p className="text-xs text-slate-600 mt-1 font-bold">
                      Prediksi 10 produk bermutu evergreen yang akan meledak dalam 14 - 30 hari berdasarkan formula dynamic velocity pasar Indonesia.
                    </p>
                  </div>
                </div>

                {/* Form & Setup Panel */}
                <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Input Niche */}
                    <div>
                      <label className="text-xs font-black text-slate-700 uppercase tracking-widest block mb-1.5">Niche Produk</label>
                      <select
                        value={oracleNiche}
                        onChange={(e) => setOracleNiche(e.target.value)}
                        className="w-full bg-white border-2 border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="beauty">Skincare / Beauty</option>
                        <option value="dapur">Dapur / Alat Masak Unik</option>
                        <option value="pet">Pet / Kebutuhan Hewan</option>
                        <option value="gadget">Gadget & Elektronik Hebat</option>
                      </select>
                    </div>

                    {/* Input Budget Riset */}
                    <div>
                      <label className="text-xs font-black text-slate-700 uppercase tracking-widest block mb-1.5">Budget Riset / Modal</label>
                      <input
                        type="text"
                        value={oracleBudget}
                        onChange={(e) => setOracleBudget(e.target.value)}
                        placeholder="contoh: Rp 50.000 atau Rp 200.000"
                        className="w-full bg-white border-2 border-slate-205 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-550 h-[38px]"
                      />
                    </div>

                    {/* Platform Utama */}
                    <div>
                      <label className="text-xs font-black text-slate-700 uppercase tracking-widest block mb-1.5">Platform Utama</label>
                      <select
                        value={oraclePlatform}
                        onChange={(e) => setOraclePlatform(e.target.value)}
                        className="w-full bg-white border-2 border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="TikTok">TikTok Shop / Affiliate</option>
                        <option value="Shopee">Shopee Affiliate</option>
                        <option value="Instagram">Instagram Reels</option>
                      </select>
                    </div>
                  </div>

                  {/* Criteria info preview list */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 text-[11px] text-slate-600 leading-relaxed font-semibold">
                    <span className="font-black text-indigo-900 uppercase block mb-1.5 text-xs">Peta Formula Analisis Sistem:</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                      <div>🚀 <strong className="text-slate-800">Growth Velocity (30%):</strong> Rasio lonjakan volume pencarian Google & Shopee &gt; 2.5x</div>
                      <div>📢 <strong className="text-slate-800">Mention Increase (25%):</strong> Laju sebutan organik di Reels + FYP TikTok</div>
                      <div>🛡️ <strong className="text-slate-800">Low Saturation (20%):</strong> Kompetisi aman (seller aktif &lt; 500 / video &lt; 2.000)</div>
                      <div>👥 <strong className="text-slate-800">Creator Adoption (15%):</strong> Adopsi cepat oleh mikro-kreator pemula</div>
                      <div>💰 <strong className="text-slate-800">CPC Affiliate Value (10%):</strong> Komisi tinggi sehat (&gt; 10%, harga Rp 50k - Rp 250k)</div>
                    </div>
                  </div>

                  {/* Actions / Trigger */}
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-2">
                    <div className="flex items-center gap-2">
                      <Coins size={16} className="text-indigo-600 animate-pulse" />
                      <span className="text-xs font-black text-slate-600">
                        Biaya Analisis: <span className="text-indigo-805 font-black">1 Kredit</span> (Saldo: {credits} Kredit)
                      </span>
                    </div>

                    <button
                      onClick={runTrendOracleOnline}
                      disabled={isOracleLoading || credits <= 0}
                      className={`w-full md:w-auto px-6 py-3 rounded-xl font-black text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md
                        ${isOracleLoading || credits <= 0
                          ? "bg-slate-305 text-slate-500 cursor-not-allowed border border-slate-205"
                          : "bg-indigo-900 hover:bg-slate-900 text-white hover:scale-101 border-2 border-indigo-950"
                        }
                      `}
                    >
                      {isOracleLoading ? (
                        <>
                          <RefreshCw size={14} className="animate-spin text-white" />
                          Memprediksi...
                        </>
                      ) : (
                        <>
                          <Sparkles size={14} className="text-amber-300 animate-pulse" />
                          Run Trend Oracle (Go!)
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Error handling */}
                {oracleError && (
                  <div className="bg-red-50 border-2 border-red-200 text-red-800 font-bold p-4 rounded-xl text-xs flex items-center gap-2.5 animate-bounce">
                    <AlertCircle size={16} className="shrink-0 text-red-700" />
                    <span>{oracleError}</span>
                  </div>
                )}

                {/* Loading indicator with custom checkpoints */}
                {isOracleLoading && (
                  <div className="bg-indigo-50/50 border-2 border-indigo-150 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="relative">
                      <div className="h-12 w-12 rounded-full border-4 border-indigo-200 border-t-indigo-800 animate-spin"></div>
                      <TrendingUp size={18} className="absolute inset-0 m-auto text-indigo-800 animate-pulse" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-indigo-900 animate-pulse">TREND ORACLE PRO: Menganalisis Laju Gelombang Trend...</p>
                      <p className="text-[11px] text-slate-600 font-bold mt-1 max-w-sm">
                        Kami sedang menyaring basis data tren teraktual (Google Trends ID, TikTok Creative Center, Tokopedia Trending, dan Reels tag) untuk memperhitungkan probabilitas viralitas tertinggi.
                      </p>
                    </div>
                  </div>
                )}

                {/* Predictions results output */}
                {oracleOutput && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b-2 border-indigo-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                        <h5 className="text-xs font-black font-mono text-indigo-950 uppercase tracking-widest">
                          HASIL ANALISIS PREDIKSI VIRALITAS
                        </h5>
                      </div>
                      
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(oracleOutput);
                          setCopiedId("oracle-copy");
                          setTimeout(() => setCopiedId(null), 1500);
                        }}
                        className="bg-white hover:bg-slate-100 border-2 border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                      >
                        {copiedId === "oracle-copy" ? (
                          <>
                            <Check size={12} className="text-emerald-700 stroke-[2.5]" />
                            <span className="text-emerald-700 font-mono text-xs font-black">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} className="text-slate-600" />
                            <span className="text-slate-750 font-mono text-xs font-black">Salin Laporan</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 text-[12px] leading-relaxed text-slate-200 font-mono max-h-[500px] overflow-y-auto whitespace-pre-wrap select-text selection:bg-indigo-500/30">
                      {oracleOutput}
                    </div>

                    <div className="p-3 bg-amber-55 text-amber-900 text-xs font-bold rounded-xl border border-amber-205 flex items-start gap-2">
                      <AlertCircle size={15} className="shrink-0 mt-0.5 text-amber-700 stroke-[2.5]" />
                      <span>
                        Tips Strategi: Buat video UGC (User Generated Content) seawal mungkin berdasarkan 3 ide hook di atas. Jangan menunggu produk mulai banjir video kompetisi agar Anda mendapatkan komisi masif di masa awal (early bird)!
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: AI PERSONA HUB */}
            {activeWorkspaceTab === "persona" && (
              <div id="persona-workspace-content" className="bg-white border-2 border-slate-250 rounded-2xl p-6 space-y-6">
                
                {/* Header Title Section */}
                <div className="flex justify-between items-start border-b-2 border-slate-150 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-purple-800 font-extrabold tracking-wider uppercase bg-purple-50 px-2 py-0.5 border border-purple-200 rounded">
                        AI CREATOR PERSONA HUB
                      </span>
                      <span className="text-[10px] font-mono text-amber-800 font-extrabold tracking-wider uppercase bg-amber-50 px-2 py-0.5 border border-amber-200 rounded animate-pulse">
                        SENGGOL VIRAL PRO
                      </span>
                    </div>
                    <h4 className="text-xl font-black text-slate-900 mt-2">Indonesia Elite Influencer Agents</h4>
                    <p className="text-xs text-slate-600 mt-1 font-bold">
                      Kolaborasi rahasia dengan 6 asisten AI dengan bias gaya rujukan viral pasar terpopuler Indonesia.
                    </p>
                  </div>
                </div>

                {/* Persona Selection Grid */}
                <div className="space-y-2.5">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-widest block">Pilih Partner AI Influencer:</label>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* Bude Siska */}
                    <button
                      onClick={() => setSelectedPersonaId("bude_siska")}
                      className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer relative overflow-hidden flex items-start gap-2.5
                        ${selectedPersonaId === "bude_siska" 
                          ? "border-pink-500 bg-pink-50/50" 
                          : "border-slate-205 bg-white hover:border-slate-300"
                        }
                      `}
                    >
                      <span className="text-2xl mt-0.5">🙋‍♀️</span>
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono font-extrabold text-pink-700 block uppercase leading-none">BUDE SISKA</span>
                        <span className="text-xs font-black text-slate-950 block mt-1 truncate">Ratu FOMO Emak</span>
                        <span className="text-[9px] text-slate-500 font-bold block mt-0.5 leading-tight truncate">Alat Dapur, Mainan, Rumah</span>
                      </div>
                    </button>

                    {/* Kak Farel */}
                    <button
                      onClick={() => setSelectedPersonaId("kak_farel")}
                      className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer relative overflow-hidden flex items-start gap-2.5
                        ${selectedPersonaId === "kak_farel" 
                          ? "border-sky-500 bg-sky-50/50" 
                          : "border-slate-205 bg-white hover:border-slate-300"
                        }
                      `}
                    >
                      <span className="text-2xl mt-0.5">💻</span>
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono font-extrabold text-sky-700 block uppercase leading-none">FAREL TECH</span>
                        <span className="text-xs font-black text-slate-950 block mt-1 truncate">Gadget Sleuth Guru</span>
                        <span className="text-[9px] text-slate-500 font-bold block mt-0.5 leading-tight truncate">Elektronik, Charger, Aksesori</span>
                      </div>
                    </button>

                    {/* Ci Michelle */}
                    <button
                      onClick={() => setSelectedPersonaId("ci_michelle")}
                      className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer relative overflow-hidden flex items-start gap-2.5
                        ${selectedPersonaId === "ci_michelle" 
                          ? "border-purple-500 bg-purple-50/50" 
                          : "border-slate-205 bg-white hover:border-slate-300"
                        }
                      `}
                    >
                      <span className="text-2xl mt-0.5">✨</span>
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono font-extrabold text-purple-700 block uppercase leading-none">CI MICHELLE</span>
                        <span className="text-xs font-black text-slate-950 block mt-1 truncate">Beauty Skincare AI</span>
                        <span className="text-[9px] text-slate-500 font-bold block mt-0.5 leading-tight truncate">Makeup, Glow up, Hijab</span>
                      </div>
                    </button>

                    {/* Mas Jaka */}
                    <button
                      onClick={() => setSelectedPersonaId("mas_jaka")}
                      className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer relative overflow-hidden flex items-start gap-2.5
                        ${selectedPersonaId === "mas_jaka" 
                          ? "border-amber-500 bg-amber-50/50" 
                          : "border-slate-205 bg-white hover:border-slate-300"
                        }
                      `}
                    >
                      <span className="text-2xl mt-0.5">🔧</span>
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono font-extrabold text-amber-700 block uppercase leading-none">MAS JAKA</span>
                        <span className="text-xs font-black text-slate-950 block mt-1 truncate">Montir Solutif DIY</span>
                        <span className="text-[9px] text-slate-500 font-bold block mt-0.5 leading-tight truncate">Perkakas, Otomotif, Rumah</span>
                      </div>
                    </button>

                    {/* Coach Rio */}
                    <button
                      onClick={() => setSelectedPersonaId("coach_rio")}
                      className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer relative overflow-hidden flex items-start gap-2.5
                        ${selectedPersonaId === "coach_rio" 
                          ? "border-red-500 bg-red-50/50" 
                          : "border-slate-205 bg-white hover:border-slate-300"
                        }
                      `}
                    >
                      <span className="text-2xl mt-0.5">💥</span>
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono font-extrabold text-red-700 block uppercase leading-none">COACH RIO</span>
                        <span className="text-xs font-black text-slate-950 block mt-1 truncate">Hipnotic Copywriter</span>
                        <span className="text-[9px] text-slate-500 font-bold block mt-0.5 leading-tight truncate">Paint Points, CTA Maut</span>
                      </div>
                    </button>

                    {/* Sasa */}
                    <button
                      onClick={() => setSelectedPersonaId("sasa")}
                      className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer relative overflow-hidden flex items-start gap-2.5
                        ${selectedPersonaId === "sasa" 
                          ? "border-emerald-500 bg-emerald-50/50" 
                          : "border-slate-205 bg-white hover:border-slate-300"
                        }
                      `}
                    >
                      <span className="text-2xl mt-0.5">🦕</span>
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono font-extrabold text-emerald-700 block uppercase leading-none">SASA JAKSEL</span>
                        <span className="text-xs font-black text-slate-950 block mt-1 truncate">Skena Gen Z Vibe</span>
                        <span className="text-[9px] text-slate-500 font-bold block mt-0.5 leading-tight truncate">Tren, Aesthetic, Lucu</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Sub Panel Settings: Focus Topic */}
                <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-widest block mb-1">Pilih Fokus Output / Goal:</label>
                    <select
                      value={personaTopic}
                      onChange={(e) => setPersonaTopic(e.target.value)}
                      className="w-full bg-white border-2 border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-550 cursor-pointer"
                    >
                      <option value="script_video">Video Short Script (TikTok/Instagram Reels) 🎬</option>
                      <option value="copywriting_fomo">High Conversion FOMO Copywriting 📝</option>
                      <option value="slogan_hipnotis">Hipnotic Clickbait Slogans & Hooks 💥</option>
                      <option value="strategi_live">Trik Live Streaming Interaktif & Menjebak 🗣️</option>
                      <option value="balas_komentar">Taktik Menjinukkan Keraguan Pembeli & Komplain 🛡️</option>
                    </select>
                  </div>
                  <div className="flex items-end md:self-end">
                    <button
                      onClick={() => {
                        let resetMsg = "";
                        if (selectedPersonaId === "bude_siska") resetMsg = "Halo jeng! Bude Siska di sini siap bantu racunin dagangan kamu biar viral dapet cuan tumpah-tumpah! Mau dibikinin skrip video racun emak-emak apa hari ini? Bisikin dong produknya!";
                        else if (selectedPersonaId === "kak_farel") resetMsg = "Yo, halo semuanya. Farel di sini. Lu mau dapet ulasan tech atau video script unboxing yang super jujur, minim gimmick, tapi konversi penjualannya tinggi? Kasih tau nama produk & spek kasarnya, langsung kita breakdown tuntas.";
                        else if (selectedPersonaId === "ci_michelle") resetMsg = "Hi everyone! Ci Michelle di sini, seneng banget bisa bantu kalian dapet resep glowing luar dalam buat jualan skincare/beauty. Mau didesain skrip aesthetic racun glow up buat target cewek-cewek hits? Kasih tahu detail produknya ya!";
                        else if (selectedPersonaId === "mas_jaka") resetMsg = "Halo Bro, Mas Jaka di sini. Siap bantu kamu bedah kelebihan produk otomotif atau perkakas unik dengan bahasa praktis biar cowok-cowok makin demen. Apa nih barang yang mau kita bikin laris manis? Sebutin aja!";
                        else if (selectedPersonaId === "coach_rio") resetMsg = "SALAM DIGITAL MARKETING INDONESIA! Coach Rio di sini! Siap BONGKAR emosi pembeli Anda dengan teknik copywriting hipnotis tak tertolak! Tulis nama produk Anda sekarang, kita racik HOOK mematikan di awal detik!";
                        else if (selectedPersonaId === "sasa") resetMsg = "Haii bestie! Sasa di sini, literally super excited buat nemu angle ngetren paling aesthetic & viral buat produk gemes kamu biar FYP parah di TikTok! Kasihan kan kalau produk se-gokil ini gak viral. Spill produknya dong!";
                        
                        setPersonaChatHistory([{ role: "model" as const, text: resetMsg }]);
                        setPersonaError(null);
                      }}
                      className="bg-white hover:bg-red-50 border border-slate-300 hover:border-red-300 text-slate-700 hover:text-red-700 px-3 py-1.5 h-[36px] rounded-lg text-xs font-black transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={13} />
                      Reset Obrolan
                    </button>
                  </div>
                </div>

                {/* Live Transcript / Dialogue Screen */}
                <div className="border-2 border-slate-200 rounded-xl bg-slate-50 flex flex-col overflow-hidden h-[330px]">
                  {/* Chat Banner Info */}
                  <div className="bg-slate-200/80 px-4 py-2 border-b border-slate-250 flex items-center justify-between text-[10px] font-mono font-black text-slate-600">
                    <span>SOCIALLY ACTIVE AGENT THREAD</span>
                    <span className="text-indigo-800 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
                      STANDBY IN JAYAKARTA TIME
                    </span>
                  </div>

                  {/* Messages list */}
                  <div className="p-4 overflow-y-auto space-y-3.5 flex-1 scrollbar-thin">
                    {personaChatHistory.map((item, idx) => (
                      <div
                        key={idx}
                        className={`flex items-start gap-2.5 max-w-[85%]
                          ${item.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}
                        `}
                      >
                        {/* Profile initials placeholder */}
                        <div className={`h-7 w-7 rounded-lg font-black text-[11px] flex items-center justify-center shrink-0 border
                          ${item.role === "user" 
                            ? "bg-slate-700 text-white border-slate-850"
                            : selectedPersonaId === "bude_siska" ? "bg-pink-100 text-pink-800 border-pink-205"
                            : selectedPersonaId === "kak_farel" ? "bg-sky-100 text-sky-800 border-sky-205"
                            : selectedPersonaId === "ci_michelle" ? "bg-purple-100 text-purple-800 border-purple-205"
                            : selectedPersonaId === "mas_jaka" ? "bg-amber-100 text-amber-850 border-amber-205"
                            : selectedPersonaId === "coach_rio" ? "bg-red-100 text-red-800 border-red-205"
                            : "bg-emerald-100 text-emerald-800 border-emerald-205"
                          }
                        `}>
                          {item.role === "user" ? "ME" : selectedPersonaId === "bude_siska" ? "BS" 
                           : selectedPersonaId === "kak_farel" ? "KF" : selectedPersonaId === "ci_michelle" ? "CM" 
                           : selectedPersonaId === "mas_jaka" ? "MJ" : selectedPersonaId === "coach_rio" ? "CR" : "SS"}
                        </div>

                        {/* Speech Bubble text */}
                        <div className={`p-3 rounded-xl block leading-relaxed text-xs shadow-xs select-text selection:bg-indigo-500/30
                          ${item.role === "user"
                            ? "bg-indigo-900 text-white rounded-tr-none font-bold"
                            : "bg-white text-slate-800 border border-slate-200 rounded-tl-none font-medium whitespace-pre-wrap"
                          }
                        `}>
                          {item.text}
                        </div>
                      </div>
                    ))}

                    {isPersonaLoading && (
                      <div className="flex items-start gap-2.5 max-w-[85%] mr-auto">
                        <div className="h-7 w-7 rounded-lg bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-black flex items-center justify-center animate-pulse">
                          AI
                        </div>
                        <div className="p-3 bg-white text-slate-500 border border-slate-200 rounded-xl rounded-tl-none font-bold text-xs flex items-center gap-2">
                          <RefreshCw size={12} className="animate-spin text-indigo-700Speed" />
                          <span>Asisten sedang merangkai taktik jitu...</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Form Input Area and action submit */}
                <div className="space-y-3">
                  {/* Persona Input text */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={personaMessage}
                      onChange={(e) => setPersonaMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !isPersonaLoading) {
                          runPersonaDialogue();
                        }
                      }}
                      disabled={isPersonaLoading || credits <= 0}
                      placeholder={
                        selectedPersonaId === "bude_siska" ? "Masukkan detail barang: contoh 'pisau serat baja super tajam set isi 5'..."
                        : selectedPersonaId === "kak_farel" ? "Sebutkan gadget yang mau diulas: contoh 'Powerbank Wireless Slim GaN 10000mAh'..."
                        : selectedPersonaId === "ci_michelle" ? "Sebutkan nama skincare mencerahkan: contoh 'Serum Vitamin C Pure Glow-up'..."
                        : selectedPersonaId === "mas_jaka" ? "Deskripsikan perkakas rumah: contoh 'Kamera inspeksi kawat ledeng anti air'..."
                        : selectedPersonaId === "coach_rio" ? "Produk/kursus apa yang mau dirancang copy-nya: contoh 'Minyak penumbuh rambut brewok'..."
                        : "Sebutkan mainan/produk unik viral: contoh 'Gantungan kunci akrilik gemas custom muka pacar'..."
                      }
                      className="flex-1 bg-white border-2 border-slate-205 rounded-xl px-4 py-2 text-xs font-bold text-slate-800 placeholder-slate-450 focus:outline-none focus:border-indigo-550 h-[42px]"
                    />

                    <button
                      onClick={runPersonaDialogue}
                      disabled={isPersonaLoading || !personaMessage.trim() || credits <= 0}
                      className={`px-5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-sm
                        ${isPersonaLoading || !personaMessage.trim() || credits <= 0
                          ? "bg-slate-300 text-slate-500 cursor-not-allowed border border-slate-200"
                          : "bg-indigo-900 border border-indigo-950 text-white hover:bg-slate-900"
                        }
                      `}
                    >
                      <Sparkles size={13} className="text-amber-300" />
                      SENGGOL
                    </button>
                  </div>

                  {/* Pricing / Credit indicator info */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 text-[11px] text-slate-605 font-bold px-1">
                    <span className="flex items-center gap-1 text-indigo-800">
                      <Coins size={14} />
                      Kebutuhan Konsultasi: <strong>1 Kredit</strong> per saran
                    </span>
                    <span>
                      Saldo Tersedia: <strong className="text-indigo-900">{credits} Kredit</strong>
                    </span>
                  </div>

                  {/* Error indicator */}
                  {personaError && (
                    <div className="bg-red-50 border border-red-200 text-red-800 font-bold p-3.5 rounded-xl text-xs flex items-center gap-2">
                      <AlertCircle size={15} className="shrink-0 text-red-700" />
                      <span>{personaError}</span>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-purple-50 text-purple-900 font-sans text-xs font-bold rounded-xl border border-purple-200 flex items-start gap-2">
                  <span className="text-base">💡</span>
                  <span>
                    Tips Pro: Gabungkan input dengan spesifikasi unik, harga jual, dan bonus produk Anda secara presisi agar materi yang dibikin oleh sang Persona jauh lebih relevan, memukau, dan menohok langsung hati pembeli sasaran!
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
