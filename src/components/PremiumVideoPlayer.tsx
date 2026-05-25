import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Mic2, 
  User, 
  Film, 
  Heart, 
  MessageCircle, 
  Share2, 
  Zap, 
  Sliders, 
  Subtitles, 
  Radio 
} from "lucide-react";
import { AnimatePresence } from "motion/react";

const MotionDiv = lazy(() => import("motion/react").then(m => ({ default: m.motion.div })));
const MotionImg = lazy(() => import("motion/react").then(m => ({ default: m.motion.img })));

interface Character {
  name: string;
  role: string;
  avatarDescription: string;
  voicePitch: number;
  voiceRate: number;
  gender: "male" | "female";
}

interface Scene {
  id: number;
  timeRange: string;
  visualPrompt: string;
  speech: string;
  subtitle: string;
  sfx: string;
}

interface PremiumVideoPlayerProps {
  scenes: Scene[];
  character: Character;
  productName: string;
  niche: string;
  selectedEngine?: string;
}

// Collection of real, high-quality, relevant Unsplash IDs for realistic presentation
const UNF_IMAGES: { [key: string]: string[] } = {
  cosmetics: [
    "1522335789295-a27e7e8b6b3e", // luxurious lotion
    "1608248597279-f99d160bfcbc", // organic skincare jars
    "1612817288484-6f916006741a", // dropper serum
    "1596462502278-27bfdc403348", // skincare oils
    "1512496015851-a90fb38b7941"  // modern beauty cosmetics set
  ],
  tech: [
    "1527443224154-c4a3942d3acf", // stylish tech desktop setup
    "1587829741301-dc798b83add3", // aesthetic workspace mechanical keyboard
    "1542751371-adc38448a05e", // gaming setup RGB lights
    "1563986768609-322da13575f3", // phone accessories
    "1550745165-9bc0b252726f"  // elegant vintage gadget shelf
  ],
  home: [
    "1581858726788-75bc0f6a952d", // clean kitchen room 4k
    "1556911220-e15b29be8c8f", // aesthetic organized kitchen counter
    "1540555700478-4be289fbecef", // stylish scandinavian jars storage
    "1600585154340-be6161a56a0c", // beautiful interior modern home
    "1616486338812-3dadae4b4ace"  // organized dynamic layout
  ],
  fitness: [
    "1517838277536-f5f99be501cd", // active dumbbells gym
    "1571019613454-1cb2f99b2d8b", // athletic healthy trainer setup
    "1584735935682-2f2b69dff9d2", // sport recovery gears
    "1541534741688-6078c6bfb5c5", // running tracks workout
    "1518622358385-8ea7d0794bf6"  // dynamic yoga and body restoration
  ],
  general: [
    "1526170375885-4d8ecf77b99f", // trendy product polaroid mockup
    "1460925895917-afdab827c52f", // marketing chart sleek graphics
    "1511556532299-8f662fc26c06", // glowing neon aesthetic objects
    "1472851294608-062f824d296e", // creative workspace inspiration
    "1441986300917-64674bd600d8"  // modern premium catalog selection
  ]
};

