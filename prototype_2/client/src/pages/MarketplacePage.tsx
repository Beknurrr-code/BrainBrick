import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Wrench, Bot, Sparkles, Heart, Download, Star, Search, Upload, X, Check, Globe, MessageSquare } from "lucide-react";
import Robot3D from "../components/Robot3D";

type ItemType = "builds" | "prompts" | "mcp_tools";

interface MarketItem {
  id: string;
  name: string;
  description: string;
  author: string;
  type: ItemType;
  chassis: "lego" | "arduino" | "diy" | "universal";
  likes: number;
  downloads: number;
  tags: string[];
  rating: number;
  date: string;
  price: number;
  installed?: boolean;
  code?: string | null;
}

const INITIAL_MARKET_DATA: MarketItem[] = [
  { id: "1", name: "Rover Bot Pro", description: "Enhanced rover with line following. Compatible with LEGO 51515.", author: "BrainBricks Team", type: "builds", chassis: "lego", likes: 142, downloads: 89, tags: ["rover", "camera"], rating: 4.8, date: "2026-04-20", price: 0 },
  { id: "2", name: "Arduino Arm", description: "3-axis arm for ESP32/Arduino. High precision sorting.", author: "RoboMaster_42", type: "builds", chassis: "arduino", likes: 98, downloads: 56, tags: ["arm", "esp32"], rating: 4.6, date: "2026-04-21", price: 150 },
  { id: "3", name: "Cardboard Pet", description: "The most affordable robot. Just cardboard and your phone!", author: "BuilderKid", type: "builds", chassis: "diy", likes: 215, downloads: 134, tags: ["pet", "low-cost"], rating: 4.9, date: "2026-04-22", price: 50 },
  { id: "8", name: "Weather MCP", description: "Real-time weather data for any robot brain.", author: "BrainBricks Team", type: "mcp_tools", chassis: "universal", likes: 88, downloads: 67, tags: ["weather", "api"], rating: 4.4, date: "2026-04-19", price: 0 },
];

const typeLabels: Record<ItemType, string> = {
  builds: "Builds",
  prompts: "Prompts",
  mcp_tools: "MCP Tools",
};

const typeIcons: Record<ItemType, React.ReactNode> = {
  builds: <Bot className="w-4 h-4" />,
  prompts: <Sparkles className="w-4 h-4" />,
  mcp_tools: <Wrench className="w-4 h-4" />,
};

