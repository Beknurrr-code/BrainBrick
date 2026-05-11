import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, Zap, Sparkles, Brain, Activity, ShieldCheck, Globe, Loader2 } from "lucide-react";
import TopUpModal from "../components/TopUpModal";

export default function BillingPage() {
  const [currentTier, setCurrentTier] = useState<"standard" | "pro" | "elite">("standard");
  const [bricks, setBricks] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [showTopUp, setShowTopUp] = useState(false);
  const [selectedTopUp, setSelectedTopUp] = useState(1000);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/user/profile");
      const data = await res.json();
      if (data) {
        setBricks(data.bricks || 0);
        setCurrentTier(data.settings?.aiTier || "standard");
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    }
  };

  const handleUpgrade = async (tierId: string) => {
    if (tierId === currentTier || tierId === "standard") return;
    
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/user/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: tierId })
      });
      const data = await res.json();
      
      if (data.success) {
        setBricks(data.newBalance);
        setCurrentTier(data.newTier);
        setMessage({ text: "Upgrade Successful! Neural Nexus activated.", type: "success" });
      } else {
        setMessage({ text: data.message || "Upgrade failed.", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Network error during upgrade.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const activeTiers = [
    {
      id: "standard",
      name: "Liquid Spark",
      price: "Free",
      icon: <Zap className="w-6 h-6 text-blue-400" />,
      color: "blue",
      models: [
        "Vision: Gemini 3.1 Flash Lite",
        "Reasoning: Robotics ER 1.5"
      ],
      features: [
        "Agentic 'See & Think' loop",
        "3 Basic Robot Blueprints",
        "Standard Voice & Vision",
        "Community Marketplace access"
      ],
      cta: currentTier === "standard" ? "Current Plan" : "Downgrade (Free)"
    },
    {
      id: "pro",
      name: "Neural Nexus",
      price: "1900 ₿",
      icon: <Brain className="w-6 h-6 text-purple-400" />,
      color: "purple",
      recommended: true,
      models: [
        "Vision: Gemini 3 Flash Live (Orchestrator)",
        "Deep Reasoning: Robotics ER 1.6 (Execution)"
      ],
      features: [
        "Low-Latency Real-time interaction",
        "Auto-escalation to ER 1.6 for complex tasks",
        "YouTube vision integration",
        "Advanced Kinematics & Logic"
      ],
      cta: currentTier === "pro" ? "Active Subscription" : "Upgrade to Pro"
    }
  ];

  const brickPackages = [
    { amount: 100, price: "$0.99", popular: false },
    { amount: 400, price: "$3.49", popular: false },
    { amount: 1000, price: "$7.99", popular: true },
    { amount: 2000, price: "$14.99", popular: false }
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 md:p-12 font-roboto overflow-y-auto">
      <TopUpModal 
        isOpen={showTopUp} 
        onClose={() => setShowTopUp(false)} 
        onBalanceUpdate={(nb) => setBricks(nb)} 
        initialAmount={selectedTopUp} 
      />
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-6 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-black uppercase tracking-widest">Back to Hub</span>
          </Link>
          <h1 className="text-4xl font-black tracking-tighter uppercase mb-4">Robot Intelligence <span className="text-purple-500">& Billing</span></h1>
          <p className="text-gray-500 font-medium max-w-2xl">
            Upgrade your robot's neural network to access the world's most advanced AI models. 
            From simple tasks to autonomous spatial reasoning.
          </p>

          {message && (
            <div className={`mt-6 p-4 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center gap-3 animate-pulse ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
              <Activity className="w-4 h-4" /> {message.text}
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {activeTiers.map((tier) => (
            <div 
              key={tier.id} 
              className={`relative bg-gray-900 border ${tier.recommended ? 'border-purple-500 shadow-[0_0_40px_rgba(168,85,247,0.15)]' : 'border-gray-800'} rounded-3xl p-8 flex flex-col transition-all hover:scale-[1.02]`}
            >
              {tier.recommended && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                  Recommended
                </div>
              )}

              <div className="flex items-center justify-between mb-8">
                <div className={`p-4 bg-${tier.color}-500/10 rounded-2xl`}>
                  {tier.icon}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black tracking-tighter">{tier.price}{tier.id === 'pro' ? ' / mo' : ''}</div>
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{tier.id === 'pro' ? 'Monthly Subscription' : 'Forever'}</div>
                </div>
              </div>

              <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">{tier.name}</h3>
              <p className="text-xs text-gray-400 font-medium mb-6">Powered by Gemini Robotics stack</p>

              <div className="space-y-6 flex-1">
                <div className="space-y-3">
                  <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Neural Ecosystem</div>
                  {tier.models.map(model => (
                    <div key={model} className="flex items-center gap-2 text-xs font-medium text-gray-300">
                      <Brain className="w-3 h-3 text-purple-500" />
                      {model}
                    </div>
                  ))}
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-800">
                  <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Core Capabilities</div>
                  {tier.features.map(feat => (
                    <div key={feat} className="flex items-center gap-3 text-xs font-medium text-gray-400">
                      <Check className="w-4 h-4 text-green-500 shrink-0" />
                      {feat}
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => handleUpgrade(tier.id)}
                disabled={loading || currentTier === tier.id}
                className={`mt-10 w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                  currentTier === tier.id 
                    ? 'bg-gray-800 text-gray-400 cursor-default' 
                    : tier.recommended 
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-xl shadow-purple-900/20 active:scale-95' 
                      : 'bg-white text-black hover:bg-gray-200'
                }`}
              >
                {loading && tier.id !== currentTier ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {tier.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Brick Packages Section */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
             <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-500/10 rounded-xl">
                  <Zap className="w-5 h-5 text-orange-400" />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tighter italic">Currency Store</h2>
             </div>
             <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest bg-gray-900 px-4 py-2 rounded-full border border-gray-800">
                Current Balance: ₿ {bricks}
             </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {brickPackages.map(pkg => (
              <div key={pkg.amount} className={`relative bg-gray-900/50 border ${pkg.popular ? 'border-orange-500/50' : 'border-gray-800/50'} hover:border-orange-400 rounded-3xl p-6 transition-all group cursor-pointer`}>
                {pkg.popular && (
                  <div className="absolute -top-3 right-4 bg-orange-600 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Best Value</div>
                )}
                <div className="text-3xl font-black tracking-tighter mb-1 group-hover:scale-110 transition-transform origin-left">₿{pkg.amount}</div>
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-6">Bricks Pack</div>
                <div className="text-lg font-black text-orange-400">{pkg.price}</div>
                <button 
                  onClick={() => {
                    setSelectedTopUp(pkg.amount);
                    setShowTopUp(true);
                  }}
                  className="mt-4 w-full py-2 bg-gray-800 hover:bg-white hover:text-black rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors"
                >
                  Buy Now
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Economy Section */}
        <div className="mb-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-900 border border-gray-800 rounded-[2.5rem] p-10">
            <h2 className="text-xl font-black uppercase tracking-tighter mb-6 flex items-center gap-3">
              <Zap className="w-5 h-5 text-orange-400" /> Marketplace Economy
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <div className="text-3xl font-black tracking-tighter">20%</div>
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Platform Fee</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-black tracking-tighter text-orange-400">100🧱</div>
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Per $1.00 USD</div>
              </div>
            </div>
            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-between text-xs font-medium border-b border-gray-800 pb-3">
                <span className="text-gray-400 italic">"We empower creators to build the robot future."</span>
              </div>
              <div className="flex flex-wrap gap-2">
                 <div className="bg-black/50 px-3 py-1.5 rounded-lg text-[9px] font-bold text-gray-500 uppercase">Creator Fund</div>
                 <div className="bg-black/50 px-3 py-1.5 rounded-lg text-[9px] font-bold text-gray-500 uppercase">Weekly Payouts</div>
                 <div className="bg-black/50 px-3 py-1.5 rounded-lg text-[9px] font-bold text-gray-500 uppercase">Secure Ledger</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-[2.5rem] p-10 flex flex-col justify-center">
            <h2 className="text-xl font-black uppercase tracking-tighter mb-6 flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-purple-400" /> Free Content Pack
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {[
                { name: "3 Core Blueprints (Rover, Arm, Pet)", type: "FREE" },
                { name: "Standard MCP Toolbox", type: "FREE" },
                { name: "Basic Voice & Emotive Face", type: "FREE" },
                { name: "Global Prompt Library", type: "FREE" }
              ].map(item => (
                <div key={item.name} className="flex items-center justify-between p-3 bg-black/30 rounded-xl border border-gray-800/50">
                  <span className="text-xs font-bold text-gray-400">{item.name}</span>
                  <span className="text-[9px] font-black text-green-500 tracking-widest">{item.type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Enterprise / Educational Section */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-[3rem] p-12 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="max-w-xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center">
                <Globe className="w-6 h-6 text-orange-400" />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tighter">BrainBricks for Schools</h2>
            </div>
            <p className="text-gray-400 leading-relaxed">
              We provide enterprise-grade clusters and private model deployments for educational institutions. 
              Deploy <span className="text-purple-400">BrainBricks Lab</span> in your robotics classroom today.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 rounded-full text-[10px] font-bold text-gray-400">
                <ShieldCheck className="w-3 h-3 text-green-500" /> Multi-Robot Management
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 rounded-full text-[10px] font-bold text-gray-400">
                <Activity className="w-3 h-3 text-blue-500" /> Real-time Analytics
              </div>
            </div>
          </div>
          <button className="px-10 py-5 bg-gray-800 hover:bg-white hover:text-black rounded-3xl text-sm font-black uppercase tracking-widest transition-all shrink-0">
            Contact Sales
          </button>
        </div>

        <footer className="mt-20 py-10 border-t border-gray-900 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
            © 2026 BrainBricks OS. All neural weights reserved.
          </div>
          <div className="flex gap-8 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
            <a href="#" className="hover:text-white transition-colors">Safety Guidelines</a>
            <a href="#" className="hover:text-white transition-colors">API Docs</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
          </div>
        </footer>
      </div>
    </div>
  );
}