const getUnsplashImage = (niche: string, sceneIndex: number): string => {
  const nKey = niche.toLowerCase();
  let category = "general";
  if (nKey.includes("skincare") || nKey.includes("beauty") || nKey.includes("fashion")) {
    category = "cosmetics";
  } else if (nKey.includes("tech") || nKey.includes("gadget") || nKey.includes("elektronik") || nKey.includes("workspace")) {
    category = "tech";
  } else if (nKey.includes("home") || nKey.includes("kitchen") || nKey.includes("rumah") || nKey.includes("organizer")) {
    category = "home";
  } else if (nKey.includes("fitness") || nKey.includes("gym") || nKey.includes("sehat") || nKey.includes("health")) {
    category = "fitness";
  }
  
  const array = UNF_IMAGES[category] || UNF_IMAGES.general;
  const id = array[sceneIndex % array.length];
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=600&q=80`;
};

export function PremiumVideoPlayer({ scenes, character, productName, niche, selectedEngine = "Veo 3.1 T2V" }: PremiumVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [activeSceneIndex, setActiveSceneIndex] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [heartsCount, setHeartsCount] = useState<number>(8492);
  const [hasLiked, setHasLiked] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Automatically map currentTime to active scene (each scene is exactly 5s. Total 25s)
  useEffect(() => {
    const calculatedScene = Math.min(Math.floor(currentTime / 5), 4);
    if (calculatedScene !== activeSceneIndex && calculatedScene >= 0 && calculatedScene < 5) {
      setActiveSceneIndex(calculatedScene);
      // Play voiceover automatically for the new scene if playing is active
      if (isPlaying) {
        speakSceneText(scenes[calculatedScene]?.speech);
      }
    }
  }, [currentTime, isPlaying, scenes]);

  // Clean speech synthesis on component destroy
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Playback timer controller
  useEffect(() => {
    if (isPlaying) {
      // Speak the first line when clicked play from starting point
      if (currentTime === 0) {
        speakSceneText(scenes[0]?.speech);
      }

      timerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          const nextVal = prev + 0.1 * playbackRate;
          if (nextVal >= 25) {
            setIsPlaying(false);
            if (window.speechSynthesis) window.speechSynthesis.cancel();
            return 0; // reset to beginning
          }
          return parseFloat(nextVal.toFixed(1));
        });
      }, 100);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackRate]);

  // Web Speech synthesis voice generator
  const speakSceneText = (text: string) => {
    if (!window.speechSynthesis || isMuted) return;
    window.speechSynthesis.cancel();

    setIsSynthesizing(true);
    const audioText = text.replace(/\[.*?\]/g, ""); // clear sound cues like [ASMR]
    const utterance = new SpeechSynthesisUtterance(audioText);
    
    // Attempt locating pure Indonesian language voice mapping
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = voices.find(v => v.lang.includes("id-ID") || v.lang.includes("id_ID") || v.lang.includes("id"));

    // Backups
    if (!selectedVoice) {
      if (character.gender === "female") {
        selectedVoice = voices.find(v => v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("zira") || v.name.toLowerCase().includes("google"));
      } else {
        selectedVoice = voices.find(v => v.name.toLowerCase().includes("male") || v.name.toLowerCase().includes("david") || v.name.toLowerCase().includes("google"));
      }
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.lang = "id-ID";
    utterance.rate = playbackRate * (character.voiceRate || 0.95);
    utterance.pitch = (character.voicePitch || 1.0);
    utterance.volume = volume;

    utterance.onend = () => {
      setIsSynthesizing(false);
    };

    utterance.onerror = () => {
      setIsSynthesizing(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setActiveSceneIndex(0);
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  const handleLike = () => {
    if (!hasLiked) {
      setHeartsCount(prev => prev + 1);
      setHasLiked(true);
    } else {
      setHeartsCount(prev => prev - 1);
      setHasLiked(false);
    }
  };

  const selectSceneDirectly = (index: number) => {
    setCurrentTime(index * 5);
    setActiveSceneIndex(index);
    if (isPlaying) {
      speakSceneText(scenes[index]?.speech);
    }
  };

  const progressPercent = Math.min((currentTime / 25) * 100, 100);
  const currentScene = scenes[activeSceneIndex] || scenes[0];

  return (
    <div className="bg-slate-900/40 rounded-2xl border border-slate-800 p-5 space-y-5 animate-fadeIn">
      
      {/* HEADER WITH CHIPS */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1 px-2.5 bg-gradient-to-r from-amber-400 to-amber-500 font-bold font-mono text-[9px] text-slate-950 uppercase rounded-full shadow flex items-center gap-1">
            <Sparkles size={11} className="fill-slate-950" />
            ENGINE: {selectedEngine.toUpperCase()} ACTIVE
          </div>
          <span className="text-[10px] text-slate-400 font-medium">✨ Premium Video & VO Studio v3.5</span>
        </div>
        
        <div className="text-[11px] font-mono text-slate-400 bg-slate-950 border border-slate-800 px-3 py-1 rounded-xl flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Voiceover & Subtitle Sync: <strong className="text-white">{currentTime} detik / 25s</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* LEFT COLUMN: REALISTIC PORTRAIT SMARTPHONE VIEWPORT */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          <div className="relative w-full max-w-[270px] aspect-[9/16] bg-black rounded-[36px] overflow-hidden border-[5px] border-slate-950 shadow-2xl ring-4 ring-slate-800/30">
            
            {/* Ambient Background Transition */}
            <div className="absolute inset-0 w-full h-full bg-slate-950">
              <AnimatePresence mode="wait">
                <Suspense fallback={<div className="w-full h-full bg-slate-950 animate-pulse" />}>
                  <MotionImg
                    key={activeSceneIndex}
                    src={getUnsplashImage(niche, activeSceneIndex)}
                    alt={`VEO Scene Scene ${activeSceneIndex + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover opacity-90 brightness-[0.7] saturate-[1.05]"
                    initial={{ opacity: 0, scale: 1.15 }}
                    animate={{ opacity: 0.9, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.8 }}
                  />
                </Suspense>
              </AnimatePresence>
            </div>

            {/* Premium Short Tech Badge watermark */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
              <Radio size={9} className="text-red-500 animate-pulse" />
              <span className="text-[8px] font-mono font-bold tracking-widest text-amber-300 uppercase">{selectedEngine} PREVIEW</span>
            </div>

            {/* Blinking Live Sound Indicator */}
            {isPlaying && isSynthesizing && (
              <div className="absolute top-4 right-4 z-20 bg-emerald-500/80 backdrop-blur-md px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                <Mic2 size={9} className="text-slate-950 animate-bounce" />
                <span className="text-[8px] font-mono font-bold text-slate-950">VO NATURAL</span>
              </div>
            )}

            {/* Interactive Social Media Engagement HUD overlays (Like, Comment, Share) */}
            <div className="absolute right-3 top-1/2 -translate-y-12 z-20 flex flex-col gap-4 text-white items-center">
              
              {/* Profile Avatar circle */}
              <div className="w-8 h-8 rounded-full border border-white/40 bg-indigo-505 flex items-center justify-center bg-gradient-to-tr from-indigo-500 to-emerald-400 shadow">
                <span className="text-[10px] font-bold text-slate-950">{character.name[0]}</span>
              </div>

              {/* Heart Likes selection */}
              <button 
                onClick={handleLike}
                className="flex flex-col items-center gap-0.5 group focus:outline-none"
              >
                <div className={`p-1.5 rounded-full transition-all ${hasLiked ? 'bg-red-500/20 text-red-500 scale-110' : 'bg-black/40 hover:bg-black/60 text-white'}`}>
                  <Heart size={14} className={hasLiked ? "fill-red-500" : ""} />
                </div>
                <span className="text-[9px] font-mono font-bold">{heartsCount}</span>
              </button>

              {/* Comment bubble */}
              <div className="flex flex-col items-center gap-0.5">
                <div className="p-1.5 rounded-full bg-black/40 text-white">
                  <MessageCircle size={14} />
                </div>
                <span className="text-[9px] font-mono font-bold">183</span>
              </div>

              {/* Share icon */}
              <div className="flex flex-col items-center gap-0.5">
                <div className="p-1.5 rounded-full bg-black/40 text-white">
                  <Share2 size={13} />
                </div>
                <span className="text-[9px] font-mono font-bold">Share</span>
              </div>
            </div>

            {/* Caption & Song overlay at bottom left */}
            <div className="absolute bottom-11 left-3 right-11 z-20 text-white space-y-1">
              <p className="text-[10px] font-bold font-sans">@{character.name.toLowerCase()} ⭐ Creator</p>
              <p className="text-[9px] text-slate-200 line-clamp-2 leading-relaxed">
                {productName} is amazing! {currentScene?.subtitle}
              </p>
              <div className="flex items-center gap-1 text-[8px] text-emerald-400 font-mono">
                <Film size={10} />
                <span>Original Audio • {character.name} VO Engine</span>
              </div>
            </div>

            {/* REALISTIC HIGH-CONTRAST SUBTITLES */}
            <div className="absolute bottom-22 left-2 right-2 z-30 flex flex-col items-center text-center">
              <AnimatePresence mode="wait">
                <Suspense fallback={null}>
                  <MotionDiv
                    key={activeSceneIndex}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                    className="bg-black/75 text-amber-300 border border-amber-400/10 rounded-xl px-3 py-2 text-[10px] leading-relaxed max-w-[90%] font-sans font-medium text-shadow shadow"
                  >
                    <span className="text-[8px] font-mono uppercase font-bold text-slate-400 block tracking-widest mb-0.5 text-center">{character.name} Voiceover:</span>
                    "{currentScene?.subtitle || "No subtitle recorded for this section."}"
                  </MotionDiv>
                </Suspense>
              </AnimatePresence>
            </div>

            {/* Progress indicator timeline strip */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-900/80 z-20">
              <div 
                className="bg-gradient-to-r from-emerald-400 via-amber-400 to-indigo-500 h-full transition-all duration-100 ease-linear shadow-cyan"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>

            {/* SFX visual alert popover */}
            {currentScene?.sfx && isPlaying && (
              <div className="absolute bottom-4 right-4 z-20 opacity-80 scale-90">
                <span className="bg-slate-950/80 text-emerald-300 font-mono text-[8px] px-1.5 py-0.5 leading-none rounded border border-emerald-500/20 uppercase tracking-widest animate-pulse block">
                  🔊 {currentScene.sfx.replace(/[\[\]]/g, "")}
                </span>
              </div>
            )}

          </div>

          {/* Quick HUD playback buttons */}
          <div className="flex items-center gap-3 mt-3 w-full max-w-[270px]">
            <button
              onClick={handlePlayPause}
              className={`flex-1 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1 shadow cursor-pointer
                ${isPlaying 
                  ? "bg-amber-500 text-slate-950 hover:bg-amber-400" 
                  : "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                }
              `}
            >
              {isPlaying ? (
                <>
                  <Pause size={11} fill="currentColor" /> Pause Video
                </>
              ) : (
                <>
                  <Play size={11} fill="currentColor" /> Play 25s Demo
                </>
              )}
            </button>

            <button
              onClick={handleReset}
              className="p-1 px-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-full text-[10px] font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Replay Video"
            >
              <RotateCcw size={11} />
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: DETAILED SCENE TIMELINE & VO STUDIO CONTROLLER */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* CHARACTER PROFILE SUMMARY CARD */}
          <div className="bg-slate-950 border border-slate-800/80 p-3.5 rounded-2xl flex flex-wrap sm:flex-nowrap gap-3 items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 via-indigo-500 to-emerald-400 p-0.5 rounded-xl shrink-0 shadow">
              <div className="bg-slate-950 w-full h-full rounded-[10px] flex items-center justify-center">
                <User className="text-amber-400" size={20} />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider block font-bold">TALENT PROFILE CHARACTER</span>
                <span className="text-[9px] font-mono bg-amber-500/10 border border-amber-500/20 text-amber-300 px-1.5 py-0.1 rounded uppercase font-semibold">Active Studio</span>
              </div>
              <h4 className="text-xs font-bold text-white mt-0.5">{character.name} - {character.role}</h4>
              <p className="text-[10px] text-slate-400 mt-1 italic leading-normal">
                "{character.avatarDescription || 'A clean aesthetic presenter suited for selling viral trending items.'}"
              </p>
            </div>
          </div>

          {/* AUDIO SYNTHESIS CONTROLLER / SPEECH SYNTHESIS COMPATIBILITY INFO */}
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-[11px] space-y-2.5">
            <div className="flex justify-between items-center border-b border-indigo-500/10 pb-2">
              <span className="text-[10px] font-bold font-mono text-slate-300 tracking-wider flex items-center gap-1">
                <Sliders size={12} className="text-indigo-400" /> AUDIO SYNTHESIS MODULE
              </span>
              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.1 rounded border border-emerald-500/20">READY</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Volume Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Volume Tingkat VO</span>
                  <span>{Math.round(volume * 100)}%</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800/60 rounded-xl px-2 py-1.5 h-8">
                  <button 
                    onClick={() => setIsMuted(!isMuted)} 
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {isMuted || volume === 0 ? <VolumeX size={13} className="text-red-400" /> : <Volume2 size={13} />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      setVolume(parseFloat(e.target.value));
                      if (isMuted) setIsMuted(false);
                    }}
                    className="w-full accent-emerald-500 h-1 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Speech rate/speed settings */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Kecepatan Bicara (Rate)</span>
                  <span className="font-mono text-[10px] text-emerald-400 font-bold">{playbackRate}x</span>
                </div>
                <div className="grid grid-cols-4 gap-1 h-8">
                  {[0.8, 1.0, 1.2, 1.4].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => setPlaybackRate(rate)}
                      className={`text-[10px] font-mono font-bold rounded-lg border transition-all cursor-pointer
                        ${playbackRate === rate 
                          ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40" 
                          : "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-350"
                        }
                      `}
                    >
                      {rate === 1.0 ? "Normal" : `${rate}s`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <p className="text-[9px] text-slate-500 leading-normal border-t border-slate-900 pt-1.5">
              💡 <strong>Natural Voice Synthesis:</strong> Kami memodulasi Web Speech API untuk membacakan skrip dengan pitch {character.name.toLowerCase().includes("sarah") || character.name.toLowerCase().includes("ayu") ? "tinggi (wanita)" : "berat (pria)"}. Untuk kualitas vokal premium maksimal, pastikan Google Voice ID-ID terpasang di preferensi bahasa browser Anda.
            </p>
          </div>

          {/* DYNAMIC TIMELINE SCENE MANAGER (5 SCENES) */}
          <div className="space-y-2">
            <h5 className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-bold">PRODUKSI SEQUENCE (DURASI 25 DETIK)</h5>
            
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {scenes.map((scene, idx) => {
                const isActive = activeSceneIndex === idx;
                return (
                  <div
                    key={scene.id}
                    onClick={() => selectSceneDirectly(idx)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer group text-left
                      ${isActive 
                        ? "bg-slate-950 border-emerald-500/40 hover:border-emerald-500/50 shadow-md ring-1 ring-emerald-500/20" 
                        : "bg-slate-950/40 border-slate-900 hover:border-slate-800/80 hover:bg-slate-950/8s"
                      }
                    `}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-4 h-4 rounded-full font-mono text-[9px] font-bold flex items-center justify-center
                          ${isActive 
                            ? "bg-emerald-500 text-slate-950" 
                            : "bg-slate-900 border border-slate-800 text-slate-400"
                          }
                        `}>
                          {scene.id}
                        </span>
                        <span className={`text-[10px] font-bold font-mono
                          ${isActive ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-200"}
                        `}>
                          Scene {scene.id} ({scene.timeRange})
                        </span>
                      </div>
                      
                      {scene.sfx && (
                        <span className="text-[8px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.1 rounded uppercase tracking-wider">
                          Audio: {scene.sfx.replace(/[\[\]]/g, "")}
                        </span>
                      )}
                    </div>

                    <p className={`text-[11px] mt-1.5 leading-relaxed font-sans
                      ${isActive ? "text-slate-100 font-medium" : "text-slate-450 group-hover:text-slate-300"}
                    `}>
                      {scene.speech}
                    </p>

                    <div className="mt-1.5 pt-1.5 border-t border-slate-900 flex flex-wrap gap-2 justify-between items-center text-[9px] text-slate-500">
                      <span className="truncate max-w-[280px]">📸 Visual: <span className="text-slate-400 italic">{scene.visualPrompt}</span></span>
                      {isActive && (
                        <span className="text-emerald-400 font-mono animate-pulse font-bold flex items-center gap-0.5 shrink-0">
                          <Radio size={8} className="animate-pulse" /> Playing Live
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
      
    </div>
  );
}
