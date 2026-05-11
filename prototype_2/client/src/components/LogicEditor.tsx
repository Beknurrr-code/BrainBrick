import { useState } from "react";
import { Play, Save, Plus, Trash2, Cpu, Zap, Activity } from "lucide-react";

interface Block {
  id: string;
  type: "event" | "action" | "condition";
  label: string;
  color: string;
  config?: any;
}

const BLOCK_TYPES = [
  { type: "event", label: "When Button Pressed", color: "bg-yellow-500", icon: <Zap className="w-4 h-4" /> },
  { type: "event", label: "When Object Detected", color: "bg-yellow-500", icon: <Activity className="w-4 h-4" /> },
  { type: "action", label: "Rotate Motor A", color: "bg-blue-500", icon: <Cpu className="w-4 h-4" /> },
  { type: "action", label: "Stop All Motors", color: "bg-red-500", icon: <Trash2 className="w-4 h-4" /> },
  { type: "condition", label: "If Distance < 20cm", color: "bg-green-500", icon: <Plus className="w-4 h-4" /> },
];

export default function LogicEditor({ send, robotType: _robotType = "rover" }: { send: any, robotType?: string }) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const handleDeploy = () => {
    if (isRunning) {
      setIsRunning(false);
      send("stop", {});
      return;
    }
    
    setIsRunning(true);
    // Convert blocks to simple command sequence for demo
    blocks.forEach((block, i) => {
      setTimeout(() => {
        if (block.label.includes("Motor A")) send("motor", { port: "A", speed: 50 });
        if (block.label.includes("Stop")) send("stop", {});
      }, i * 1000);
    });
  };

  const addBlock = (template: any) => {
    const newBlock: Block = {
      id: Math.random().toString(36).substr(2, 9),
      ...template
    };
    setBlocks([...blocks, newBlock]);
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
  };

  return (
    <div className="flex flex-col h-full bg-gray-950/50 rounded-2xl border border-gray-800 overflow-hidden backdrop-blur-xl">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900/50">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500 animate-pulse" />
          <h2 className="text-sm font-black text-white uppercase tracking-widest">Logic Architect</h2>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleDeploy}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
              isRunning ? "bg-red-500/20 text-red-400 border border-red-500/50" : "bg-green-600 text-white shadow-lg shadow-green-900/40"
            }`}
          >
            {isRunning ? "Stop Logic" : <><Play className="w-3 h-3" /> Deploy Logic</>}
          </button>
          <button className="p-1.5 text-gray-500 hover:text-white transition-colors">
            <Save className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Block Palette */}
        <div className="w-48 border-r border-gray-800 p-4 space-y-3 bg-gray-900/30">
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-4">Components</p>
          {BLOCK_TYPES.map((bt, i) => (
            <button
              key={i}
              onClick={() => addBlock(bt)}
              className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-600 transition-all text-left group"
            >
              <div className={`p-1.5 rounded-lg ${bt.color} text-white shadow-lg shadow-black/20 group-hover:scale-110 transition-transform`}>
                {bt.icon}
              </div>
              <span className="text-[10px] font-bold text-gray-400 group-hover:text-white transition-colors truncate">{bt.label}</span>
            </button>
          ))}
        </div>

        {/* Canvas */}
        <div className="flex-1 p-6 overflow-y-auto scrollbar-hide relative bg-[radial-gradient(#1e1e1e_1px,transparent_1px)] [background-size:20px_20px]">
          {blocks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-600">
              <Cpu className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-xs font-bold uppercase tracking-widest">Drag components to start building</p>
            </div>
          ) : (
            <div className="space-y-4 max-w-md mx-auto">
              {blocks.map((block, i) => (
                <div key={block.id} className="relative group animate-in slide-in-from-left-4 duration-300">
                  {/* Connector line */}
                  {i > 0 && (
                    <div className="absolute -top-4 left-10 w-0.5 h-4 bg-gray-800" />
                  )}
                  
                  <div className={`p-4 rounded-2xl border ${block.color.replace('bg-', 'border-')}/30 bg-gray-900/80 backdrop-blur-md flex items-center justify-between shadow-xl`}>
                    <div className="flex items-center gap-3">
                       <div className={`p-2 rounded-xl ${block.color} text-white`}>
                         {BLOCK_TYPES.find(t => t.type === block.type)?.icon}
                       </div>
                       <div>
                         <p className="text-[10px] font-black text-gray-500 uppercase tracking-tighter mb-0.5">{block.type}</p>
                         <h3 className="text-xs font-bold text-white">{block.label}</h3>
                       </div>
                    </div>
                    <button 
                      onClick={() => removeBlock(block.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-gray-600 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              
              <button 
                onClick={() => addBlock(BLOCK_TYPES[0])}
                className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-800 hover:border-gray-600 text-gray-600 hover:text-gray-400 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Append Logic Node</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
