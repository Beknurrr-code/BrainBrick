import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Bot, Wrench, Eye, Sparkles, Zap, ArrowRight,
  ShoppingCart, DollarSign, TrendingUp, Lock, CheckCircle,
  LogOut
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

export default function HomePage() {
  const { isAuth, user, login: contextLogin, logout: contextLogout } = useAuth();
  const username = user?.username || "Commander";
  const [isRegister, setIsRegister] = useState(false);
  const [inputName, setInputName] = useState("");
  const [inputEmail, setInputEmail] = useState("");
  const [inputPassword, setInputPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const login = async () => {
    setAuthError("");
    try {
      const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
      const payload = isRegister 
        ? { username: inputName, email: inputEmail, password: inputPassword }
        : { username: inputName, password: inputPassword };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        contextLogin(data.token, data.user);
      } else {
        setAuthError(data.error || "Authentication failed");
      }
    } catch (e) {
      setAuthError(`Server unreachable at http://192.168.68.71:3001. Error: ${e instanceof Error ? e.message : 'Unknown'}`);
    }
  };

  const logout = () => {
    contextLogout();
  };

  if (isAuth) {
    return (
      <div className="min-h-screen bg-gray-950 selection:bg-purple-500/30">
        <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold group">
              <div className="w-10 h-10 bg-gradient-to-tr from-purple-600 to-cyan-500 rounded-xl flex items-center justify-center p-2 shadow-lg shadow-purple-500/20 group-hover:rotate-6 transition-transform">
                <img src="/logo.png" alt="BrainBricks" className="w-full h-full rounded-lg" />
              </div>
              <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent italic tracking-tighter font-black uppercase">BrainBricks [V-FIXED]</span>
            </Link>
            <div className="flex gap-4 items-center">
              <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-gray-900 border border-gray-800 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Neural Link Active</span>
              </div>
              <Link to="/dashboard" className="px-5 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-sm font-black uppercase tracking-widest shadow-lg shadow-purple-900/40 transition-all active:scale-95">Command Center</Link>
              <button onClick={logout} className="p-2 text-gray-500 hover:text-red-400 transition-colors" title="Logout"><LogOut className="w-5 h-5" /></button>
            </div>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto px-4 py-16">
          <header className="mb-16 relative">
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full mb-4">
                <Sparkles className="w-3 h-3 text-purple-400" />
                <span className="text-[10px] font-black text-purple-300 uppercase tracking-widest">Commander Protocol Engaged</span>
              </div>
              <h1 className="text-5xl font-black text-white mb-4 tracking-tight leading-[0.9]">
                Welcome to the Hub,<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">{username}</span>.
              </h1>
              <p className="text-xl text-gray-400 max-w-xl leading-relaxed">Your fleet of AI-powered robots is standing by. Choose your mission below.</p>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
             <Link to="/dashboard" className="relative overflow-hidden bg-gray-900 border border-gray-800 rounded-[2.5rem] p-10 hover:border-purple-500/50 transition-all group shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 blur-3xl group-hover:bg-purple-600/10 transition-all" />
                <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Bot className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-2xl font-black mb-3 text-white uppercase tracking-tight">Mission Control</h3>
                <p className="text-gray-500 leading-relaxed font-medium">Direct live operations, inject AI logic, and monitor neural telemetry in real-time.</p>
                <div className="mt-8 flex items-center gap-2 text-purple-400 font-black text-xs uppercase tracking-widest">
                  Deploy Agent <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                </div>
             </Link>

             <Link to="/builder" className="relative overflow-hidden bg-gray-900 border border-gray-800 rounded-[2.5rem] p-10 hover:border-cyan-500/50 transition-all group shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-600/5 blur-3xl group-hover:bg-cyan-600/10 transition-all" />
                <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Wrench className="w-8 h-8 text-cyan-400" />
                </div>
                <h3 className="text-2xl font-black mb-3 text-white uppercase tracking-tight">Neural Forge</h3>
                <p className="text-gray-500 leading-relaxed font-medium">Assemble physical LEGO bodies and sync them with their digital AI twins.</p>
                <div className="mt-8 flex items-center gap-2 text-cyan-400 font-black text-xs uppercase tracking-widest">
                  Build Robot <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                </div>
             </Link>

             <Link to="/marketplace" className="relative overflow-hidden bg-gray-900 border border-gray-800 rounded-[2.5rem] p-10 hover:border-green-500/50 transition-all group shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-600/5 blur-3xl group-hover:bg-green-600/10 transition-all" />
                <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <ShoppingCart className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-2xl font-black mb-3 text-white uppercase tracking-tight">Trade Hub</h3>
                <p className="text-gray-500 leading-relaxed font-medium">Acquire advanced MCP tools and sell your own neural personalities for Bricks.</p>
                <div className="mt-8 flex items-center gap-2 text-green-400 font-black text-xs uppercase tracking-widest">
                  Open Market <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                </div>
             </Link>
          </div>

          <div className="text-center py-12">
            <p className="text-gray-600 text-sm font-mono uppercase tracking-widest">Connect your device to the hub to begin.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 font-sans selection:bg-purple-500/30 overflow-x-hidden">
      {/* Premium Navbar */}
      <nav className="border-b border-gray-800/50 bg-gray-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-tr from-purple-600 to-cyan-500 rounded-xl flex items-center justify-center p-2 shadow-lg shadow-purple-500/20 group-hover:rotate-6 transition-transform">
              <img src="/logo.png" alt="BrainBricks" className="w-full h-full rounded-lg" />
            </div>
            <span className="text-2xl font-black text-white italic tracking-tighter uppercase">BrainBricks</span>
          </Link>
          <div className="hidden lg:flex items-center gap-10">
            {['Features', 'Economy', 'Roadmap'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-[10px] font-black text-gray-500 hover:text-white uppercase tracking-[0.2em] transition-colors">{item}</a>
            ))}
            <Link to="/academy" className="text-[10px] font-black text-gray-500 hover:text-white uppercase tracking-[0.2em] transition-colors">Academy</Link>
            <Link to="/marketplace" className="text-[10px] font-black text-gray-500 hover:text-white uppercase tracking-[0.2em] transition-colors">Marketplace</Link>
          </div>
          <div className="flex items-center gap-4">
            <a href="#get-started" className="hidden sm:flex px-6 py-2.5 bg-gray-900 border border-gray-800 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:border-purple-500/50 transition-all">Investor Deck</a>
            <a href="#get-started" className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-purple-500/20 active:scale-95">Join Beta</a>
          </div>
        </div>
      </nav>

      {/* Hero Section 2.0 */}
      <section className="pt-32 pb-32 px-6 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-full mb-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
               <Sparkles className="w-4 h-4 text-purple-400" />
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Redefining STEM with Agentic AI</span>
            </div>
            <h1 className="text-7xl md:text-[9.5rem] font-black text-white mb-8 leading-[0.85] tracking-tighter uppercase italic">
              Build <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">Soul</span>.<br />
              <span className="ml-0 md:ml-20">Own the <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">Future</span>.</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 mb-14 max-w-3xl mx-auto font-medium leading-relaxed">
              The world's first AI-Agent platform for LEGO. We turn toys into autonomous workers, creators, and assets. Powered by Gemini Robotics.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full">
              <a href="#get-started" className="w-full sm:w-auto px-12 py-6 bg-white text-black rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:bg-gray-200 transition-all hover:scale-105 shadow-[0_0_60px_rgba(255,255,255,0.1)]">Initialize Soul</a>
              <Link to="/marketplace" className="w-full sm:w-auto px-12 py-6 bg-gray-900 text-white border border-gray-800 rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:border-purple-500/50 transition-all group">
                Enter Market <ArrowRight className="w-4 h-4 inline ml-2 group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>

            {/* Social Proof Stats */}
            <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-12 w-full border-t border-gray-800 pt-16">
              {[
                { label: "Active Souls", val: "5,240+", icon: Bot, color: "text-purple-400" },
                { label: "Bricks Earned", val: "1.8M ₿", icon: Zap, color: "text-cyan-400" },
                { label: "Neural Tools", val: "150+", icon: Wrench, color: "text-green-400" },
                { label: "Market Volume", val: "$42K", icon: TrendingUp, color: "text-yellow-400" },
              ].map((stat, i) => (
                <div key={i} className="text-center group">
                  <div className={`w-12 h-12 ${stat.color} bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div className="text-3xl font-black text-white mb-1 tracking-tight">{stat.val}</div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* The Bricks Economy Visualization */}
      <section id="economy" className="py-32 px-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-600/5 blur-[150px] rounded-full pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-24">
            <h2 className="text-5xl font-black mb-6 uppercase italic tracking-tighter">The Bricks Economy</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto font-medium leading-relaxed">We created a circular economy where kids and creators earn real value for their neural innovations.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-cyan-500 hidden md:block opacity-10" />
            
            {[
              { step: "Build & Train", desc: "Design physical robots and train their AI personalities using our Neural Forge.", icon: Bot, color: "from-purple-600 to-purple-400" },
              { step: "Tokenize & Publish", desc: "Convert your robot configurations and MCP tools into marketplace assets.", icon: ShoppingCart, color: "from-cyan-600 to-cyan-400" },
              { step: "Earn & Withdraw", desc: "Get paid in Bricks (₿) for every download. Withdraw to real currency.", icon: DollarSign, color: "from-green-600 to-green-400" },
            ].map((card, i) => (
              <div key={i} className="relative bg-gray-900/50 border border-gray-800 p-10 rounded-[3rem] backdrop-blur-md group hover:border-white/20 transition-all">
                <div className={`w-16 h-16 bg-gradient-to-tr ${card.color} rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-black/40 group-hover:rotate-12 transition-transform`}>
                  <card.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Phase 0{i+1}</div>
                <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">{card.step}</h3>
                <p className="text-gray-500 leading-relaxed font-medium">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-32 px-6 bg-gray-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2">
              <h2 className="text-6xl font-black text-white mb-8 leading-[0.9] uppercase italic tracking-tighter">S-Tier AI <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">Architecture</span></h2>
              <p className="text-xl text-gray-400 max-w-xl font-medium leading-relaxed">Unlike traditional toys, BrainBricks robots have continuous vision, contextual memory, and the ability to write their own motor controllers.</p>
            </div>
            {[
              { title: "Neural Link 2.0", desc: "1 FPS vision stream directly into Gemini 3 Flash Live for real-time perception.", icon: Eye },
              { title: "MCP Registry", desc: "Extensible tool system allowing robots to control external APIs like YouTube, Weather, and Smart Home.", icon: Wrench },
              { title: "Behavioral RAG", desc: "Your robot remembers its environment and your voice, evolving its personality over time.", icon: Sparkles },
              { title: "LWP Direct Lnk", desc: "Native Bluetooth integration with LEGO SPIKE hubs for 0ms latency hardware control.", icon: Zap },
            ].map((f, i) => (
              <div key={i} className="p-10 bg-gray-900/50 border border-gray-800 rounded-[2.5rem] hover:bg-gray-900 transition-colors">
                <f.icon className="w-10 h-10 text-purple-400 mb-6" />
                <h4 className="text-xl font-black text-white mb-3 uppercase tracking-tight">{f.title}</h4>
                <p className="text-sm text-gray-500 leading-relaxed font-medium">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Market Opportunity / Investor Block */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-purple-900/20 to-cyan-900/20 border border-purple-500/20 rounded-[3.5rem] p-16 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8">
             <TrendingUp className="w-32 h-32 text-purple-500/5 rotate-12" />
          </div>
          <h2 className="text-4xl font-black text-white mb-6 uppercase tracking-tighter italic">Why Invest in BrainBricks?</h2>
          <p className="text-lg text-gray-400 mb-16 font-medium">We are capturing the $15B STEM market by removing the hardware barrier. Every smartphone becomes a supercomputer for robotics.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-5xl font-black text-purple-400 mb-2">$15B</div>
              <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-loose">TAM: Global STEM Market</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-black text-cyan-400 mb-2">30%</div>
              <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-loose">CAGR: AI Robotics Growth</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-black text-green-400 mb-2">1:10</div>
              <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-loose">Cost Advantage vs LEGO</div>
            </div>
          </div>

          <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-6">
            <button className="px-10 py-5 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all">Request Pitch Deck</button>
            <button className="px-10 py-5 bg-gray-900 text-white border border-gray-800 rounded-2xl font-black text-xs uppercase tracking-widest hover:border-white/20 transition-all">Watch Demo Video</button>
          </div>
        </div>
      </section>

      {/* Strategic Roadmap */}
      <section id="roadmap" className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-20">
            <h2 className="text-5xl font-black uppercase italic tracking-tighter">Roadmap</h2>
            <div className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-[10px] font-black text-purple-400 uppercase tracking-widest">Q2 2026 Focus</div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-10">
            {[
              { phase: "Q2 2026", title: "Genesis", items: ["15+ Active MCP Tools", "Native Android/iOS App", "Bricks Wallet Integration"], active: true },
              { phase: "Q3 2026", title: "Evolution", items: ["Multi-Robot Swarm Mode", "Persona NFT Registry", "Cloud-based Vision Pro"], active: false },
              { phase: "Q4 2026", title: "Mass Scale", items: ["B2B Teacher Dashboard", "LWP Direct for Micro:bit", "Global Creator Cup"], active: false },
            ].map((p, i) => (
              <div key={i} className={`p-10 rounded-[3rem] border transition-all ${p.active ? 'bg-gray-900 border-purple-500/50 shadow-2xl shadow-purple-500/10' : 'bg-transparent border-gray-800 opacity-50'}`}>
                <div className="text-xs font-black text-purple-400 uppercase tracking-widest mb-6">{p.phase}</div>
                <h3 className="text-2xl font-black text-white mb-8 uppercase tracking-tight">{p.title}</h3>
                <ul className="space-y-4">
                  {p.items.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-sm font-medium text-gray-500">
                      <CheckCircle className={`w-4 h-4 ${p.active ? 'text-green-500' : 'text-gray-800'}`} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Meet the Visionaries */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-600/5 blur-[150px] rounded-full pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-24">
            <h2 className="text-5xl font-black mb-4 tracking-tight uppercase italic tracking-tighter">Meet the Visionaries</h2>
            <p className="text-xl text-gray-400 font-medium">The team behind the AI Robot Revolution</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "Beknur", role: "Chief Architect", bio: "Lead visionary and hardware specialist. Bridging the gap between code and reality.", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Beknur" },
              { name: "Google Jules", role: "AI Core Specialist", bio: "The neural brain behind the agentic loops and autonomous logic.", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jules" },
              { name: "Neural Forge", role: "Design Engine", bio: "AI-driven 3D generation and visual identity system.", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Forge" }
            ].map((member, idx) => (
              <div key={idx} className="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-[2.5rem] p-10 hover:border-purple-500/50 transition-all group">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-purple-600 to-cyan-500 p-1 mb-8 group-hover:rotate-6 transition-transform shadow-xl shadow-black/40">
                  <img src={member.avatar} alt={member.name} className="w-full h-full rounded-[1.25rem] bg-gray-900" />
                </div>
                <h3 className="text-2xl font-black mb-2 text-white uppercase tracking-tight">{member.name}</h3>
                <div className="text-xs text-purple-400 font-black uppercase tracking-[0.2em] mb-6">{member.role}</div>
                <p className="text-gray-500 leading-relaxed font-medium">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="get-started" className="py-40 px-6 relative">
        <div className="max-w-xl mx-auto text-center">
          <div className="w-24 h-24 mx-auto mb-12 rounded-[2rem] bg-purple-500/20 flex items-center justify-center shadow-2xl shadow-purple-500/20 animate-bounce">
            <img src="/logo.png" alt="BrainBricks" className="w-16 h-16 rounded-xl" />
          </div>
          <h2 className="text-5xl font-black text-white mb-6 uppercase tracking-tighter italic">Ready to Initialize?</h2>
          <p className="text-xl text-gray-400 mb-12 font-medium">Join the exclusive beta and start earning Bricks today.</p>

          <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 p-10 rounded-[3rem] shadow-3xl">
            {authError && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-sm text-red-400 font-bold flex items-center gap-2">
                <Lock className="w-4 h-4" /> {authError}
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); login(); }} className="space-y-4">
              <input 
                type="text" 
                value={inputName} 
                onChange={(e) => setInputName(e.target.value)} 
                placeholder={isRegister ? "Username" : "Username or Email"} 
                className="w-full bg-black/50 border border-gray-800 rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium" 
              />
              {isRegister && (
                <input 
                  type="email" 
                  value={inputEmail} 
                  onChange={(e) => setInputEmail(e.target.value)} 
                  placeholder="Email" 
                  className="w-full bg-black/50 border border-gray-800 rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium" 
                />
              )}
              <input 
                type="password" 
                value={inputPassword} 
                onChange={(e) => setInputPassword(e.target.value)} 
                placeholder="Password" 
                className="w-full bg-black/50 border border-gray-800 rounded-2xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium" 
              />

              <button type="submit" className="w-full py-5 bg-purple-600 hover:bg-purple-500 rounded-2xl font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-purple-500/20 flex items-center justify-center gap-2">
                {isRegister ? "Create Soul" : "Engage Portal"} <ArrowRight className="w-5 h-5" />
              </button>
            </form>

            <button type="button" onClick={() => { setIsRegister(!isRegister); setAuthError(""); }} className="mt-8 text-sm font-bold text-gray-500 hover:text-purple-400 transition-colors uppercase tracking-widest">
              {isRegister ? "Already a Commander? Log In" : "New Pilot? Register Here"}
            </button>
          </div>
        </div>
      </section>

      {/* Footer 2.0 */}
      <footer className="border-t border-gray-800 py-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-8 group">
              <div className="w-10 h-10 bg-gradient-to-tr from-purple-600 to-cyan-500 rounded-xl flex items-center justify-center p-2 shadow-lg shadow-purple-500/20 group-hover:rotate-6 transition-transform">
                <img src="/logo.png" alt="BrainBricks" className="w-full h-full rounded-lg" />
              </div>
              <span className="text-2xl font-black text-white italic tracking-tighter uppercase">BrainBricks</span>
            </Link>
            <p className="text-gray-500 max-w-sm leading-relaxed font-medium">The intersection of physical creation and agentic intelligence. Build the future, one brick at a time.</p>
          </div>
          <div>
            <h4 className="text-white font-black uppercase tracking-widest mb-6">Platform</h4>
            <ul className="space-y-4 text-sm font-medium text-gray-500">
              <li><Link to="/builder" className="hover:text-purple-400 transition-colors">Neural Forge</Link></li>
              <li><Link to="/dashboard" className="hover:text-purple-400 transition-colors">Mission Control</Link></li>
              <li><Link to="/marketplace" className="hover:text-purple-400 transition-colors">Marketplace</Link></li>
              <li><Link to="/academy" className="hover:text-purple-400 transition-colors">Academy</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-black uppercase tracking-widest mb-6">Legal</h4>
            <ul className="space-y-4 text-sm font-medium text-gray-500">
              <li className="hover:text-purple-400 cursor-pointer transition-colors">Privacy Policy</li>
              <li className="hover:text-purple-400 cursor-pointer transition-colors">Terms of Service</li>
              <li className="hover:text-purple-400 cursor-pointer transition-colors">Bricks Agreement</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between pt-12 border-t border-gray-900 gap-4">
          <div className="text-xs text-gray-700 uppercase tracking-widest font-black">© 2026 BrainBricks. All rights reserved.</div>
          <div className="flex gap-8 text-[10px] font-black text-gray-700 uppercase tracking-[0.3em]">
            <span>Aurora Hackathon</span>
            <span>Project Grid</span>
            <span>Powered by Gemini</span>
          </div>
        </div>
      </footer>
    </div>
  );
}