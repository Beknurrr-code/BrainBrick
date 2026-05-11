import { useState, useEffect, useRef } from "react";
import { 
  Activity, Brain, Cpu, Globe, 
  Loader2, ShieldCheck, Terminal, Clock
} from "lucide-react";
import { useSocket } from "../hooks/useSocket";

export default function ObservatoryPage() {
  const { on } = useSocket();
  const [logs, setLogs] = useState<any[]>([]);
  const [mcpCalls, setMcpCalls] = useState<any[]>([]);
  const [aiThinking, setAiThinking] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    on("robot_frame", (data: string) => {
      if (imgRef.current) {
        imgRef.current.src = `data:image/jpeg;base64,${data}`;
      }
    });

    on("chat_message", (msg: any) => {
      if (msg.role === 'assistant') setAiThinking(false);
    });

    on("system_log", (log: any) => {
      setLogs(prev => [...prev, log].slice(-50));
    });

    on("mcp_call", (call: any) => {
      setMcpCalls(prev => [...prev, call].slice(-10));
    });

    on("system_metrics", () => {
      // Metrics used by components in future
    });

    // Simulated thinking stream
    on("ai_reasoning", (thought: string) => {
      setAiThinking(true);
      setLogs(prev => [...prev, { type: 'brain', message: thought, time: new Date().toLocaleTimeString() }].slice(-50));
    });
  }, [on]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="min-h-screen bg-[#050505] text-cyan-50 font-mono text-xs overflow-hidden flex flex-col border-4 border-gray-900 m-2 rounded-xl shadow-[0_0_100px_rgba(0,0,0,1)]">
      
      {/* HEADER: MISSION CONTROL */}
      <div className="h-14 border-b border-gray-800 bg-gray-900/40 backdrop-blur-xl flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-cyan-600/20 rounded-lg flex items-center justify-center border border-cyan-500/30">
            <Globe className="w-6 h-6 text-cyan-400 animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-[0.3em] text-white">Observatory Protocol v1.0</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Global Neural Link: SECURE</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8">
           <div className="flex flex-col items-end">
              <span className="text-[8px] text-gray-600 font-bold uppercase">Uptime</span>
              <span className="text-xs font-black text-cyan-400">02:44:12</span>
           </div>
           <div className="h-8 w-px bg-gray-800" />
           <div className="flex flex-col items-end">
              <span className="text-[8px] text-gray-600 font-bold uppercase">Signal</span>
              <div className="flex gap-0.5 mt-1">
                 <div className="w-1 h-2 bg-green-500" />
                 <div className="w-1 h-3 bg-green-500" />
                 <div className="w-1 h-4 bg-green-500" />
                 <div className="w-1 h-5 bg-green-500" />
              </div>
           </div>
           <button className="px-4 py-2 bg-red-600/10 border border-red-500/50 text-red-500 rounded font-black uppercase tracking-widest text-[10px] hover:bg-red-600 hover:text-white transition-all">
              Abort Mission
           </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT: VISION & SENSORS */}
        <div className="w-1/3 border-r border-gray-800 flex flex-col p-4 space-y-4 bg-gray-900/10">
           <div className="relative aspect-video bg-black rounded-lg border border-gray-800 overflow-hidden group shadow-2xl">
              <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-red-600/20 border border-red-500/50 rounded flex items-center gap-2">
                 <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                 <span className="text-[9px] font-black text-red-400">LIVE FEED</span>
              </div>
              <img ref={imgRef} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Observatory Feed" />
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/grid.png')] opacity-20 pointer-events-none" />
              <div className="absolute bottom-2 right-2 text-[8px] text-gray-500 font-mono">CAM_01 // BRAIN_LINK</div>
              
              {/* HUD Brackets */}
              <div className="absolute top-4 left-4 w-6 h-6 border-t border-l border-cyan-500/40" />
              <div className="absolute top-4 right-4 w-6 h-6 border-t border-r border-cyan-500/40" />
              <div className="absolute bottom-4 left-4 w-6 h-6 border-b border-l border-cyan-500/40" />
              <div className="absolute bottom-4 right-4 w-6 h-6 border-b border-r border-cyan-500/40" />
           </div>

           <div className="flex-1 bg-black/40 border border-gray-800 rounded-lg p-4 space-y-6">
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                       <Activity className="w-3 h-3 text-cyan-400" /> Neural Telemetry
                    </span>
                    <span className="text-[10px] font-bold text-cyan-400">SYNC_OK</span>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                       <div className="text-[8px] text-gray-600 uppercase mb-1">Latency</div>
                       <div className="text-xl font-black text-white">42<span className="text-[10px] text-gray-600 ml-1">ms</span></div>
                    </div>
                    <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                       <div className="text-[8px] text-gray-600 uppercase mb-1">FPS</div>
                       <div className="text-xl font-black text-white">30<span className="text-[10px] text-gray-600 ml-1">hz</span></div>
                    </div>
                 </div>
              </div>

              <div className="space-y-2">
                 <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Active MCP Tools</span>
                 <div className="space-y-1">
                    {mcpCalls.length === 0 ? (
                      <div className="py-4 text-center text-gray-700 text-[10px] italic">No active tool calls...</div>
                    ) : (
                      mcpCalls.map((call, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-cyan-950/20 border border-cyan-900/30 rounded">
                           <span className="text-cyan-400 font-bold">{call.name}</span>
                           <span className="text-gray-600 text-[8px]">{call.time}</span>
                        </div>
                      ))
                    )}
                 </div>
              </div>
           </div>
        </div>

        {/* CENTER: THE BRAIN (LLM REASONING) */}
        <div className="flex-1 flex flex-col p-4 bg-black">
           <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-purple-600/20 border border-purple-500/30 rounded-lg">
                    <Brain className="w-5 h-5 text-purple-400 animate-pulse" />
                 </div>
                 <div>
                    <h2 className="text-[10px] font-black text-white uppercase tracking-widest">Neural Reasoning Engine</h2>
                    <span className="text-[8px] text-purple-400 font-bold uppercase">Gemini 3.1 Pro (Multimodal Core)</span>
                 </div>
              </div>
              <div className="flex gap-2">
                 {aiThinking && <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />}
                 <div className="px-3 py-1 bg-purple-600/10 border border-purple-500/50 rounded text-purple-400 font-black text-[9px] uppercase tracking-widest">
                    Thinking...
                 </div>
              </div>
           </div>

           <div className="flex-1 bg-gray-900/20 border border-gray-800 rounded-lg overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto p-6 space-y-6 font-mono leading-relaxed">
                 {logs.filter(l => l.type === 'brain' || l.type === 'chat').map((log, i) => (
                   <div key={i} className={`flex gap-4 ${log.role === 'user' ? 'opacity-50' : ''}`}>
                      <div className="shrink-0 w-8 h-8 rounded bg-gray-900 border border-gray-800 flex items-center justify-center text-[10px] text-gray-500">
                         {log.role === 'user' ? 'USER' : 'AI'}
                      </div>
                      <div className="flex-1 space-y-2">
                         <div className="text-[8px] text-gray-600 flex items-center gap-2">
                            <Clock className="w-3 h-3" /> {log.time}
                         </div>
                         <div className={`text-xs ${log.type === 'brain' ? 'text-purple-300 italic' : 'text-cyan-50'}`}>
                            {log.message}
                         </div>
                      </div>
                   </div>
                 ))}
                 <div ref={logEndRef} />
              </div>
              
              <div className="p-4 bg-gray-950/80 border-t border-gray-800">
                 <div className="flex items-center gap-3">
                    <Terminal className="w-4 h-4 text-gray-600" />
                    <div className="flex-1 h-8 bg-gray-900 rounded border border-gray-800 flex items-center px-4 text-gray-500 italic">
                       Awaiting AI inference...
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* RIGHT: SYSTEM LOGS & RAW PROTOCOL */}
        <div className="w-1/4 border-l border-gray-800 flex flex-col p-4 bg-gray-900/10">
           <div className="flex items-center gap-2 mb-4 px-2">
              <Terminal className="w-4 h-4 text-orange-400" />
              <h2 className="text-[10px] font-black text-white uppercase tracking-widest">Protocol Monitor</h2>
           </div>

           <div className="flex-1 bg-black rounded-lg border border-gray-800 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto p-3 font-mono text-[9px] space-y-1">
                 {logs.map((log, i) => (
                   <div key={i} className="flex gap-2 text-gray-500 hover:text-gray-300 transition-colors py-0.5 border-b border-gray-900">
                      <span className="shrink-0 text-gray-700">[{log.time}]</span>
                      <span className={`shrink-0 uppercase font-bold w-14 ${
                        log.type === 'system' ? 'text-blue-500' : 
                        log.type === 'error' ? 'text-red-500' : 
                        'text-purple-500'
                      }`}>{log.type}</span>
                      <span className="break-all">{log.message}</span>
                   </div>
                 ))}
              </div>
           </div>

           {/* Metrics Graph Placeholder */}
           <div className="h-32 mt-4 bg-gray-900/50 border border-gray-800 rounded-lg p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[8px] font-bold text-gray-600 uppercase">
                 <span>Processor Load</span>
                 <span className="text-cyan-400">42%</span>
              </div>
              <div className="flex-1 flex items-end gap-0.5 mt-2 overflow-hidden">
                 {Array.from({ length: 40 }).map((_, i) => (
                   <div 
                     key={i} 
                     className="flex-1 bg-cyan-600/30 border-t border-cyan-500/50" 
                     style={{ height: `${Math.random() * 100}%` }} 
                   />
                 ))}
              </div>
           </div>
        </div>
      </div>

      {/* FOOTER: SYSTEM BAR */}
      <div className="h-10 border-t border-gray-800 bg-black flex items-center justify-between px-6">
         <div className="flex gap-6">
            <div className="flex items-center gap-2">
               <Cpu className="w-3 h-3 text-purple-400" />
               <span className="text-[9px] text-gray-500 font-bold uppercase">Memory: 1.2GB / 4.0GB</span>
            </div>
            <div className="flex items-center gap-2">
               <ShieldCheck className="w-3 h-3 text-green-500" />
               <span className="text-[9px] text-gray-500 font-bold uppercase">Auth: RSA_ENCRYPTED</span>
            </div>
         </div>
         <div className="flex items-center gap-2">
            <span className="text-[9px] text-cyan-600 font-bold uppercase animate-pulse">Scanning for Peripheral Anomalies...</span>
         </div>
      </div>
    </div>
  );
}
