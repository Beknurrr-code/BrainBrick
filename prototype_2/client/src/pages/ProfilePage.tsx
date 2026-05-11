import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  User, Zap, Clock, Brain, CheckCircle, Edit3, Save, Bot
} from "lucide-react";
import TopUpModal from "../components/TopUpModal";
import WithdrawModal from "../components/WithdrawModal";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"builds" | "activity" | "billing">("builds");
  const [showTopUp, setShowTopUp] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [myBuilds, setMyBuilds] = useState<any[]>([]);
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("/api/user/profile", {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data && typeof data === 'object') {
          setUser(data);
          setEditName(data.username || "");
          setEditBio(data.bio || "Neural Pilot of the BrainBricks ecosystem.");
        }
      });

    fetch("/api/builds")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setMyBuilds(data);
      })
      .catch(() => {});
  }, []);

  const handleSaveProfile = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/user/settings", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ username: editName, bio: editBio })
    });
    if (res.ok) {
      setUser((prev: any) => ({ ...prev, username: editName, bio: editBio }));
      setIsEditing(false);
    }
  };

  const onBalanceUpdate = (newBalance: number) => {
    setUser((prev: any) => ({ ...prev, bricks: newBalance }));
  };

  if (!user) return <div className="h-screen bg-gray-950 flex items-center justify-center"><Brain className="w-12 h-12 text-purple-500 animate-pulse" /></div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white font-roboto pb-20 overflow-x-hidden">
      <TopUpModal isOpen={showTopUp} onClose={() => setShowTopUp(false)} onBalanceUpdate={onBalanceUpdate} />
      <WithdrawModal isOpen={showWithdraw} onClose={() => setShowWithdraw(false)} onBalanceUpdate={onBalanceUpdate} currentBalance={user.bricks || 0} />

      <div className="h-64 bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900 relative">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <div className="absolute -bottom-20 left-12 flex items-end gap-8">
           <div className="w-40 h-40 rounded-[3rem] bg-gray-900 border-8 border-gray-950 shadow-2xl relative overflow-hidden group">
              <User className="w-full h-full p-8 text-gray-800" />
              <div className="absolute inset-0 bg-purple-500/10" />
           </div>
           <div className="pb-6">
              {isEditing ? (
                <div className="space-y-2">
                  <input 
                    value={editName} 
                    onChange={e => setEditName(e.target.value)}
                    className="bg-black/50 border border-purple-500 rounded-xl px-4 py-1 text-2xl font-black uppercase tracking-tighter outline-none"
                  />
                  <input 
                    value={editBio} 
                    onChange={e => setEditBio(e.target.value)}
                    className="block w-full bg-black/50 border border-gray-800 rounded-lg px-4 py-1 text-xs text-gray-400 outline-none"
                  />
                </div>
              ) : (
                <>
                  <h1 className="text-4xl font-black tracking-tighter uppercase italic">{user.username}</h1>
                  <p className="text-gray-400 text-sm font-medium mt-1">{user.bio || "Neural Pilot of the BrainBricks ecosystem."}</p>
                  <div className="flex gap-12 mt-6 border-t border-white/10 pt-6">
                    <div className="flex flex-col">
                      <span className="text-xl font-black text-white italic">24</span>
                      <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Successful Missions</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xl font-black text-white italic">12</span>
                      <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Models Sold</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xl font-black text-purple-400 italic">S-Tier</span>
                      <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Architect Rank</span>
                    </div>
                  </div>
                </>
              )}
           </div>
           <button 
             onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
             className="mb-8 p-3 bg-gray-800 hover:bg-purple-600 rounded-2xl transition-all shadow-xl"
           >
             {isEditing ? <Save className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
           </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-32 grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
        <div className="space-y-8">
          <div className="bg-gray-900 border border-gray-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 blur-3xl" />
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-8">Quantum Balance</h3>
            <div className="flex items-center gap-4 mb-8">
               <div className="w-12 h-12 bg-yellow-500 rounded-2xl flex items-center justify-center text-black font-black text-xl shadow-lg shadow-yellow-500/20">₿</div>
               <div className="text-5xl font-black tracking-tighter italic">{(user.bricks || 0).toLocaleString()}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setShowTopUp(true)} className="py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">Top Up</button>
              <button onClick={() => setShowWithdraw(true)} className="py-4 bg-gray-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-700 transition-all">Withdraw</button>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-[2.5rem] p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl" />
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6">Neural Tier</h3>
            <div className="p-5 bg-gradient-to-br from-purple-600/20 to-indigo-600/10 border border-purple-500/30 rounded-[2rem] space-y-4">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <Zap className="w-5 h-5 text-purple-400" />
                     <span className="text-xs font-black uppercase tracking-widest">Neural Nexus</span>
                  </div>
                  <CheckCircle className="w-4 h-4 text-purple-400" />
               </div>
               <p className="text-[9px] text-gray-500 font-medium leading-relaxed">Active Monthly Subscription (1,900 ₿/mo). Includes unlimited Forge generations and priority AI nodes.</p>
               <Link to="/billing" className="block w-full py-3 bg-purple-600 hover:bg-purple-500 text-white text-center rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">
                  Manage Plan
               </Link>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="flex gap-8 border-b border-gray-800">
            {["builds", "activity", "billing"].map((t: any) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === t ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                {t}
                {activeTab === t && <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500" />}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeTab === "builds" && Array.isArray(myBuilds) && myBuilds.map((b, idx) => (
              <div key={idx} className="group bg-gray-900 border border-gray-800 rounded-[2.5rem] overflow-hidden hover:border-purple-500/50 transition-all flex flex-col shadow-2xl">
                <div className="h-48 bg-black relative flex items-center justify-center overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent" />
                   <Bot className="w-20 h-20 text-gray-800 group-hover:scale-110 group-hover:text-purple-500/20 transition-all duration-700" />
                   <div className="absolute bottom-4 left-4 flex gap-2">
                      <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10">
                         <span className="text-[8px] font-black text-cyan-400 uppercase tracking-widest">{b.difficulty || 'Advanced'}</span>
                      </div>
                   </div>
                </div>
                <div className="p-8">
                  <h4 className="text-xl font-black uppercase tracking-tighter mb-2 text-white">{b.name}</h4>
                  <p className="text-xs text-gray-500 mb-6 line-clamp-2 font-medium leading-relaxed">{b.description}</p>
                  <div className="flex items-center justify-between">
                     <Link to="/builder" className="px-6 py-2 bg-white text-black rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all">Open in Forge</Link>
                     <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase">Revenue:</span>
                        <span className="text-[10px] font-black text-green-500">{(idx + 1) * 150} ₿</span>
                     </div>
                  </div>
                </div>
              </div>
            ))}
            {activeTab === "activity" && (
              <div className="col-span-2 space-y-3">
                {(user.activity || []).map((act: any, i: number) => (
                  <div key={i} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Clock className="w-4 h-4 text-gray-600" />
                      <span className="text-xs font-medium text-gray-300">{act.message}</span>
                    </div>
                    <span className={`text-[10px] font-black uppercase ${act.amount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {act.amount >= 0 ? '+' : ''}{act.amount} ₿
                    </span>
                  </div>
                ))}
              </div>
            )}
            {activeTab === "billing" && (
               <div className="col-span-2 space-y-6">
                  <div className="p-8 bg-gray-900 border border-gray-800 rounded-[2rem] flex items-center justify-between">
                     <div>
                        <h4 className="text-sm font-black uppercase tracking-widest text-white mb-2">Active Plan: Neural Nexus</h4>
                        <p className="text-xs text-gray-500">Next billing cycle: June 11, 2026</p>
                     </div>
                     <div className="text-right">
                        <div className="text-xl font-black text-white">1,900 ₿</div>
                        <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Per Month</div>
                     </div>
                  </div>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