export default function MarketplacePage({ isSubComponent = false }: { isSubComponent?: boolean }) {
  const [activeTab, setActiveTab] = useState<ItemType | "all">("all");
  const [search, setSearch] = useState("");
  const [githubResults, setGithubResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [installed, setInstalled] = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showAICreator, setShowAICreator] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<{likes: Record<string, number>, downloads: Record<string, number>}>({likes: {}, downloads: {}});
  const [forgeType, setForgeType] = useState<ItemType>("builds");
  const [chassisFilter, setChassisFilter] = useState<"all" | "lego" | "arduino" | "diy">("all");
  const [sortBy, setSortBy] = useState<"popular" | "newest" | "rating">("popular");
  const [marketData, setMarketData] = useState<MarketItem[]>(INITIAL_MARKET_DATA);
  const [bricks, setBricks] = useState(0);

  useEffect(() => {
    fetch("/api/marketplace/items")
      .then(res => res.json())
      .then(data => {
        setMarketData(data);
      });
    fetch("/api/marketplace/stats").then(res => res.json()).then(setStats);
    fetch("/api/user/profile").then(res => res.json()).then(data => setBricks(data.bricks || 0));
  }, []);

  const handleSearch = async (val: string) => {
    setSearch(val);
    if (val.length > 3) {
      setSearching(true);
      try {
        const res = await fetch(`/api/marketplace/github?q=${encodeURIComponent(val)}`);
        const data = await res.json();
        setGithubResults(data);
      } catch (e) {
        console.error("GitHub search failed", e);
      } finally {
        setSearching(false);
      }
    } else {
      setGithubResults([]);
    }
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt) return;
    setAiGenerating(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt, type: forgeType === "builds" ? "build" : forgeType === "mcp_tools" ? "mcp" : "prompt" }),
      });
      const data = await res.json();
      const artifact = data.artifact;
      
      const newItem: MarketItem = {
        id: `ai-${Date.now()}`,
        name: artifact.name,
        description: artifact.description,
        author: "BrainBricks Forge",
        type: forgeType,
        chassis: "universal",
        likes: 0,
        downloads: 0,
        tags: ["ai-generated", forgeType],
        rating: 5.0,
        date: new Date().toISOString().split('T')[0],
        price: artifact.price || 100,
        code: artifact.code || null,
        installed: true
      };
      marketData.unshift(newItem);
      setSelectedItem(newItem);
      setShowAICreator(false);
      setAiPrompt("");
    } catch (e) {
      alert("Synthesis failed. Check logs.");
    } finally {
      setAiGenerating(false);
    }
  };

  const filtered = marketData.filter((item) => {
    const matchTab = activeTab === "all" || item.type === activeTab;
    const matchChassis = chassisFilter === "all" || item.chassis === chassisFilter || item.chassis === "universal";
    const matchSearch =
      search === "" ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    return matchTab && matchChassis && matchSearch;
  }).sort((a, b) => {
    if (sortBy === "popular") return ((stats.downloads[b.id] || 0) + b.downloads) - ((stats.downloads[a.id] || 0) + a.downloads);
    if (sortBy === "rating") return b.rating - a.rating;
    if (sortBy === "newest") return new Date(b.date).getTime() - new Date(a.date).getTime();
    return 0;
  });

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      name: formData.get("name"),
      type: formData.get("type"),
      description: formData.get("description"),
      price: Number(formData.get("price")),
      chassis: "universal",
      author: "TestUser",
      tags: ["community", "new"]
    };

    try {
      const res = await fetch("/api/marketplace/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setShowUpload(false);
        fetch("/api/marketplace/items").then(res => res.json()).then(setMarketData);
      }
    } catch (e) {
      alert("Upload failed");
    }
  };

  const handleInstall = async (id: string) => {
    setInstalled((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        fetch("/api/marketplace/purchase", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId: id }),
        }).then(res => res.json()).then(data => {
          if (data.success) {
            setBricks(data.newBalance);
            alert(`Successfully purchased ${id}! ₿`);
            setStats(prev => ({ ...prev, downloads: { ...prev.downloads, [id]: (prev.downloads[id] || 0) + 1 } }));
          } else {
            alert("Purchase failed: " + data.message);
            next.delete(id);
          }
        });
      }
      return next;
    });
  };

  const handleLike = async (id: string) => {
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        next.add(id);
        fetch("/api/marketplace/like", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        }).then(res => res.json()).then(data => {
          setStats(prev => ({ ...prev, likes: { ...prev.likes, [id]: data.count } }));
        });
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          {!isSubComponent && (
            <div>
              <h1 className="text-4xl font-black text-white flex items-center gap-3 tracking-tighter">
                <ShoppingCart className="w-10 h-10 text-purple-400" />
                MARKETPLACE
              </h1>
              <p className="text-gray-500 mt-1 font-medium">
                Explore the global ecosystem of BrainBricks modules.
              </p>
            </div>
          )}
          <div className="flex flex-col md:flex-row gap-3">
            <button
              onClick={() => setShowAICreator(true)}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-4 py-2 rounded-lg font-bold transition-all shadow-lg shadow-cyan-900/20 group"
            >
              <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              AI Tool Creator
            </button>
            <Link
              to="/builder"
              className="flex items-center justify-center gap-2 bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-300 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload Build
            </Link>
            <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 px-4 py-2 rounded-lg text-orange-400 font-black tracking-tighter italic shadow-[0_0_15px_rgba(249,115,22,0.1)]">
              ₿ {bricks}
            </div>
          </div>
        </div>

        {/* Search + Tabs + Filters */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1 group">
              <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-all ${searching ? 'animate-spin' : ''}`}>
                {searching ? <Sparkles className="w-5 h-5 text-purple-400" /> : <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-purple-400" />}
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search community artifacts..."
                className="w-full pl-11 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-500 transition-all font-medium"
              />
            </div>
            <div className="flex gap-2">
              <select 
                value={chassisFilter}
                onChange={(e) => setChassisFilter(e.target.value as any)}
                className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-sm text-gray-300 outline-none focus:border-purple-500"
              >
                <option value="all">All Chassis</option>
                <option value="lego">LEGO Hub</option>
                <option value="arduino">Arduino / ESP</option>
                <option value="diy">DIY / Cardboard</option>
              </select>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-sm text-gray-300 outline-none focus:border-purple-500"
              >
                <option value="popular">Popular</option>
                <option value="newest">Newest</option>
                <option value="rating">Rating</option>
              </select>
            </div>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {(["all", "builds", "prompts", "mcp_tools"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap px-6 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${
                  activeTab === tab
                    ? "bg-purple-600 text-white shadow-xl shadow-purple-900/40"
                    : "bg-gray-900 text-gray-500 hover:text-white hover:bg-gray-800 border border-gray-800"
                }`}
              >
                {tab === "all" ? "All Discovery" : typeLabels[tab]}
              </button>
            ))}
          </div>
        </div>

        {/* GitHub Results Section */}
        {githubResults.length > 0 && (
          <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
             <div className="flex items-center gap-2 mb-4 text-cyan-400 font-bold text-xs uppercase tracking-widest">
               <Globe className="w-4 h-4" /> Global GitHub Finds for "{search}"
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
               {githubResults.map((repo: any) => (
                 <a href={repo.url} target="_blank" key={repo.id} className="bg-gray-900/40 border border-cyan-900/20 hover:border-cyan-500/50 p-4 rounded-2xl group transition-all backdrop-blur-sm">
                   <div className="flex items-center justify-between mb-2">
                     <span className="text-[10px] font-black text-cyan-500 bg-cyan-950 px-2 py-0.5 rounded uppercase">{repo.language || 'Code'}</span>
                     <Star className="w-3.5 h-3.5 text-gray-600 group-hover:text-yellow-400 transition-colors" />
                   </div>
                   <h4 className="text-white font-bold text-sm truncate group-hover:text-cyan-300 transition-colors">{repo.name}</h4>
                   <p className="text-xs text-gray-500 line-clamp-2 mt-1 mb-3">{repo.description || 'No description available.'}</p>
                   <div className="text-[10px] text-gray-600 font-mono">{repo.author}</div>
                 </a>
               ))}
             </div>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 mb-6">
          <div className="h-0.5 flex-1 bg-gray-900"></div>
          <div className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">{filtered.length} Local Artifacts</div>
          <div className="h-0.5 flex-1 bg-gray-900"></div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-purple-500/50 transition-all group cursor-pointer"
              onClick={() => setSelectedItem(item)}
            >
              {/* Type badge + likes */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold bg-gray-800 text-gray-300 px-2.5 py-1 rounded-full uppercase tracking-tighter">
                    {typeIcons[item.type]}
                    {typeLabels[item.type]}
                  </span>
                  {item.chassis !== "universal" && (
                    <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-tighter border ${
                      item.chassis === 'lego' ? 'border-yellow-500/30 text-yellow-500 bg-yellow-500/5' :
                      item.chassis === 'arduino' ? 'border-blue-500/30 text-blue-400 bg-blue-500/5' :
                      'border-green-500/30 text-green-400 bg-green-500/5'
                    }`}>
                      {item.chassis}
                    </span>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLike(item.id);
                  }}
                  className="flex items-center gap-1 text-gray-500 hover:text-red-400 transition-colors"
                >
                  <Heart className={`w-4 h-4 ${liked.has(item.id) ? "fill-red-400 text-red-400" : ""}`} />
                  <span className="text-xs">{(stats.likes[item.id] || 0) + item.likes}</span>
                </button>
              </div>

              {/* Name + Author */}
              <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors mb-1">
                {item.name}
              </h3>
              <p className="text-xs text-gray-500 mb-2">by {item.author}</p>

              {/* Description */}
              <p className="text-sm text-gray-400 mb-3 line-clamp-2">{item.description}</p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {item.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Rating + Downloads + Install */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-yellow-400">
                    <Star className="w-4 h-4 fill-yellow-400" />
                    <span className="text-sm font-medium">{item.rating}</span>
                  </span>
                  <span className="flex items-center gap-1 text-gray-500 text-xs">
                    <Download className="w-3.5 h-3.5" />
                    {(stats.downloads[item.id] || 0) + item.downloads}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-purple-400 flex items-center gap-1">
                    {item.price === 0 ? "FREE" : <><Globe className="w-3 h-3" /> {item.price} ₿</>}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleInstall(item.id);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      installed.has(item.id)
                        ? "bg-green-600/20 text-green-400 border border-green-600/30"
                        : "bg-purple-600 hover:bg-purple-700 text-white"
                    }`}
                  >
                    {installed.has(item.id) ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Installed
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        {item.id === "1" || item.id === "8" ? "Install" : "Buy Artifact"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg">No items found</p>
            <p className="text-sm">Try a different search or category</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setSelectedItem(null)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="flex items-center gap-1.5 text-xs font-medium bg-purple-600/20 text-purple-300 px-3 py-1 rounded-full">
                  {typeIcons[selectedItem.type]}
                  {typeLabels[selectedItem.type]}
                </span>
                <button onClick={() => setSelectedItem(null)} className="text-gray-500 hover:text-white" aria-label="Close details">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {selectedItem.type === "builds" && (
                <div className="h-64 mb-6 relative group">
                  <Robot3D type={selectedItem.name.toLowerCase().includes("rover") ? "rover" : selectedItem.name.toLowerCase().includes("arm") ? "arm" : "pet"} />
                </div>
              )}

              <h2 className="text-2xl font-bold text-white mb-1">{selectedItem.name}</h2>
              <p className="text-sm text-gray-500 mb-4">by {selectedItem.author}</p>

              <div className="flex items-center gap-4 mb-4">
                <span className="flex items-center gap-1 text-yellow-400">
                  <Star className="w-5 h-5 fill-yellow-400" />
                  <span className="font-semibold">{selectedItem.rating}</span>
                </span>
                <span className="flex items-center gap-1 text-gray-400 text-sm">
                  <Download className="w-4 h-4" />
                  {(stats.downloads[selectedItem.id] || 0) + selectedItem.downloads} downloads
                </span>
                <span className="flex items-center gap-1 text-gray-400 text-sm">
                  <Heart className="w-4 h-4" />
                  {(stats.likes[selectedItem.id] || 0) + selectedItem.likes} likes
                </span>
              </div>

              <p className="text-gray-300 mb-4 leading-relaxed">{selectedItem.description}</p>

              <div className="flex flex-wrap gap-2 mb-6">
                {selectedItem.tags.map((tag) => (
                  <span key={tag} className="text-sm bg-gray-800 text-gray-300 px-3 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    handleInstall(selectedItem.id);
                    setSelectedItem(null);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-colors ${
                    installed.has(selectedItem.id)
                      ? "bg-green-600/20 text-green-400 border border-green-600/30"
                      : "bg-purple-600 hover:bg-purple-700 text-white"
                  }`}
                >
                  {installed.has(selectedItem.id) ? (
                    <>
                      <Check className="w-5 h-5" />
                      Already Installed
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Install Now
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setSelectedItem(null);
                    // This will be handled by the parent SocialPage to switch tabs
                    window.dispatchEvent(new CustomEvent('social-chat', { detail: { author: selectedItem.author } }));
                  }}
                  title="Message Author"
                  className="flex items-center justify-center gap-2 px-5 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors border border-gray-700 group"
                >
                  <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowUpload(false)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Upload to Marketplace</h2>
                <button onClick={() => setShowUpload(false)} className="text-gray-500 hover:text-white" aria-label="Close upload form">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                  <input name="name" type="text" required placeholder="My awesome creation" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
                  <select name="type" required className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500">
                    <option value="builds">Build</option>
                    <option value="prompts">Prompt Pack</option>
                    <option value="mcp_tools">MCP Tool</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Price (Bricks)</label>
                  <input name="price" type="number" min="0" defaultValue="0" required className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                  <textarea name="description" rows={3} required placeholder="Describe what it does..." className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none" />
                </div>
                <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2">
                  <Upload className="w-4 h-4" />
                  Publish to Nexus
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* AI Creator Modal */}
      {showAICreator && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={() => setShowAICreator(false)}>
          <div className="bg-gray-900 border border-gray-800 rounded-3xl max-w-lg w-full shadow-2xl relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-black text-white flex items-center gap-2 tracking-tighter">
                    <Sparkles className="w-6 h-6 text-cyan-400" /> AI ARTIFACT FORGE
                  </h2>
                  <p className="text-gray-500 text-sm mt-1 font-medium italic">Synthesizing digital intelligence...</p>
                </div>
                <button onClick={() => setShowAICreator(false)} className="text-gray-500 hover:text-white transition-colors" aria-label="Close forge">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex gap-2 mb-6">
                {(["builds", "mcp_tools", "prompts"] as ItemType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setForgeType(t)}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                      forgeType === t 
                        ? "bg-cyan-600 border-cyan-400 text-white shadow-lg shadow-cyan-900/40" 
                        : "bg-gray-800 border-gray-700 text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    {typeLabels[t]}
                  </button>
                ))}
              </div>

              <div className="space-y-6">
                <textarea 
                  rows={4} 
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. 'Get Bitcoin price and make motor A rotate if it's over $100k'" 
                  className="w-full px-5 py-4 bg-gray-950 border border-gray-800 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 transition-all resize-none font-medium shadow-inner" 
                />

                <div className="bg-cyan-500/5 border border-cyan-500/10 rounded-2xl p-4 flex gap-4">
                  <Bot className="w-8 h-8 text-cyan-400 shrink-0" />
                  <p className="text-[10px] text-cyan-300/70 leading-relaxed font-bold uppercase tracking-tight">
                    Powered by Gemini 3 Flash. Logic artifacts are synthesized in real-time and injected into the robot's logic core.
                  </p>
                </div>

                <button 
                  onClick={handleAIGenerate}
                  disabled={aiGenerating || !aiPrompt}
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-cyan-900/40 flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                  {aiGenerating ? <Sparkles className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  {aiGenerating ? "Synthesizing Logic..." : "Synthesize Tool Artifact"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}