import { useState, useEffect, useRef } from "react";
import { Users, ShieldAlert, TrendingUp, Search, Trash2, Plus, Terminal, Activity, Database, Zap, Sparkles } from "lucide-react";


export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [financials, setFinancials] = useState<any>({ totalEconomy: 0, platformProfit: 0 });
  const [logs, setLogs] = useState<string[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
    const logInterval = setInterval(() => {
      const actions = ["API_CALL", "AUTH_VERIFY", "DB_QUERY", "BLE_SYNC", "AI_REASONING"];
      const newLog = `[${new Date().toLocaleTimeString()}] ${actions[Math.floor(Math.random() * actions.length)]}: 0x${Math.random().toString(16).slice(2, 8).toUpperCase()} verified.`;
      setLogs(prev => [...prev.slice(-19), newLog]);
    }, 2000);
    return () => clearInterval(logInterval);
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const fetchData = async () => {
    try {
      const uRes = await fetch("/api/admin/users");
      const iRes = await fetch("/api/marketplace/items");
      const fRes = await fetch("/api/admin/financials");
      setUsers(await uRes.json());
      setItems(await iRes.json());
      setFinancials(await fRes.json());
    } catch (e) {
      console.error("Failed to fetch admin data");
    }
  };

  const updateUserBalance = async (username: string, amount: number) => {
    try {
      const res = await fetch("/api/admin/update-balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, amount })
      });
      if (res.ok) {
        setLogs(prev => [...prev, `[SYSTEM] Balance updated for ${username}: ${amount}₿`]);
        fetchData();
      }
    } catch (e) {
      alert("Update failed");
    }
  };

  const toggleAiTier = async (username: string, currentTier: string) => {
    try {
      const newTier = currentTier === "pro" ? "standard" : "pro";
      const res = await fetch("/api/admin/update-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, settings: { aiTier: newTier } })
      });
      if (res.ok) {
        setLogs(prev => [...prev, `[SYSTEM] AI Tier updated for ${username} to ${newTier.toUpperCase()}`]);
        fetchData();
      }
    } catch (e) {
      alert("Update failed");
    }
  };




  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div className="relative">
            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)]" />
            <h1 className="text-5xl font-black flex items-center gap-4 tracking-tighter italic">
              <ShieldAlert className="w-12 h-12 text-red-600" />
              SYSTEM OVERRIDE
            </h1>
            <div className="flex items-center gap-4 mt-2">
               <span className="text-gray-500 font-mono text-[10px] tracking-widest uppercase">Root Access Granted</span>
               <div className="flex gap-1">
                  {[1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />)}
               </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
             <StatCard icon={<TrendingUp className="text-green-400" />} label="Economy" value={`₿ ${financials.totalEconomy}`} />
             <StatCard icon={<Sparkles className="text-orange-400" />} label="Platform Profit (20%)" value={`₿ ${financials.platformProfit}`} />
             <StatCard icon={<Activity className="text-blue-400" />} label="Active Nodes" value={users.length.toString()} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Users Table */}
          <div className="lg:col-span-3 space-y-8">
            <div className="bg-gray-900/40 border border-gray-800 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl">
               <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-gradient-to-r from-gray-900/50 to-transparent">
                  <div className="flex items-center gap-3">
                     <Users className="w-5 h-5 text-purple-400" />
                     <h2 className="font-black uppercase tracking-[0.2em] text-xs">Pilot Database</h2>
                  </div>
                  <div className="relative">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                     <input type="text" placeholder="Scan protocols..." className="bg-black border border-gray-800 rounded-xl pl-10 pr-4 py-2 text-xs outline-none focus:border-red-500 transition-all w-64" />
                  </div>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="bg-black/80 text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-800">
                           <th className="p-5">Pilot Designation</th>
                           <th className="p-5">Neural Tier</th>
                           <th className="p-5">Credit Reserve</th>
                           <th className="p-5 text-right">Command</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-800/50">
                        {users.map(u => (
                           <tr key={u.username} className="hover:bg-red-600/5 transition-all group">
                              <td className="p-5">
                                 <div className="flex items-center gap-4">
                                    <img src={u.avatar} className="w-10 h-10 rounded-xl bg-gray-800 border border-gray-700 group-hover:border-red-500/50 transition-colors" alt="" />
                                    <div>
                                       <div className="font-black text-sm tracking-tight">{u.username}</div>
                                       <div className="text-[10px] text-gray-600 font-mono italic">UID: {Math.random().toString(16).slice(2, 10)}</div>
                                    </div>
                                 </div>
                              </td>
                              <td className="p-5">
                                 <span className={`text-[9px] font-black px-2 py-1 rounded-md border uppercase ${
                                    u.isAdmin ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                 }`}>
                                    {u.isAdmin ? "Root Admin" : (u.settings?.aiTier || "Standard")}
                                 </span>
                              </td>
                              <td className="p-5 font-mono text-purple-400 font-black">₿ {u.bricks || 0}</td>
                              <td className="p-5">
                                 <div className="flex items-center justify-end gap-2">
                                    <button 
                                      onClick={() => updateUserBalance(u.username, 500)}
                                      className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-600 hover:text-white transition-all text-[10px] font-black uppercase"
                                    >
                                       <Plus className="w-3.5 h-3.5" /> REFUEL
                                    </button>
                                    <button 
                                      onClick={() => toggleAiTier(u.username, u.settings?.aiTier || "standard")}
                                      className={`p-1.5 rounded-lg transition-all ${
                                         (u.settings?.aiTier === "pro") ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-500 hover:text-purple-400"
                                      }`}
                                      title="Toggle AI Tier"
                                    >
                                       <Zap className="w-4 h-4" />
                                    </button>
                                    <button 
                                      onClick={() => updateUserBalance(u.username, -u.bricks)}
                                      className="p-1.5 bg-gray-800 text-gray-500 rounded-lg hover:bg-red-600 hover:text-white transition-all"
                                    >
                                       <Trash2 className="w-4 h-4" />
                                    </button>
                                 </div>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>

            {/* Live Terminal */}
            <div className="bg-black border border-gray-800 rounded-3xl p-6 font-mono overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
               <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                     <Terminal className="w-4 h-4 text-red-500" />
                     <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Global Telemetry Stream</span>
                  </div>
                  <div className="flex gap-1.5">
                     <div className="w-2 h-2 rounded-full bg-red-600" />
                     <div className="w-2 h-2 rounded-full bg-orange-500" />
                     <div className="w-2 h-2 rounded-full bg-green-500" />
                  </div>
               </div>
               <div className="h-48 overflow-y-auto space-y-1 text-[11px] scrollbar-hide">
                  {logs.map((log, i) => (
                    <div key={i} className="flex gap-4 opacity-80 hover:opacity-100 transition-opacity">
                       <span className="text-gray-700">[{i.toString().padStart(3, '0')}]</span>
                       <span className={log.includes("SYSTEM") ? "text-red-400 font-bold" : "text-gray-400"}>{log}</span>
                    </div>
                  ))}
                  <div ref={logEndRef} />
               </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-8">
             <div className="bg-gray-900/40 border border-gray-800 rounded-3xl p-6 backdrop-blur-xl">
                <div className="flex items-center gap-2 mb-6">
                   <Database className="w-5 h-5 text-cyan-400" />
                   <h2 className="font-black uppercase tracking-widest text-xs">Artifact Storage</h2>
                </div>
                <div className="space-y-4">
                   <StatBox label="Total Artifacts" value={items.length} color="text-white" />
                   <StatBox label="System Uptime" value="99.98%" color="text-green-400" />
                   <StatBox label="Neural Processing" value="4.2 TFLOPS" color="text-purple-400" />
                </div>
             </div>

             <div className="bg-gradient-to-br from-red-950/50 to-black border border-red-900/50 rounded-3xl p-6 relative overflow-hidden group">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-600/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <h3 className="font-black text-red-600 mb-2 uppercase tracking-tighter text-lg">Cortex Purge</h3>
                <p className="text-[10px] text-gray-500 mb-6 font-bold uppercase tracking-tight leading-relaxed">
                   Initiate global memory cleanup or disconnect all neural bridges. Irreversible action.
                </p>
                <div className="space-y-3 relative z-10">
                   <button className="w-full py-3 bg-red-600/10 border border-red-600/30 text-red-500 font-black rounded-xl hover:bg-red-600 hover:text-white transition-all text-[10px] uppercase tracking-[0.2em]">
                      Execute Purge
                   </button>
                   <button className="w-full py-3 bg-gray-900 text-gray-500 font-black rounded-xl hover:bg-gray-800 transition-all text-[10px] uppercase tracking-[0.2em]">
                      Emergency Halt
                   </button>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="bg-gray-900/50 border border-gray-800 p-4 rounded-2xl flex items-center gap-4 min-w-[160px] backdrop-blur-md">
       <div className="p-2 bg-black rounded-xl">{icon}</div>
       <div>
          <div className="text-[9px] text-gray-500 uppercase font-black tracking-widest">{label}</div>
          <div className="text-lg font-black tracking-tighter">{value}</div>
       </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string, value: any, color: string }) {
  return (
    <div className="p-4 bg-black/40 rounded-2xl border border-gray-800 group hover:border-gray-700 transition-colors">
       <div className="text-[9px] text-gray-500 mb-1 uppercase font-black tracking-widest">{label}</div>
       <div className={`text-2xl font-black tracking-tighter ${color}`}>{value}</div>
    </div>
  );
}
