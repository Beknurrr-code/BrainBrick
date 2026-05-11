import { useRef, useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Mic, MicOff, Camera, CameraOff,
  Brain, Radio, Zap
} from "lucide-react";

type LiveStatus = "STANDBY" | "CONNECTING" | "ACTIVE" | "ERROR" | "DISCONNECTED";

export default function PhonePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const frameIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [liveStatus, setLiveStatus] = useState<LiveStatus>("STANDBY");
  const [isMicActive, setIsMicActive] = useState(false);
  const [isCamActive, setIsCamActive] = useState(false);
  const [lastToolCall, setLastToolCall] = useState("");
  const [subtitle, setSubtitle] = useState("");

  // ─── Connect to our backend WebSocket ───
  const connectWS = useCallback(() => {
    const BACKEND_IP = "192.168.68.71:3001";
    const ws = new WebSocket(`ws://${BACKEND_IP}/ws`);

    ws.onopen = () => {
      console.log("[Live] WS Connected to backend");
      setLiveStatus("STANDBY");
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === "live_status") {
          const s = msg.payload?.status?.toUpperCase() || "";
          if (s === "ACTIVE") setLiveStatus("ACTIVE");
          else if (s === "ERROR") setLiveStatus("ERROR");
          else if (s === "DISCONNECTED") setLiveStatus("DISCONNECTED");
        }

        if (msg.type === "live_audio_response") {
          playPCMAudio(msg.payload.base64);
        }

        if (msg.type === "live_tool_call") {
          setLastToolCall(`${msg.payload.name}(${JSON.stringify(msg.payload.args)})`);
        }

        if (msg.type === "expert_handoff") {
          setSubtitle(`🧠 Expert Mode: ${msg.payload.task}`);
        }

        if (msg.type === "execution_result") {
          setSubtitle("✅ Task complete!");
          setTimeout(() => setSubtitle(""), 3000);
        }
      } catch {}
    };

    ws.onclose = () => {
      setLiveStatus("DISCONNECTED");
      setTimeout(connectWS, 3000);
    };

    ws.onerror = () => ws.close();
    wsRef.current = ws;
  }, []);

  useEffect(() => {
    connectWS();
    return () => { wsRef.current?.close(); };
  }, [connectWS]);

  // ─── Play PCM audio from Gemini Live ───
  const playPCMAudio = useCallback((base64: string) => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const pcm = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(pcm.length);
    for (let i = 0; i < pcm.length; i++) float32[i] = pcm[i] / 32768;

    const buffer = audioCtxRef.current.createBuffer(1, float32.length, 24000);
    buffer.getChannelData(0).set(float32);
    const source = audioCtxRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtxRef.current.destination);
    source.start();
  }, []);

  // ─── Start Microphone streaming ───
  const startMic = useCallback(async () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const input = audioCtxRef.current.createMediaStreamSource(stream);
      const processor = audioCtxRef.current.createScriptProcessor(2048, 1, 1);
      input.connect(processor);
      processor.connect(audioCtxRef.current.destination);

      processor.onaudioprocess = (e) => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
        }
        const base64 = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
        wsRef.current?.send(JSON.stringify({ type: "live_audio_chunk", payload: { base64 } }));
      };

      processorRef.current = processor;
      setIsMicActive(true);
    } catch (err) {
      console.error("[Live] Mic failed:", err);
    }
  }, []);

  const stopMic = useCallback(() => {
    mediaStreamRef.current?.getTracks().forEach(t => t.stop());
    processorRef.current?.disconnect();
    mediaStreamRef.current = null;
    processorRef.current = null;
    setIsMicActive(false);
  }, []);

  // ─── Start Camera streaming ───
  const startCam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: "environment" }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Send frames at 1fps
      frameIntervalRef.current = setInterval(() => {
        if (!videoRef.current || !canvasRef.current || wsRef.current?.readyState !== WebSocket.OPEN) return;
        const canvas = canvasRef.current;
        canvas.width = 320;
        canvas.height = 240;
        canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0, 320, 240);
        const base64 = canvas.toDataURL("image/jpeg", 0.6);
        wsRef.current?.send(JSON.stringify({ type: "live_video_frame", payload: { base64 } }));
      }, 1000);

      setIsCamActive(true);
    } catch (err) {
      console.error("[Live] Camera failed:", err);
    }
  }, []);

  const stopCam = useCallback(() => {
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    const video = videoRef.current;
    if (video?.srcObject) {
      (video.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      video.srcObject = null;
    }
    setIsCamActive(false);
  }, []);

  // ─── Start / Stop Live Session ───
  const startLiveSession = useCallback(() => {
    setLiveStatus("CONNECTING");
    wsRef.current?.send(JSON.stringify({ type: "start_live_session" }));
    startMic();
    startCam();
  }, [startMic, startCam]);

  const stopLiveSession = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: "stop_live_session" }));
    stopMic();
    stopCam();
    setLiveStatus("STANDBY");
    setSubtitle("");
    setLastToolCall("");
  }, [stopMic, stopCam]);

  // ─── Status color helpers ───
  const statusColor = {
    STANDBY: "text-gray-500 border-gray-700 bg-gray-900/50",
    CONNECTING: "text-yellow-400 border-yellow-500/40 bg-yellow-500/10",
    ACTIVE: "text-green-400 border-green-500/40 bg-green-500/10",
    ERROR: "text-red-400 border-red-500/40 bg-red-500/10",
    DISCONNECTED: "text-orange-400 border-orange-500/40 bg-orange-500/10",
  }[liveStatus];

  const isActive = liveStatus === "ACTIVE";

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col text-white overflow-hidden">
      {/* Hidden elements */}
      <video ref={videoRef} autoPlay playsInline muted className="hidden" />
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/50">
        <div className="flex items-center gap-4">
          <Link to="/builder" className="p-2.5 rounded-xl bg-gray-900 border border-gray-800 text-gray-500 hover:text-white transition-all">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-sm font-black uppercase tracking-widest">Gemini Live</h1>
            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.3em]">Realtime Multimodal</p>
          </div>
        </div>

        {/* Status Badge */}
        <div className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${statusColor}`}>
          {(liveStatus === "ACTIVE" || liveStatus === "CONNECTING") && (
            <div className={`w-2 h-2 rounded-full ${liveStatus === "ACTIVE" ? "bg-green-500 animate-ping" : "bg-yellow-500 animate-pulse"}`} />
          )}
          {liveStatus}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center relative px-6">

        {/* Robot Eyes */}
        <div className="flex gap-12 items-center justify-center mb-12">
          <div className={`w-28 h-28 rounded-full shadow-[0_0_60px_rgba(6,182,212,0.4)] flex items-center justify-center relative overflow-hidden transition-all duration-500 ${isActive ? "bg-cyan-500" : "bg-gray-800 border-2 border-gray-700"}`}>
            <div className={`w-10 h-10 bg-black rounded-full transition-all duration-300 ${isActive ? "animate-pulse" : ""}`} />
            {isActive && <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/50 to-transparent" />}
          </div>
          <div className={`w-28 h-28 rounded-full shadow-[0_0_60px_rgba(6,182,212,0.4)] flex items-center justify-center relative overflow-hidden transition-all duration-500 ${isActive ? "bg-cyan-500" : "bg-gray-800 border-2 border-gray-700"}`}>
            <div className={`w-10 h-10 bg-black rounded-full transition-all duration-300 ${isActive ? "animate-pulse" : ""}`} />
            {isActive && <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/50 to-transparent" />}
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex gap-3 mb-8">
          <div className={`px-3 py-1.5 rounded-lg border text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all ${isMicActive ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-gray-900 border-gray-800 text-gray-600"}`}>
            <Mic className="w-3 h-3" />
            MIC: {isMicActive ? "LIVE" : "OFF"}
          </div>
          <div className={`px-3 py-1.5 rounded-lg border text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all ${isCamActive ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-gray-900 border-gray-800 text-gray-600"}`}>
            <Camera className="w-3 h-3" />
            CAM: {isCamActive ? "1FPS" : "OFF"}
          </div>
          <div className={`px-3 py-1.5 rounded-lg border text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all ${isActive ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400" : "bg-gray-900 border-gray-800 text-gray-600"}`}>
            <Radio className="w-3 h-3" />
            WS: {wsRef.current?.readyState === WebSocket.OPEN ? "OK" : "..."}
          </div>
        </div>

        {/* Subtitle / Tool Call Display */}
        {subtitle && (
          <div className="mb-6 max-w-sm px-6 py-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl backdrop-blur-xl text-center">
            <p className="text-xs text-purple-300 font-medium">{subtitle}</p>
          </div>
        )}
        {lastToolCall && (
          <div className="mb-6 max-w-sm px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-center">
            <p className="text-[10px] text-cyan-400 font-mono">{lastToolCall}</p>
          </div>
        )}

        {/* Camera Preview (small) */}
        {isCamActive && videoRef.current?.srcObject && (
          <div className="mb-8 w-40 h-30 rounded-2xl bg-black border-2 border-cyan-500/30 overflow-hidden shadow-2xl shadow-cyan-900/20">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="p-6 border-t border-gray-800/50">
        {liveStatus === "STANDBY" || liveStatus === "DISCONNECTED" || liveStatus === "ERROR" ? (
          <button
            onClick={startLiveSession}
            className="w-full py-5 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-[2rem] text-lg font-black uppercase tracking-tighter transition-all hover:scale-[1.02] active:scale-95 shadow-2xl shadow-cyan-900/40 flex items-center justify-center gap-3"
          >
            <Brain className="w-6 h-6" />
            Connect to Gemini Live
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={isMicActive ? stopMic : startMic}
              className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all ${isMicActive ? "bg-green-600 shadow-[0_0_20px_rgba(34,197,94,0.3)]" : "bg-gray-800 border border-gray-700 text-gray-400"}`}
            >
              {isMicActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              {isMicActive ? "Mic On" : "Mic Off"}
            </button>
            <button
              onClick={isCamActive ? stopCam : startCam}
              className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all ${isCamActive ? "bg-cyan-600 shadow-[0_0_20px_rgba(6,182,212,0.3)]" : "bg-gray-800 border border-gray-700 text-gray-400"}`}
            >
              {isCamActive ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
              {isCamActive ? "Cam On" : "Cam Off"}
            </button>
            <button
              onClick={stopLiveSession}
              className="px-6 py-4 bg-red-600 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)]"
            >
              <Zap className="w-5 h-5" />
              End
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
