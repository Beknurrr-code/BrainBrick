import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  ArrowLeft, Brain, Smartphone, Layers, CheckCircle, Target
} from "lucide-react";

interface Mission {
  id: string;
  title: string;
  description: string;
  task: string;
  reward: number;
  completed: boolean;
}

const academyModules = [
  {
    id: "m1",
    title: "Neural Assembly 101",
    icon: <Layers className="w-6 h-6" />,
    content: "Learn how to use the Neural Forge to assemble your first robot. Assign ports A and B to drive motors and Port C to the ultrasonic sensor.",
    missions: [
      { id: "mis1", title: "Port Link", task: "Assign 3 different ports in Builder", reward: 50, completed: false },
      { id: "mis2", title: "Identity", task: "Give your robot a custom name and story", reward: 25, completed: false }
    ]
  },
  {
    id: "m2",
    title: "The Agentic Loop",
    icon: <Brain className="w-6 h-6" />,
    content: "Understand how the AI interprets your hardware manifest. The 'Soul' doesn't just execute code; it understands what parts it has.",
    missions: [
      { id: "mis3", title: "First Contact", task: "Launch mission and send your first command", reward: 100, completed: false }
    ]
  },
  {
    id: "m3",
    title: "Vision & MCP",
    icon: <Smartphone className="w-6 h-6" />,
    content: "Connect your phone as the robot's eyes. Learn to use the 'Vision' module to detect objects and trigger logic.",
    missions: [
      { id: "mis4", title: "Optical Link", task: "Enable AI Vision in Launch mode", reward: 150, completed: false }
    ]
  }
];

export default function AcademyPage() {
  const [activeModule, setActiveModule] = useState(0);
  const [userMissions, setUserMissions] = useState<Mission[]>([]);

  useEffect(() => {
    // Initializing mock mission status
    const all = academyModules.flatMap(m => m.missions);
    setUserMissions(all as any);
  }, []);

  const toggleMission = (id: string) => {
    setUserMissions(prev => prev.map(m => m.id === id ? { ...m, completed: !m.completed } : m));
  };

  const progress = Math.round((userMissions.filter(m => m.completed).length / userMissions.length) * 100) || 0;

  return (
    <div className="min-h-screen bg-gray-950 text-white font-roboto selection:bg-purple-500/30">
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-16">
          <div className="space-y-4">
            <Link to="/builder" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-all group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-xs font-black uppercase tracking-[0.2em]">Back to Lab</span>
            </Link>
            <h1 className="text-5xl font-black tracking-tighter uppercase italic">
              Pilot <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Academy</span>
            </h1>
            <p className="text-gray-400 max-w-xl font-medium leading-relaxed">
              Master the art of neural robotics. Complete missions to earn **Bricks (₿)** and unlock expert tiers.
            </p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-[2.5rem] backdrop-blur-xl min-w-[240px]">
             <div className="flex items-center justify-between mb-4">
                <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Pilot Progress</div>
                <div className="text-purple-400 text-[10px] font-black uppercase">{progress}% Complete</div>
             </div>
             <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 transition-all duration-1000" style={{ width: `${progress}%` }} />
             </div>
          </div>
        </header>

        <div className="grid lg:grid-cols-12 gap-12">
          {/* Modules Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            {academyModules.map((mod, idx) => (
              <button
                key={mod.id}
                onClick={() => setActiveModule(idx)}
                className={`w-full p-6 rounded-[2rem] border transition-all text-left group relative overflow-hidden ${
                  activeModule === idx 
                    ? "bg-gray-900 border-purple-500/50 shadow-2xl shadow-purple-900/20" 
                    : "bg-gray-900/30 border-gray-800 hover:border-gray-600"
                }`}
              >
                <div className="flex items-center gap-4 relative z-10">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                    activeModule === idx ? `bg-purple-600 text-white shadow-lg` : "bg-gray-800 text-gray-500"
                  }`}>
                    {mod.icon}
                  </div>
                  <div>
                    <div className={`text-[10px] font-black uppercase tracking-widest ${activeModule === idx ? "text-white" : "text-gray-500"}`}>
                      Module 0{idx + 1}
                    </div>
                    <div className={`font-bold text-sm ${activeModule === idx ? "text-white" : "text-gray-400"}`}>
                      {mod.title}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Module Detail & Missions */}
          <div className="lg:col-span-8 space-y-8">
             <div className="bg-gray-900/30 border border-gray-800 rounded-[3rem] p-10 backdrop-blur-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500 opacity-5 blur-[80px]" />
                <h2 className="text-3xl font-black tracking-tighter uppercase mb-6">{academyModules[activeModule].title}</h2>
                <p className="text-lg text-gray-400 leading-relaxed font-medium italic mb-10">
                  "{academyModules[activeModule].content}"
                </p>

                <div className="space-y-4">
                   <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                     <Target className="w-4 h-4 text-red-500" /> Active Missions
                   </h3>
                   {academyModules[activeModule].missions.map(mis => {
                     const isDone = userMissions.find(m => m.id === mis.id)?.completed;
                     return (
                       <div 
                         key={mis.id} 
                         onClick={() => toggleMission(mis.id)}
                         className={`p-6 rounded-3xl border transition-all cursor-pointer flex items-center justify-between ${
                           isDone ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-black/40 border-gray-800 text-gray-300 hover:border-gray-700'
                         }`}
                       >
                         <div className="flex items-center gap-4">
                           <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${isDone ? 'border-green-500 bg-green-500 text-white' : 'border-gray-700'}`}>
                             {isDone ? <CheckCircle className="w-4 h-4" /> : <div className="w-2 h-2 bg-gray-800 rounded-full" />}
                           </div>
                           <div>
                             <div className="font-bold text-sm uppercase tracking-tighter">{mis.title}</div>
                             <div className="text-[10px] font-medium opacity-60 uppercase">{mis.task}</div>
                           </div>
                         </div>
                         <div className="flex items-center gap-2">
                            <span className="text-xs font-black">+{mis.reward} ₿</span>
                         </div>
                       </div>
                     );
                   })}
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
