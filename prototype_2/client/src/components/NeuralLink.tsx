import { useRef, useEffect, useState } from "react";
import { 
  Bluetooth, X, Camera, CameraOff, Brain, Mic, MicOff, Usb
} from "lucide-react";
import { useSocket } from "../hooks/useSocket";
import { useLegoHardware } from "../hooks/useLegoHardware";

interface NeuralLinkProps {
  onClose?: () => void;
  aiTier: string;
}

function RobotEyes({ mood = "idle" }: { mood?: string }) {
  const getStyles = () => {
    switch (mood) {
      case "happy": return "rounded-t-full h-16 mt-8";
      case "sad": return "rounded-b-full h-16";
      case "angry": return "rotate-12 h-20 w-14 skew-x-12";
      case "surprised": return "scale-125 h-20 w-20";
      default: return "h-24 w-16";
    }
  };

  return (
    <div className="flex gap-12 items-center justify-center h-full scale-110">
      <div className={`bg-cyan-400 rounded-full shadow-[0_0_30px_rgba(34,211,238,0.6)] transition-all duration-500 relative overflow-hidden ${getStyles()} ${mood === 'thinking' ? 'animate-pulse' : ''}`}>
         <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-white rounded-full opacity-50" />
      </div>
      <div className={`bg-cyan-400 rounded-full shadow-[0_0_30px_rgba(34,211,238,0.6)] transition-all duration-500 relative overflow-hidden ${getStyles()} ${mood === 'thinking' ? 'animate-pulse' : ''}`}>
         <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-white rounded-full opacity-50" />
      </div>
    </div>
  );
}

