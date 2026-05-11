import { useState, useEffect, useRef } from "react";
import {
  Wrench, ArrowLeft, Cpu, Plus, Bot, Brain, X, Eye, Zap,
  Radio, MessageSquare, Rocket
} from "lucide-react";
import Robot3D from "../components/Robot3D";
import { useLegoHardware } from "../hooks/useLegoHardware";
import { useSocket } from "../hooks/useSocket";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface RobotBuild {
  id: string;
  name: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  parts: any[];
  steps: any[];
}

type ViewMode = "catalog" | "forge" | "launch" | "anvil";

export default function BuilderPage() {
  const { connectBLE, hubConnected, sendCommand } = useLegoHardware();
  const { send, on } = useSocket();
  const [sceneError, setSceneError] = useState(false);

  const [view, setView] = useState<ViewMode>("catalog");
  const [activeCategory, setActiveCategory] = useState<"builds" | "prompts" | "mcp">("builds");
  const [builds, setBuilds] = useState<RobotBuild[]>([]);
  const [purchasedPrompts, setPurchasedPrompts] = useState<any[]>([]);
  const [purchasedMCPs, setPurchasedMCPs] = useState<any[]>([]);
  const [selected, setSelected] = useState<RobotBuild | null>(null);

  // Launch State
  const [isContinuous, setIsContinuous] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const isStartingRef = useRef(false);
  const waitingForResponseRef = useRef(false);
  const [lastTranscript, setLastTranscript] = useState("");
  const [lastResponse, setLastResponse] = useState("");
  const [neuralStatus, setNeuralStatus] = useState<"IDLE" | "HEARING" | "REASONING" | "SPEAKING" | "ERROR">("IDLE");

  // Forge State
  const [customName, setCustomName] = useState("");
  const [customDesc, setCustomDesc] = useState("");
  const [customChassis, setCustomChassis] = useState<"lego" | "arduino" | "diy">("lego");
  const [aiPrompt, setAiPrompt] = useState("");
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [parts, setParts] = useState<any[]>([
    { id: "hub-1", type: "hub", position: [0, 0.25, 0], color: "#3b82f6", scale: [2, 0.5, 3] }
  ]);
  const [anvilMode, setAnvilMode] = useState<"3d" | "mcp" | "persona" | "listing">("3d");
  const [isHammering, setIsHammering] = useState(false);
  const [generatedListing, setGeneratedListing] = useState({ name: "", description: "", price: 0 });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetch("/api/builds")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setBuilds(data);
      })
      .catch(() => {});
    // Mock purchased data for now (to be replaced by real API)
    setPurchasedPrompts([
      { id: "p1", name: "Cyber Ninja", description: "Swift and silent logic", price: 50 },
      { id: "p2", name: "Wall-E Clone", description: "Curious and friendly collector", price: 50 }
    ]);
    setPurchasedMCPs([
      { id: "m1", name: "Weather Core", description: "Real-time weather API integration", price: 150 },
      { id: "m2", name: "Smart Home Link", description: "Control IoT devices via robot", price: 150 }
    ]);
  }, []);

  useEffect(() => {
    on("robot_chat_response", (reply: any) => {
      setChatHistory(prev => [...prev, { role: "assistant", content: reply.text }]);
      setIsThinking(false);
    });
    on("chat_history", (history: ChatMessage[]) => {
      setChatHistory(history);
    });
    on("thinking", () => setIsThinking(true));
  }, [on]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleLaunch = async (robot: RobotBuild) => {
    setSelected(robot);
    setParts(robot.parts || []);
    setCustomName(robot.name);

    // Request history from server
    send("get_chat_history", { robotId: robot.id });

    // Transition immediately to launch view for better UX
    setView("launch");

    // Attempt to connect in background if not already connected
    if (!hubConnected) {
      connectBLE().catch(err => {
        console.warn("Background BLE connection failed", err);
      });
    }
  };


  const speakText = (text: string) => {
    if (!text) return;
    // Use Native Android TTS bridge (works in Capacitor WebView)
    if ((window as any).NativeTTS) {
      (window as any).NativeTTS.speak(text);
    } else if (window.speechSynthesis) {
      // Fallback for browser dev
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ru-RU';
      utterance.rate = 1.0;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  };

  const startContinuousListening = () => {
    if (!isContinuous) return;
    // Don't restart listening while waiting for AI response
    if (waitingForResponseRef.current) return;
    
    // Use Native Bridge instead of Web API
    if ((window as any).NativeSpeech) {
      setNeuralStatus("HEARING");
      (window as any).NativeSpeech.start();
    } else {
      console.warn("NativeSpeech bridge not found");
      // Fallback to Web API just in case for development
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.lang = 'ru-RU';
        rec.onstart = () => setNeuralStatus("HEARING");
        rec.onresult = (e: any) => {
          const t = e.results[0][0].transcript;
          if (t.trim()) {
            setLastTranscript(t);
            setNeuralStatus("REASONING");
            waitingForResponseRef.current = true;
            send("robot_chat", { message: t, robotId: selected?.id });
          }
        };
        rec.onend = () => {
          // Only restart if continuous AND not waiting for AI response
          if (isContinuous && !waitingForResponseRef.current) {
            setTimeout(startContinuousListening, 1000);
          }
        };
        rec.start();
      }
    }
  };

  // Listen for Native Speech Events
  useEffect(() => {
    const handleNativeSpeech = (e: any) => {
      const { event, data } = e.detail;
      if (event === "onstart" && !waitingForResponseRef.current) setNeuralStatus("HEARING");
      if (event === "onend" && isContinuous && !waitingForResponseRef.current) setTimeout(startContinuousListening, 1000);
      if (event === "onerror") {
        console.warn("Native Speech Error:", data);
        if (isContinuous) setTimeout(startContinuousListening, 2000);
      }
      if (event === "onresult") {
        if (data.trim()) {
          setLastTranscript(data);
          setNeuralStatus("REASONING");
          waitingForResponseRef.current = true;
          setChatHistory(prev => [...prev, { role: "user", content: data }]);
          send("robot_chat", {
            message: data,
            robotId: selected?.id,
            robotConfig: { id: selected?.id, parts: parts, type: customChassis }
          });
        }
      }
    };

    window.addEventListener("native-speech" as any, handleNativeSpeech);
    return () => window.removeEventListener("native-speech" as any, handleNativeSpeech);
  }, [isContinuous, selected, parts, customChassis, send]);

  useEffect(() => {
    if (!isContinuous) {
      setNeuralStatus("IDLE");
      stopListening();
      if ((window as any)._visionInterval) clearInterval((window as any)._visionInterval);
    }
    return () => stopListening();
  }, [isContinuous]);

  useEffect(() => {
    const handleSpeak = (payload: any) => {
      if (payload?.text) speakText(payload.text);
    };
    const unsubSpeak = on("speak", handleSpeak);
    const unsubChat = on("robot_chat_response", (payload: any) => {
      waitingForResponseRef.current = false;
      if (payload?.error) {
        setNeuralStatus("ERROR");
        setLastResponse(payload?.text || "Error");
        setTimeout(() => setNeuralStatus("IDLE"), 3000);
        return;
      }
      if (payload?.text) {
        setLastResponse(payload.text);
        setNeuralStatus("SPEAKING");
        speakText(payload.text);
        // Execute any motor actions from AI
        if (payload.actions?.length) {
          payload.actions.forEach((action: any) => {
            sendCommand(action.name || "motor", action.params || {});
          });
        }
        // After speaking, go back to hearing if continuous
        setTimeout(() => {
          if (isContinuous) {
            setNeuralStatus("HEARING");
            startContinuousListening();
          } else {
            setNeuralStatus("IDLE");
          }
        }, payload.text.length * 80 + 1000);
      }
    });
    return () => {
      if (unsubSpeak) unsubSpeak();
      if (unsubChat) unsubChat();
    };
  }, [on, isContinuous]);

  // Orientation Streamer
  useEffect(() => {
    if (view !== "launch") return;
    const handleOrientation = (e: DeviceOrientationEvent) => {
      send("orientation", {
        alpha: e.alpha,
        beta: e.beta,
        gamma: e.gamma
      });
    };
    window.addEventListener("deviceorientation", handleOrientation);
    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
      if ((window as any)._visionInterval) clearInterval((window as any)._visionInterval);
    };
  }, [view, send]);

  const startCamera = async () => {
    try {
      if (!videoRef.current?.srcObject) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "environment", width: 400, height: 300 } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.warn("Cam play fail", e));
          
          if ((window as any)._visionInterval) clearInterval((window as any)._visionInterval);
          (window as any)._visionInterval = setInterval(() => {
            if (videoRef.current && captureCanvasRef.current) {
              const canvas = captureCanvasRef.current;
              const ctx = canvas.getContext("2d");
              if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                const frame = canvas.toDataURL("image/jpeg", 0.5);
                send("frame", frame);
              }
            }
          }, 1500);
        }
      }
    } catch (e) {
      console.warn("Manual camera start failed", e);
    }
  };

  // Keep cleanup but remove auto-start
  useEffect(() => {
    return () => {
      if ((window as any)._visionInterval) clearInterval((window as any)._visionInterval);
    };
  }, []);

  const addPart = (type: string) => {
    const newPart = {
      id: `${type}-${Date.now()}`,
      type: type,
      position: [0, 1, 0],
      color: type === 'motor' ? "#ef4444" : type === 'sensor' ? "#10b981" : "#3b82f6",
      scale: type === 'block' ? [1, 0.5, 1] : [0.5, 0.5, 0.5]
    };
    setParts([...parts, newPart]);
  };

  // Rendering Catalog View
  const renderCatalog = () => (
    <div className="max-w-6xl mx-auto px-6 py-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-12">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full mb-4">
            <Radio className="w-3 h-3 text-purple-400" />
            <span className="text-[10px] font-black text-purple-300 uppercase tracking-widest text-white">Neural Network Active</span>
          </div>
          <h1 className="text-6xl font-black text-white uppercase tracking-tighter leading-[0.8] mb-4 italic">
            Robot <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">Catalog</span>
          </h1>
        </div>
        <div className="flex items-center gap-6">
          <button
            onClick={() => setView("anvil")}
            className="px-8 py-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-orange-900/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
          >
            <Wrench className="w-4 h-4" /> Open Neural Anvil
          </button>
          <button
            onClick={() => { setSelected(null); setParts([{ id: "hub-1", type: "hub", position: [0, 0.25, 0], color: "#3b82f6", scale: [2, 0.5, 3] }]); setView("forge"); }}
            className="px-8 py-3 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-gray-200 transition-all flex items-center gap-3"
          >
            <Plus className="w-4 h-4" /> Start Blank Build
          </button>
        </div>
      </div>

      <div className="flex gap-8 border-b border-gray-800 mb-8">
        {[
          { id: "builds", label: "Robot Builds", icon: <Bot className="w-4 h-4" /> },
          { id: "prompts", label: "AI Personas", icon: <Brain className="w-4 h-4" /> },
          { id: "mcp", label: "MCP Tools", icon: <Zap className="w-4 h-4" /> },
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id as any)}
            className={`flex items-center gap-2 pb-4 text-sm font-black uppercase tracking-widest transition-all relative ${activeCategory === cat.id ? 'text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
          >
            {cat.icon}
            {cat.label}
            {activeCategory === cat.id && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500 rounded-full" />
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeCategory === "builds" && Array.isArray(builds) && builds.map(b => (
          <div key={b.id} className="group bg-gray-900 border border-gray-800 rounded-[2rem] p-8 hover:border-purple-500/50 transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 blur-3xl -mr-16 -mt-16" />
            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">{b.name}</h3>
            <p className="text-xs text-gray-500 mb-6 line-clamp-2">{b.description}</p>
            <div className="flex gap-2">
              <button
                onClick={() => handleLaunch(b)}
                className="flex-1 py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
              >
                Launch Mission
              </button>
              <button
                onClick={() => { setSelected(b); setParts(b.parts); setView("forge"); }}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-500 transition-all text-[10px] font-black uppercase tracking-widest"
              >
                <Wrench className="w-4 h-4" /> Edit
              </button>
            </div>
          </div>
        ))}
        {activeCategory === "prompts" && Array.isArray(purchasedPrompts) && purchasedPrompts.map(p => (
          <div key={p.id} className="bg-gray-900/50 border border-gray-800 border-dashed rounded-[2rem] p-8">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-4">
              <Brain className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-black text-white uppercase tracking-tighter mb-1">{p.name}</h3>
            <p className="text-[10px] text-gray-500 mb-4 uppercase tracking-widest">Active Neural Persona</p>
            <button className="w-full py-2 bg-gray-800 text-gray-400 rounded-lg text-[8px] font-black uppercase tracking-widest cursor-default">
              Purchased & Ready
            </button>
          </div>
        ))}
        {activeCategory === "mcp" && Array.isArray(purchasedMCPs) && purchasedMCPs.map(m => (
          <div key={m.id} className="bg-gray-900/50 border border-gray-800 border-dashed rounded-[2rem] p-8">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-black text-white uppercase tracking-tighter mb-1">{m.name}</h3>
            <p className="text-[10px] text-gray-500 mb-4 uppercase tracking-widest">Global Tool Link</p>
            <button className="w-full py-2 bg-gray-800 text-gray-400 rounded-lg text-[8px] font-black uppercase tracking-widest cursor-default">
              Active in Sandbox
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  // Rendering Launch View (The Eyes)
  const renderLaunch = () => (
    <div className="h-screen bg-black flex flex-col overflow-hidden">
      {/* Eye Section - Full Height focused */}
      <div className="flex-1 relative flex flex-col items-center justify-center bg-gray-950 overflow-hidden">
        <div className="flex gap-10 md:gap-20">
          <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-cyan-500 shadow-[0_0_80px_rgba(6,182,212,0.6)] flex items-center justify-center relative overflow-hidden">
            <div className={`w-12 h-12 md:w-20 md:h-20 bg-black rounded-full transition-all duration-300 ${isThinking ? 'scale-110 blur-sm' : 'animate-pulse'}`} />
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/50 to-transparent" />
          </div>
          <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-cyan-500 shadow-[0_0_80px_rgba(6,182,212,0.6)] flex items-center justify-center relative overflow-hidden">
            <div className={`w-12 h-12 md:w-20 md:h-20 bg-black rounded-full transition-all duration-300 ${isThinking ? 'scale-110 blur-sm' : 'animate-pulse'}`} />
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/50 to-transparent" />
          </div>
        </div>

        {/* Neural Status Bar */}
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex flex-col items-center pointer-events-none mt-40">
           <div className={`px-6 py-2 rounded-full border backdrop-blur-xl transition-all duration-500 flex items-center gap-3 ${
             neuralStatus === "HEARING" ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-400" :
             neuralStatus === "REASONING" ? "bg-purple-500/10 border-purple-500/40 text-purple-400" :
             neuralStatus === "SPEAKING" ? "bg-green-500/10 border-green-500/40 text-green-400" :
             "bg-gray-900/40 border-gray-800 text-gray-500"
           }`}>
              <div className={`w-2 h-2 rounded-full ${
                neuralStatus === "HEARING" ? "bg-cyan-500 animate-ping" :
                neuralStatus === "REASONING" ? "bg-purple-500 animate-bounce" :
                neuralStatus === "SPEAKING" ? "bg-green-500 animate-pulse" :
                "bg-gray-700"
              }`} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                {neuralStatus === "IDLE" ? "Neural Link Standby" : `${neuralStatus}...`}
              </span>
           </div>
           
           {lastTranscript && neuralStatus !== "IDLE" && (
             <div className="mt-4 max-w-md px-8 text-center animate-in fade-in slide-in-from-bottom-4">
                <p className="text-[10px] text-white/40 font-medium italic">"{lastTranscript}"</p>
             </div>
           )}
           {lastResponse && (neuralStatus === "SPEAKING" || neuralStatus === "IDLE") && (
             <div className="mt-3 max-w-md px-6 py-3 bg-black/60 backdrop-blur-xl rounded-2xl border border-cyan-500/20 text-center">
                <p className="text-xs text-cyan-300 font-medium leading-relaxed">{lastResponse}</p>
             </div>
           )}
        </div>

        {/* Controls Overlay - Elevated Z-Index */}
        <div className="absolute top-8 left-8 right-8 flex items-center justify-between z-[9999] pointer-events-auto">
          <div className="flex items-center gap-4">
            <button onClick={() => { setIsContinuous(false); setView("catalog"); }} className="p-3 bg-black/50 hover:bg-red-500/20 rounded-2xl text-white transition-all border border-white/5">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="px-4 py-2 bg-black/50 backdrop-blur-md rounded-2xl border border-white/10">
              <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">{selected?.name}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <button 
                onClick={() => window.location.href = '/phone'}
                className="px-4 py-3 bg-red-600/80 hover:bg-red-500 rounded-2xl text-white font-black uppercase tracking-widest text-[10px] transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] border border-red-400 flex items-center gap-2"
              >
                <div className="w-2 h-2 rounded-full bg-white animate-ping" />
                ⚡ True Live API
             </button>
             {/* Mini Camera Preview */}
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-black border-2 border-cyan-500/30 overflow-hidden shadow-2xl shadow-cyan-900/20 relative group">
               <video 
                ref={videoRef} 
                className="w-full h-full object-cover" 
                autoPlay 
                playsInline 
                muted 
               />
               <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 bg-black/60 rounded-full border border-white/10">
                  <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-[6px] font-black text-white uppercase tracking-tighter">Live Eye</span>
               </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border ${hubConnected ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${hubConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                <span className="text-[8px] font-black uppercase tracking-widest">{hubConnected ? 'Hub Stable' : 'Hub Offline'}</span>
              </div>
            <button 
              onClick={() => {
                if (!isContinuous) {
                  if ((window as any).NativeSpeech) {
                    (window as any).NativeSpeech.start();
                  } else {
                    startContinuousListening();
                  }
                  setIsContinuous(true);
                  startCamera(); 
                } else {
                  if ((window as any).NativeSpeech) (window as any).NativeSpeech.stop();
                  setIsContinuous(false);
                  isStartingRef.current = false;
                  stopListening();
                }
              }}
                className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${isContinuous ? 'bg-orange-500 text-white animate-pulse shadow-lg shadow-orange-900/40' : 'bg-gray-800 text-gray-400'}`}
              >
                {isContinuous ? 'Link Running' : 'Start Neural Link'}
              </button>
            </div>
          </div>
        </div>

        {/* Big Terminate Button at the bottom */}
        <div className="absolute bottom-12 w-full flex justify-center px-8">
           <button 
            onClick={() => { setIsContinuous(false); setView("catalog"); }}
            className="w-full max-w-md py-6 bg-red-600 hover:bg-red-500 text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] transition-all shadow-2xl shadow-red-900/40 active:scale-95 flex items-center justify-center gap-3"
           >
             <X className="w-5 h-5" />
             Terminate Neural Transmission
           </button>
        </div>
      </div>
    </div>
  );

  // Forge View (Existing logic mostly)
  const renderForge = () => (
    <div className="min-h-screen lg:h-[calc(100vh-4rem)] bg-gray-950 flex flex-col font-sans overflow-y-auto lg:overflow-hidden">
      {/* Forge Header */}
      <div className="h-20 border-b border-gray-800 bg-gray-900/80 backdrop-blur-xl flex items-center justify-between px-8 shrink-0 relative z-50">
        <div className="flex items-center gap-8">
          <button onClick={() => setView("catalog")} className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:rotate-12 transition-all">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-black text-white uppercase tracking-tighter leading-none">Neural Forge</span>
              <span className="text-[8px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-1">Editing Mode</span>
            </div>
          </button>
          <div className="h-8 w-[1px] bg-gray-800" />
          <div className="flex items-center gap-2 p-1 bg-black/40 rounded-xl border border-gray-800">
            {["lego", "arduino", "diy"].map(t => (
              <button
                key={t}
                onClick={() => setCustomChassis(t as any)}
                className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${customChassis === t ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40' : 'text-gray-500 hover:text-white'
                  }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={async () => {
              const token = localStorage.getItem("token");
              await fetch("/api/social/share", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ name: customName || "Custom Build", parts })
              });
              alert("Build shared to Neural Feed! 🚀");
            }}
            className="px-6 py-2 bg-purple-600/20 border border-purple-500/30 text-purple-400 hover:bg-purple-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" /> Share Build
          </button>
          <button
            onClick={() => setView("catalog")}
            className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            Save & Close
          </button>
          <button
            onClick={() => handleLaunch({ id: "custom-" + Date.now(), name: customName || "Custom Build", parts, description: customDesc, difficulty: "medium", steps: [] })}
            className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-green-900/40 flex items-center gap-2"
          >
            <Rocket className="w-4 h-4" /> Launch Mission
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden relative">
        {/* Left Sidebar: Assets */}
        <div className="w-full lg:w-72 border-r border-gray-800 bg-gray-950 flex flex-col z-40">
          <div className="p-6 border-b border-gray-800 flex items-center justify-between">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Part Library</h3>
            <Plus className="w-3 h-3 text-gray-600" />
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            <button
              onClick={() => {
                setIsHammering(true);
                setTimeout(() => {
                  addPart("block");
                  setIsHammering(false);
                }, 800);
              }}
              className={`w-full p-4 mb-6 bg-gradient-to-br from-orange-500 to-red-600 rounded-[1.5rem] border border-orange-400/30 flex flex-col items-center justify-center gap-3 transition-all active:scale-95 ${isHammering ? 'animate-bounce shadow-[0_0_30px_rgba(234,88,12,0.4)]' : 'hover:shadow-lg'}`}
            >
               <Wrench className={`w-6 h-6 text-white ${isHammering ? 'animate-spin' : ''}`} />
               <span className="text-[10px] font-black text-white uppercase tracking-widest">Forge Neural Asset</span>
            </button>

            {[
              { name: "Neural Hub", type: "hub", icon: <Cpu className="w-5 h-5" />, color: "text-blue-400" },
              { name: "Power Motor", type: "motor", icon: <Bot className="w-5 h-5" />, color: "text-red-400" },
              { name: "Optical Sensor", type: "sensor", icon: <Eye className="w-5 h-5" />, color: "text-green-400" },
              { name: "Logic Block", type: "block", icon: <Brain className="w-5 h-5" />, color: "text-purple-400" },
            ].map((asset, i) => (
              <button
                key={i}
                onClick={() => addPart(asset.type)}
                className="w-full text-left p-4 bg-gray-900/40 border border-gray-800 rounded-[1.5rem] hover:border-white/20 transition-all group"
              >
                <div className={`w-10 h-10 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center ${asset.color} mb-3 group-hover:scale-110 transition-transform`}>
                  {asset.icon}
                </div>
                <span className="block text-[10px] font-black text-white uppercase tracking-tight">{asset.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Center: 3D Viewport */}
        <div className="flex-1 relative bg-black overflow-hidden h-1/2 lg:h-full">
          {sceneError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
               <Brain className="w-12 h-12 text-red-500 mb-4" />
               <h3 className="text-white font-black uppercase">Neural Scene Failed</h3>
               <p className="text-gray-500 text-xs mt-2">The 3D engine encountered a link error on this device.</p>
               <button onClick={() => setSceneError(false)} className="mt-6 px-6 py-2 bg-purple-600 rounded-xl text-[10px] font-black uppercase">Retry Link</button>
            </div>
          ) : (
            <Robot3D
              type="custom"
              parts={parts}
              onPartSelect={(id) => setSelectedPartId(id)}
              onPartMove={(id, axis, val) => {
                setParts(prev => prev.map(p => {
                  if (p.id !== id) return p;
                  const newPos = [...p.position] as [number, number, number];
                  const idx = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
                  newPos[idx] = val;
                  return { ...p, position: newPos };
                }));
              }}
              onPartScale={(id, axis, val) => {
                setParts(prev => prev.map(p => {
                  if (p.id !== id) return p;
                  const newScale = [...(p.scale || [1, 0.5, 1])] as [number, number, number];
                  const idx = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
                  newScale[idx] = val;
                  return { ...p, scale: newScale };
                }));
              }}
            />
          )}
        </div>

        {/* Right Sidebar: Config & AI */}
        <div className={`w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-gray-800 bg-gray-950 p-6 md:p-8 space-y-8 overflow-y-auto z-40 ${view === 'anvil' ? 'block' : 'hidden lg:block'}`}>
          <section className="space-y-4">
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">Identity Settings</h3>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Build Designation..."
              className="w-full bg-gray-900 border border-gray-800 rounded-2xl px-5 py-3 text-sm text-white font-black uppercase tracking-tighter outline-none"
            />
            <textarea
              value={customDesc}
              onChange={(e) => setCustomDesc(e.target.value)}
              rows={2}
              className="w-full bg-gray-900 border border-gray-800 rounded-2xl px-5 py-3 text-[10px] text-gray-400 font-medium leading-relaxed outline-none resize-none"
              placeholder="Define the mission objective..."
            />
          </section>

          <section className="space-y-6">
            <h3 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2 italic">
              <Brain className="w-4 h-4" /> Neural Pulse
            </h3>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="AI Persona or Assembly Instructions..."
              className="w-full bg-black border border-gray-800 rounded-2xl px-6 py-4 text-[10px] text-white leading-relaxed outline-none focus:border-purple-500 resize-none"
            />
          </section>

          {selectedPartId && (
            <section className="p-8 bg-gray-900 border border-gray-800 rounded-[2.5rem] space-y-8 animate-in slide-in-from-right-8">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white uppercase tracking-widest">
                  {parts.find(p => p.id === selectedPartId)?.type?.toUpperCase()} Config
                </span>
                <button onClick={() => setSelectedPartId(null)} className="text-gray-600 hover:text-white"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {["A", "B", "C", "D", "E", "F"].map(port => (
                  <button
                    key={port}
                    onClick={() => {
                      setParts(prev => prev.map(p => p.id === selectedPartId ? { ...p, properties: { ...(p.properties || {}), port } } : p));
                    }}
                    className={`py-3 rounded-xl text-[10px] font-black transition-all border ${parts.find(p => p.id === selectedPartId)?.properties?.port === port
                        ? 'bg-white border-white text-black shadow-xl'
                        : 'bg-black/40 border-gray-800 text-gray-500 hover:border-gray-600'
                      }`}
                  >
                    Port {port}
                  </button>
                ))}
              </div>
              <button
                onClick={() => { setParts(prev => prev.filter(p => p.id !== selectedPartId)); setSelectedPartId(null); }}
                className="w-full py-3 bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white rounded-xl text-[8px] font-black uppercase tracking-widest transition-all"
              >
                Remove Component
              </button>
            </section>
          )}
        </div>
      </div>
    </div>
  );

  const renderAnvil = () => (
    <div className="h-screen bg-black flex flex-col font-sans animate-in zoom-in-95 duration-500">
      <div className="h-20 border-b border-orange-900/30 bg-gray-900/90 backdrop-blur-xl flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-6">
          <button onClick={() => setView("catalog")} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <h2 className="text-2xl font-black text-orange-500 uppercase tracking-tighter italic">Neural Anvil</h2>
            <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">AI Refinement & Marketplace Preparation</span>
          </div>
        </div>
        <div className="flex items-center gap-3 p-1 bg-black/60 rounded-2xl border border-orange-900/20">
          {[
            { id: "3d", label: "3D Tune" },
            { id: "mcp", label: "Tooling" },
            { id: "persona", label: "Character" },
            { id: "listing", label: "Listing" }
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setAnvilMode(m.id as any)}
              className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${anvilMode === m.id ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <button 
          onClick={() => { alert("Robot forged successfully!"); setView("catalog"); }}
          className="px-8 py-3 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all"
        >
          Finalize Forge
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-900/10 via-black to-black">
          <Robot3D parts={parts} editable={false} />
          
          <div className="absolute top-12 left-12 p-8 bg-black/40 backdrop-blur-3xl border border-orange-500/20 rounded-[3rem] max-w-sm">
             <div className="w-12 h-12 bg-orange-600/20 rounded-2xl flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-orange-500 animate-pulse" />
             </div>
             <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Neural Optimization</h3>
             <p className="text-xs text-gray-400 leading-relaxed font-medium">The Anvil is analyzing your assembly. Component efficiency is currently at <span className="text-orange-500 font-black">94.2%</span>. Use AI to refine the mission profile.</p>
          </div>
        </div>

        <div className="w-96 border-l border-orange-900/30 bg-gray-900/40 backdrop-blur-xl p-8 overflow-y-auto custom-scrollbar">
          {anvilMode === "listing" ? (
             <div className="space-y-8 animate-in slide-in-from-right-8">
                <div className="space-y-4">
                   <h3 className="text-[10px] font-black text-orange-400 uppercase tracking-widest italic">Marketplace Assistant</h3>
                   <button 
                    onClick={() => {
                      setIsThinking(true);
                      setTimeout(() => {
                        setGeneratedListing({
                          name: customName || "AURORA X-1",
                          description: `A high-performance ${customChassis} unit optimized for neural operations. Features ${parts.length} specialized modules.`,
                          price: parts.length * 250
                        });
                        setIsThinking(false);
                      }, 1500);
                    }}
                    className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-orange-900/20"
                   >
                     {isThinking ? "Analyzing Assembly..." : "Generate Pro Listing"}
                   </button>
                </div>

                {generatedListing.name && (
                  <div className="p-8 bg-black/60 border border-orange-500/30 rounded-[2.5rem] space-y-6">
                     <div>
                        <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Proposed Name</span>
                        <h4 className="text-2xl font-black text-white uppercase tracking-tighter">{generatedListing.name}</h4>
                     </div>
                     <div>
                        <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Mission Bio</span>
                        <p className="text-[11px] text-gray-400 leading-relaxed italic">"{generatedListing.description}"</p>
                     </div>
                     <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                        <div className="text-2xl font-black text-orange-500 tracking-tighter italic">{generatedListing.price} ₿</div>
                        <button 
                          onClick={() => {
                            setCustomName(generatedListing.name);
                            setCustomDesc(generatedListing.description);
                            alert("Marketplace metadata applied to your build!");
                          }}
                          className="px-6 py-2 bg-white text-black rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                        >
                          Apply to Build
                        </button>
                     </div>
                  </div>
                )}
             </div>
          ) : (
            <div className="h-full flex items-center justify-center text-center px-6">
               <div className="space-y-4 opacity-40">
                  <Wrench className="w-12 h-12 text-gray-600 mx-auto" />
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Select an optimization mode to refine your neural entity.</p>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950">
      {view === "catalog" && renderCatalog()}
      {view === "forge" && renderForge()}
      {view === "launch" && renderLaunch()}
      {view === "anvil" && renderAnvil()}

      {/* Hidden Samplers */}
      <video ref={videoRef} className="hidden" playsInline muted />
      <canvas ref={captureCanvasRef} className="hidden" width={400} height={300} />
    </div>
  );
}
