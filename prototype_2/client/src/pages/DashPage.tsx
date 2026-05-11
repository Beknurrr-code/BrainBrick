import { useState, useRef, useEffect, Suspense } from "react";
import { useSocket } from "../hooks/useSocket";
import { useLegoHardware } from "../hooks/useLegoHardware";
import {
  Bluetooth, Cpu, Eye,
  Zap, Bot,
  MessageSquare,
  Plus, Wrench, Heart,
  Activity, Mic, Brain, Send
} from "lucide-react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Stars, Float, ContactShadows, Environment } from "@react-three/drei";
import * as THREE from "three";
import WithdrawModal from "../components/WithdrawModal";
import TopUpModal from "../components/TopUpModal";

function RobotModel({ rotation }: { rotation: { x: number; y: number; z: number } }) {
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y = THREE.MathUtils.degToRad(rotation.z); // Alpha
      meshRef.current.rotation.x = THREE.MathUtils.degToRad(rotation.x); // Beta
      meshRef.current.rotation.z = -THREE.MathUtils.degToRad(rotation.y); // Gamma
    }
  });

  return (
    <group ref={meshRef}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1, 1.2, 0.6]} />
        <meshStandardMaterial color="#312e81" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[0.8, 0.4, 0.1]} />
        <meshStandardMaterial color="#1e1b4b" emissive="#4f46e5" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[-0.2, 0.85, 0.06]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={2} />
      </mesh>
      <mesh position={[0.2, 0.85, 0.06]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={2} />
      </mesh>
      <mesh position={[-0.4, -0.6, 0]}>
        <boxGeometry args={[0.3, 0.4, 0.8]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
      <mesh position={[0.4, -0.6, 0]}>
        <boxGeometry args={[0.3, 0.4, 0.8]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
    </group>
  );
}

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

interface ActionLog {
  time: string;
  type: "move" | "speak" | "vision" | "sensor" | "code" | "system";
  message: string;
}


export default function DashPage() {
  


  const { send, on, connected } = useSocket();
  const { connectBLE, disconnect, hubConnected } = useLegoHardware();
  const [activeRobot] = useState<string>("rover");
  const [myBuilds, setMyBuilds] = useState<any[]>([
    { id: "rover", name: "Alpha Rover", type: "rover", icon: Bot, color: "text-blue-400" },
    { id: "arm", name: "Heavy Lifter", type: "arm", icon: Wrench, color: "text-red-400" },
    { id: "pet", name: "Friendly Dog", type: "pet", icon: Heart, color: "text-purple-400" }
  ]);

  const [thinking, setThinking] = useState<string[]>([]);
  const [aiTier, setAiTier] = useState<"standard" | "pro" | "elite">("standard");
  const [viewMode, setViewMode] = useState<"hud" | "twin">("hud");
  const [orientation, setOrientation] = useState({ x: 0, y: 0, z: 0 });
  const [liveModeActive, setLiveModeActive] = useState(false);
  const [bricks, setBricks] = useState(0);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showTopUp, setShowTopUp] = useState(false);

  
  const [customKey] = useState("");
  const [customUrl] = useState("");
  const [useCustomApi] = useState(false);
  
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null); 
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
       window.speechSynthesis.onvoiceschanged = () => { /* update handled if needed */ };
    }
    
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
        .then(stream => {
          if (videoRef.current) videoRef.current.srcObject = stream;
          videoRef.current?.play();
        });
    }
  }, []);

  useEffect(() => {
    const captureFrame = () => {
      if (videoRef.current && captureCanvasRef.current && connected && liveModeActive) {
        const canvas = captureCanvasRef.current;
        const context = canvas.getContext('2d');
        if (context) {
          context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          const frame = canvas.toDataURL('image/jpeg', 0.5);
          send("vision_frame", frame);
        }
      }
    };
    const interval = setInterval(captureFrame, 1000); 
    return () => clearInterval(interval);
  }, [connected, liveModeActive, send]);

  useEffect(() => {
    const handleZai = () => {
      setAiTier("elite");
      setMessages(prev => [...prev, { role: "assistant", content: "⚡ System overridden by Z.ai Console Command. Flagship Gemini Robotics ER 1.6 active." }]);
    };
    window.addEventListener('zai-activate', handleZai);
    return () => window.removeEventListener('zai-activate', handleZai);
  }, []);

  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initDashboard = async () => {
      try {
        JSON.parse(localStorage.getItem("user") || "{}");

        const buildsRes = await fetch("/api/builds");
        const buildsData = await buildsRes.json();
        if (Array.isArray(buildsData)) {
          const formatted = buildsData.map((b: any) => ({
            id: b.id,
            name: b.name,
            type: b.type || "rover",
            icon: b.type === "arm" ? Wrench : b.type === "pet" ? Heart : Bot,
            color: "text-purple-400"
          }));
          setMyBuilds(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const uniqueNew = formatted.filter((f: any) => !existingIds.has(f.id));
            return [...prev, ...uniqueNew];
          });
        }
      } catch (err) {
        console.error("Failed to fetch builds:", err);
      }

      try {
        const profileRes = await fetch("/api/user/profile");
        const profile = await profileRes.json();
        if (profile) {
          if (profile.bricks !== undefined) setBricks(profile.bricks);
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };
    initDashboard();
  }, []);

  useEffect(() => {
    on("frame", (payload: any) => { if (imgRef.current) imgRef.current.src = payload; });
    on("thinking", (payload: any) => { 
      if (payload?.text) setThinking(prev => [...prev, payload.text]); 
    });
    on("ai_response", (payload: any) => {
      setThinking([]);
      if (payload.code) {
        addLog("code", "AI wrote a logic script!");
      }
    });
    on("robot_chat_response", (payload: any) => {
      setMessages(prev => [...prev, { role: "assistant", content: payload.text }]);
      if (payload.actions) {
        payload.actions.forEach((a: any) => addLog("system", `Executing ${a.name}...`));
      }
    });
    on("speak", (payload: any) => { if (payload?.text) addLog("speak", payload.text); });
    on("orientation", (payload: any) => {
      setOrientation({
        x: payload.beta || 0,
        y: payload.gamma || 0,
        z: payload.alpha || 0
      });
    });
    
    on("live_status", (payload: any) => {
      setLiveModeActive(payload.status === "Streaming");
      addLog("system", `Live Session Status: ${payload.status}`);
    });

    on("expert_handoff", (payload: any) => {
      addLog("system", `🛡️ EXPERT MODE: ${payload.task}`);
    });

    on("execution_result", () => {
      addLog("system", "✅ Expert execution completed.");
    });
    
    on("play_media", (payload: any) => {
      addLog("system", `📺 Opening Media: ${payload.title}`);
      window.open(payload.url, '_blank');
    });

    on("vision_detect", (payload: any) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      payload.objects?.forEach((obj: any) => {
        ctx.strokeStyle = "#a855f7"; 
        ctx.lineWidth = 3;
        ctx.strokeRect(obj.x, obj.y, obj.w, obj.h);
        ctx.fillStyle = "#a855f7";
        ctx.font = "10px Inter, sans-serif";
        ctx.fillText(`${obj.label} ${Math.round(obj.confidence * 100)}%`, obj.x, obj.y - 5);
      });
      
      setTimeout(() => {
        const c = canvasRef.current;
        if (c) c.getContext("2d")?.clearRect(0, 0, c.width, c.height);
      }, 2000);
    });

    (window as any).glm = () => {
      setAiTier("elite");
      addLog("system", "🚀 GEMINI ROBOTICS ER 1.6 FLAGSHIP PROTOCOL ACTIVATED");
    };

    (window as any).live = () => {
      send("trigger_live");
      addLog("system", "📡 INITIALIZING GEMINI MULTIMODAL LIVE STREAM...");
    };

    return () => {
      delete (window as any).glm;
      delete (window as any).live;
    };
  }, [on, send, connected, activeRobot, aiTier, liveModeActive]);

  const addLog = (type: ActionLog["type"], message: string) => {
    const now = new Date();
    const time = now.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const date = now.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    setActionLogs((prev) => [{ time: `${date} ${time}`, type, message }, ...prev].slice(0, 50));
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    const activeConfig = myBuilds.find(b => b.id === activeRobot);
    setMessages(prev => [...prev, { role: "user", content: msg }]);
    
    const customConfig = useCustomApi ? { apiKey: customKey, providerUrl: customUrl } : null;
    
    send("robot_chat", { 
      message: msg, 
      robotType: activeRobot, 
      robotConfig: activeConfig,
      tier: aiTier,
      customConfig
    });
    setChatInput("");
    addLog("system", `User: ${msg}`);
  };

  const toggleBluetooth = async () => {
    if (hubConnected) {
      await disconnect();
      addLog("system", "Hardware Disconnected.");
    } else {
      addLog("system", "Searching for LEGO Hub...");
      const success = await connectBLE();
      if (success) {
        addLog("system", "LEGO Mindstorms Hub Connected via Web Bluetooth!");
      } else {
        addLog("system", "BLE Connection failed or canceled.");
      }
    }
  };

  const speakText = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    utterance.rate = 1.0;
    utterance.pitch = 1.1; 
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = 'ru-RU';
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setChatInput(transcript);
      if (transcript.length > 3) {
         setTimeout(() => handleSendChat(), 500);
      }
    };
    recognition.start();
  };

  useEffect(() => {
    const handleSpeak = (payload: any) => { if (payload?.text) speakText(payload.text); };
    on("speak", handleSpeak);
    on("robot_chat_response", (payload: any) => { if (payload?.text) speakText(payload.text); });
  }, [on]);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-gray-950 font-roboto overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-black to-black pointer-events-none" />

      <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden p-4 lg:p-6 gap-6 relative z-10">
        {!connected && !hubConnected && (
           <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none">
              <div className="px-6 py-3 bg-gray-900 border border-white/10 rounded-2xl flex items-center gap-3 animate-pulse">
                 <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                 <span className="text-[10px] font-black text-white uppercase tracking-widest">Waiting for Neural Sync...</span>
              </div>
           </div>
        )}
        
        {/* Left: Tactical Camera & Digital Twin */}
        <div className="flex-1 flex flex-col gap-6 min-h-[400px] lg:min-h-0">
          <div className="flex-1 rounded-[3rem] border border-gray-800 bg-black relative overflow-hidden shadow-2xl shadow-blue-500/10 group">
             <div className="absolute top-8 left-8 flex items-center gap-4 z-30">
                <div className={`px-4 py-2 bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10 flex items-center gap-3`}>
                   <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                   <span className="text-[10px] font-black text-white uppercase tracking-widest">
                      {connected ? "NEURAL LINK ESTABLISHED" : "LINK DISCONNECTED"}
                   </span>
                </div>
                {liveModeActive && (
                  <div className="px-4 py-2 bg-red-600/20 backdrop-blur-xl rounded-2xl border border-red-500/30 text-red-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" /> LIVE
                  </div>
                )}
             </div>

             <div className="absolute top-8 right-8 flex gap-2 z-30">
                <button 
                  onClick={() => setViewMode(viewMode === 'hud' ? 'twin' : 'hud')}
                  className="p-4 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl text-white hover:bg-white/10 transition-all"
                >
                   {viewMode === 'hud' ? <Cpu className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                <button 
                  onClick={toggleBluetooth}
                  className={`p-4 backdrop-blur-xl border rounded-2xl transition-all ${hubConnected ? 'bg-blue-600/20 border-blue-500/40 text-blue-400' : 'bg-black/60 border-white/10 text-white'}`}
                >
                   <Bluetooth className="w-5 h-5" />
                </button>
             </div>

             {viewMode === "hud" ? (
               <>
                 <img ref={imgRef} className="w-full h-full object-cover opacity-90" alt="Video Feed" />
                 <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-20" />
                 <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent h-32 w-full animate-scan pointer-events-none z-10" />
               </>
             ) : (
               <div className="w-full h-full bg-[#050505]">
                 <Canvas shadows dpr={[1, 2]}>
                   <Suspense fallback={null}>
                     <PerspectiveCamera makeDefault position={[0, 0, 4]} fov={50} />
                     <ambientLight intensity={0.5} />
                     <pointLight position={[10, 10, 10]} intensity={1} />
                     <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                     <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                       <RobotModel rotation={orientation} />
                     </Float>
                     <ContactShadows position={[0, -1.2, 0]} opacity={0.4} scale={10} blur={2} far={4.5} />
                     <Environment preset="city" />
                     <OrbitControls enableZoom={false} makeDefault />
                   </Suspense>
                 </Canvas>
               </div>
             )}
          </div>

          <div className="h-48 bg-gray-900/40 backdrop-blur-xl border border-gray-800 rounded-[2.5rem] flex flex-col overflow-hidden">
             <div className="px-6 py-3 border-b border-gray-800 bg-white/5 flex items-center justify-between">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Diagnostic Stream</span>
                <Activity className="w-3 h-3 text-gray-700" />
             </div>
             <div className="flex-1 overflow-y-auto p-4 font-mono text-[9px] space-y-2 custom-scrollbar">
                {actionLogs.slice(0, 10).map((log, i) => (
                  <div key={i} className="flex gap-4 items-start">
                     <span className="text-gray-600 shrink-0">{log.time.split(' ')[1]}</span>
                     <span className={`uppercase font-black shrink-0 ${log.type === 'system' ? 'text-blue-400' : 'text-purple-400'}`}>{log.type}</span>
                     <p className="text-gray-300 truncate">{log.message}</p>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Right: Focused Chat & Intelligence */}
        <div className="w-full lg:w-[450px] flex flex-col gap-6">
           <div className="flex-1 bg-gray-900/40 backdrop-blur-xl border border-gray-800 rounded-[3rem] flex flex-col overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-gray-800 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
                       <MessageSquare className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                       <h3 className="text-lg font-black text-white uppercase tracking-tighter italic">Brain Chat</h3>
                       <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Active Neural Soul</span>
                    </div>
                 </div>
                 <div className="flex bg-gray-800/50 rounded-xl p-1 border border-gray-700">
                    <button 
                      onClick={() => setAiTier("standard")}
                      className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${aiTier === 'standard' ? 'bg-gray-700 text-white' : 'text-gray-500'}`}
                    >
                      Flash
                    </button>
                    <button 
                      onClick={() => setAiTier("pro")}
                      className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${aiTier === 'pro' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500'}`}
                    >
                      ER 1.6
                    </button>
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-black/20">
                 {messages.length === 0 && (
                   <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                      <Brain className="w-12 h-12" />
                      <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Neural Inputs...</p>
                   </div>
                 )}
                 {messages.map((msg, i) => (
                   <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-5 rounded-3xl text-sm font-medium leading-relaxed shadow-xl ${
                        msg.role === 'user' 
                          ? "bg-purple-600 text-white rounded-tr-none" 
                          : "bg-gray-800 border border-gray-700 text-gray-200 rounded-tl-none"
                      }`}>
                         {msg.content}
                      </div>
                   </div>
                 ))}
                 {thinking.length > 0 && (
                   <div className="flex justify-start">
                      <div className="bg-gray-800 border border-gray-700 p-4 rounded-3xl flex gap-2 items-center">
                         <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" />
                         <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce delay-100" />
                         <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce delay-200" />
                      </div>
                   </div>
                 )}
                 <div ref={chatEndRef} />
              </div>

              <div className="p-8 border-t border-gray-800 bg-black/20">
                 <div className="relative">
                    <input 
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                      placeholder="Establish command link..."
                      className="w-full bg-black/60 border border-gray-800 rounded-[2rem] px-8 py-5 pr-32 text-sm text-white placeholder-gray-600 focus:border-purple-500 outline-none transition-all shadow-inner"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-3">
                       <button 
                         onClick={startListening}
                         className="p-3 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-2xl transition-all"
                       >
                          <Mic className="w-5 h-5" />
                       </button>
                       <button 
                         onClick={handleSendChat}
                         className="p-3 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl transition-all shadow-xl shadow-purple-900/40"
                       >
                          <Send className="w-5 h-5" />
                       </button>
                    </div>
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-900/40 backdrop-blur-xl border border-gray-800 p-6 rounded-[2rem] flex flex-col gap-2">
                 <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Brick Balance</span>
                 <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-orange-500 italic tracking-tighter">{bricks} ₿</span>
                    <button onClick={() => setShowTopUp(true)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
                       <Plus className="w-4 h-4" />
                    </button>
                 </div>
              </div>
              <div className="bg-gray-900/40 backdrop-blur-xl border border-gray-800 p-6 rounded-[2rem] flex flex-col gap-2">
                 <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Model Latency</span>
                 <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-cyan-400 italic tracking-tighter">18ms</span>
                    <Zap className="w-5 h-5 text-cyan-500/50" />
                 </div>
              </div>
           </div>
        </div>
      </div>

      <WithdrawModal 
        isOpen={showWithdraw} 
        onClose={() => setShowWithdraw(false)} 
        onBalanceUpdate={(bal) => setBricks(bal)} 
        currentBalance={bricks} 
      />
      <TopUpModal 
        isOpen={showTopUp} 
        onClose={() => setShowTopUp(false)} 
        onBalanceUpdate={(bal) => setBricks(bal)} 
      />

      <video ref={videoRef} className="hidden" playsInline muted />
      <canvas ref={captureCanvasRef} className="hidden" width={400} height={300} />
    </div>
  );
}