export default function NeuralLink({ onClose, aiTier }: NeuralLinkProps) {
  const { send } = useSocket();
  const { connectBLE, connectUSB, disconnect, hubConnected, connecting } = useLegoHardware();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [streaming, setStreaming] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [mood, setMood] = useState("idle");
  const [sensors, setSensors] = useState<any>({ accel: { x: 0, y: 0, z: 0 }, tilt: "flat" });
  const recognitionRef = useRef<any>(null);

  // ─── Camera Logic ───
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: "environment" },
        audio: false
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setStreaming(true);
    } catch (e) {
      alert("Camera access denied. Please enable permissions.");
    }
  };

  useEffect(() => {
    if (!streaming) return;
    const interval = setInterval(() => {
      if (!videoRef.current || !canvasRef.current) return;
      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return;
      canvasRef.current.width = 320;
      canvasRef.current.height = 240;
      ctx.drawImage(videoRef.current, 0, 0, 320, 240);
      const frame = canvasRef.current.toDataURL("image/jpeg", 0.5);
      send("frame", frame);
    }, 200); // 5fps for efficiency
    return () => clearInterval(interval);
  }, [streaming, send]);

  // ─── Sensor Logic ───
  useEffect(() => {
    const handleMotion = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      const ax = a?.x ?? 0, ay = a?.y ?? 0, az = a?.z ?? 9.8;
      
      let tilt = "flat";
      if (Math.abs(ay) > 7) tilt = ay > 0 ? "forward" : "back";
      else if (Math.abs(ax) > 7) tilt = ax > 0 ? "right" : "left";

      const newData = { accel: { x: ax, y: ay, z: az }, tilt };
      setSensors(newData);
      send("sensor", newData);
    };

    const handleOrientation = (e: DeviceOrientationEvent) => {
      const payload = {
        alpha: Math.round(e.alpha || 0),
        beta: Math.round(e.beta || 0),
        gamma: Math.round(e.gamma || 0)
      };
      send("orientation", payload);
    };

    window.addEventListener("devicemotion", handleMotion);
    window.addEventListener("deviceorientation", handleOrientation);
    return () => {
      window.removeEventListener("devicemotion", handleMotion);
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, [send]);

  // ─── Speech Recognition (STT) ───
  const toggleSTT = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Speech recognition not supported in this browser.");

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      const rec = new SpeechRecognition();
      rec.lang = "ru-RU";
      rec.onresult = (e: any) => {
        const text = e.results[0][0].transcript;
        send("robot_chat", { message: text, tier: aiTier });
        setMood("thinking");
      };
      rec.onend = () => setIsListening(false);
      rec.start();
      setIsListening(true);
      recognitionRef.current = rec;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col font-roboto animate-in fade-in duration-500">
      {/* Header Overlay */}
      <div className="absolute top-0 inset-x-0 p-6 flex items-center justify-between z-10 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-4">
          <div className={`w-3 h-3 rounded-full animate-pulse ${hubConnected ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`} />
          <div>
            <h2 className="text-white font-black uppercase tracking-tighter text-xl flex items-center gap-2">
              Neural Link <span className="text-[10px] bg-purple-600 px-2 py-0.5 rounded-full">{aiTier.toUpperCase()}</span>
            </h2>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">
              {hubConnected ? "Hardware Online // Sync Active" : "Waiting for Signal..."}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Neural Display */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Background Effect */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.1),transparent_70%)]" />
        
        {/* Robot Eyes / Video Feed */}
        <div className="w-full max-w-lg aspect-[4/3] bg-gray-900/40 rounded-[4rem] border border-white/5 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center">
          {streaming ? (
            <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover opacity-40 blur-[2px]" />
          ) : null}
          
          <RobotEyes mood={mood} />
          
          {/* Sensor HUD Overlay */}
          <div className="absolute bottom-12 inset-x-12 flex justify-between items-end">
            <div className="space-y-1">
               <div className="text-[8px] font-black text-cyan-400 uppercase tracking-widest">Accelerometer</div>
               <div className="text-xs font-mono text-white">X:{sensors.accel.x.toFixed(1)} Y:{sensors.accel.y.toFixed(1)}</div>
            </div>
            <div className="text-right space-y-1">
               <div className="text-[8px] font-black text-purple-400 uppercase tracking-widest">Pose</div>
               <div className="text-xs font-black text-white uppercase">{sensors.tilt}</div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-12 flex flex-wrap justify-center gap-4 w-full max-w-md">
           {!hubConnected ? (
             <div className="flex-1 flex gap-4 w-full">
                <button 
                  onClick={connectBLE}
                  disabled={connecting}
                  className="flex-1 flex items-center justify-center gap-3 py-5 rounded-3xl font-black uppercase tracking-tighter transition-all active:scale-95 shadow-xl bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/40"
                >
                  {connecting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Bluetooth className="w-6 h-6" />}
                  Bluetooth
                </button>
                <button 
                  onClick={connectUSB}
                  disabled={connecting}
                  className="flex-1 flex items-center justify-center gap-3 py-5 rounded-3xl font-black uppercase tracking-tighter transition-all active:scale-95 shadow-xl bg-gray-900 border border-gray-800 text-white"
                >
                  {connecting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Usb className="w-6 h-6" />}
                  USB Link
                </button>
             </div>
           ) : (
             <button 
               onClick={disconnect}
               className="flex-1 flex items-center justify-center gap-3 py-5 rounded-3xl font-black uppercase tracking-tighter transition-all active:scale-95 shadow-xl bg-green-600/20 border border-green-500/50 text-green-400"
             >
               <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
               Hub Connected
             </button>
           )}

           <button 
             onClick={toggleSTT}
             className={`w-20 h-20 flex items-center justify-center rounded-full transition-all active:scale-90 ${
               isListening ? 'bg-red-500 text-white animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.4)]' : 'bg-gray-900 text-gray-400 border border-gray-800'
             }`}
           >
             {isListening ? <Mic className="w-8 h-8" /> : <MicOff className="w-8 h-8" />}
           </button>

           <button 
             onClick={startCamera}
             className={`w-20 h-20 flex items-center justify-center rounded-full transition-all active:scale-90 ${
               streaming ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-gray-900 text-gray-400 border border-gray-800'
             }`}
           >
             {streaming ? <Camera className="w-8 h-8" /> : <CameraOff className="w-8 h-8" />}
           </button>
        </div>

        {/* Hidden Canvas for Frame Capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Footer Branding */}
      <div className="p-8 flex items-center justify-center gap-3 opacity-30 grayscale pointer-events-none">
        <Brain className="w-5 h-5 text-purple-400" />
        <span className="text-xs font-black uppercase tracking-[0.3em] text-white">BrainBricks Core v4.0</span>
      </div>
    </div>
  );
}

function Loader2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
