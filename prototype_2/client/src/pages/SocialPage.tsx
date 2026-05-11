import { useState, useEffect, useRef } from "react";
import { Users, ShoppingBag, MessageSquare, Newspaper, Send, User as UserIcon, Clock, TrendingUp, Zap } from "lucide-react";
import MarketplacePage from "./MarketplacePage";
import { useAuth } from "../context/AuthContext";

type SocialTab = "marketplace" | "news" | "messages";

interface Message {
  id: string;
  from: string;
  to: string;
  text: string;
  timestamp: string;
}

interface Contact {
  username: string;
  avatar: string;
  bio: string;
}

export default function SocialPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SocialTab>("marketplace");
  const [targetChat, setTargetChat] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleChatRequest = (e: any) => {
      setTargetChat(e.detail.author);
      setActiveTab("messages");
    };
    window.addEventListener('social-chat', handleChatRequest);
    return () => window.removeEventListener('social-chat', handleChatRequest);
  }, []);

  useEffect(() => {
    fetchFeed();
  }, []);

  useEffect(() => {
    if (activeTab === "messages") {
      fetchContacts();
      fetchMessages();
    }
  }, [activeTab]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, targetChat]);

  const fetchFeed = async () => {
    try {
      const res = await fetch("/api/social/feed");
      const data = await res.json();
      if (Array.isArray(data)) setFeed(data);
    } catch (e) {
      console.error("Feed fetch failed", e);
    }
  };

  const fetchContacts = async () => {
    const res = await fetch("/api/social/contacts", {
      headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
    });
    const data = await res.json();
    if (Array.isArray(data)) setContacts(data);
  };

  const fetchMessages = async () => {
    const res = await fetch("/api/social/messages", {
      headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
    });
    const data = await res.json();
    if (Array.isArray(data)) setMessages(data);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !targetChat) return;

    setLoading(true);
    try {
      const res = await fetch("/api/social/send", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ to: targetChat, text: newMessage }),
      });
      if (res.ok) {
        setNewMessage("");
        fetchMessages();
        fetchContacts();
      }
    } finally {
      setLoading(false);
    }
  };

  const chatMessages = messages.filter(m => 
    (m.from === user?.username && m.to === targetChat) || 
    (m.from === targetChat && m.to === user?.username)
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col font-roboto overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
         <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 blur-[100px] rounded-full animate-pulse" />
         <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 blur-[100px] rounded-full animate-pulse delay-1000" />
      </div>

      {/* Social Header */}
      <div className="bg-gray-900/40 border-b border-gray-800 backdrop-blur-2xl sticky top-0 z-50 px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
           <div className="flex flex-col md:flex-row items-center gap-4 md:gap-10 w-full md:w-auto">
              <h1 className="text-2xl font-black italic tracking-tighter flex items-center gap-2">
                <Users className="w-6 h-6 text-purple-400" />
                SOCIAL<span className="text-gray-500">LINK</span>
              </h1>
              
              <nav className="flex gap-2 overflow-x-auto w-full no-scrollbar pb-2 md:pb-0">
                {[
                  { id: "marketplace", label: "Nexus Marketplace", icon: <ShoppingBag className="w-4 h-4" /> },
                  { id: "news", label: "Neural Feed", icon: <Newspaper className="w-4 h-4" /> },
                  { id: "messages", label: "Private Transmission", icon: <MessageSquare className="w-4 h-4" /> },
                ].map(tab => (
                  <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      activeTab === tab.id 
                        ? "bg-purple-600 text-white shadow-xl shadow-purple-900/40" 
                        : "text-gray-500 hover:text-white hover:bg-gray-800/50"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </nav>
           </div>
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 bg-black/40 border border-gray-800 px-4 py-2 rounded-xl">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                 <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Global Link Stable</span>
              </div>
           </div>
        </div>
      </div>

      {/* Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto overflow-hidden flex flex-col relative z-10">
        {activeTab === "marketplace" && (
          <div className="animate-in fade-in zoom-in-95 duration-500 flex-1 overflow-y-auto">
            <MarketplacePage isSubComponent={true} />
          </div>
        )}
        
        {activeTab === "news" && (
          <div className="p-4 md:p-8 max-w-3xl mx-auto w-full space-y-8 animate-in slide-in-from-bottom-8 duration-500">
            {/* Featured Post */}
            <div className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-purple-500/30 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] backdrop-blur-xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                  <TrendingUp className="w-32 h-32 text-purple-400" />
               </div>
               <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                     <div className="px-3 py-1 bg-purple-500 rounded-full text-[10px] font-black uppercase">Breaking</div>
                     <span className="text-[10px] font-black text-purple-300/60 uppercase tracking-widest">System Update v4.2</span>
                  </div>
                  <h2 className="text-4xl font-black tracking-tighter uppercase mb-4 leading-[0.9]">
                    New Neural <br/> 
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">Tactical HUD</span> Released
                  </h2>
                  <p className="text-gray-400 leading-relaxed mb-8 max-w-lg">
                    Experience the next generation of robot control. Direct visual link now includes object persistence and expert handoff.
                  </p>
                  <button className="px-8 py-3 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-2xl">
                    Read Manifesto
                  </button>
               </div>
            </div>

            {/* Feed Items */}
            <div className="space-y-4">
               {feed.length === 0 ? (
                 <div className="py-20 text-center space-y-4 opacity-50">
                    <Zap className="w-12 h-12 mx-auto text-gray-700" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">Monitoring Neural Waves...</p>
                 </div>
               ) : (
                 feed.map((item) => (
                   <div key={item.id} className="bg-gray-900/30 border border-gray-800 p-6 rounded-[2rem] flex items-center justify-between group hover:border-purple-500/40 transition-all backdrop-blur-md">
                      <div className="flex items-center gap-6">
                         <div className="w-14 h-14 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center text-xl font-black text-gray-500 group-hover:text-purple-400 transition-colors uppercase">
                           {item.user.charAt(0)}
                         </div>
                         <div>
                           <p className="text-base font-medium">
                             <span className="font-black text-white italic tracking-tighter uppercase">{item.user}</span>
                             <span className="text-gray-500 mx-2 uppercase text-[10px] font-black tracking-widest">{item.action}</span>
                             <span className="font-black text-purple-400 italic tracking-tighter uppercase">{item.target}</span>
                           </p>
                           <div className="flex items-center gap-2 text-[10px] text-gray-600 mt-2 font-bold uppercase tracking-widest">
                             <Clock className="w-3 h-3" /> {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </div>
                         </div>
                      </div>
                      <div className="p-3 bg-gray-800/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                         <ArrowRight className="w-5 h-5 text-gray-500" />
                      </div>
                   </div>
                 ))
               )}
            </div>
          </div>
        )}

        {activeTab === "messages" && (
          <div className="flex flex-col md:flex-row flex-1 overflow-hidden h-[calc(100vh-80px)] animate-in fade-in duration-500">
            {/* Sidebar */}
            <div className="w-full md:w-96 border-b md:border-b-0 md:border-r border-gray-800 bg-gray-900/10 backdrop-blur-md overflow-y-auto max-h-64 md:max-h-full">
               <div className="p-8 border-b border-gray-800">
                 <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] italic">Active Transmissions</h3>
               </div>
               {contacts.length === 0 ? (
                 <div className="p-20 text-center space-y-4 opacity-20">
                    <MessageSquare className="w-12 h-12 mx-auto" />
                    <p className="text-[10px] font-black uppercase tracking-widest">No Active Links</p>
                 </div>
               ) : (
                 contacts.map(contact => (
                   <button
                     key={contact.username}
                     onClick={() => setTargetChat(contact.username)}
                     className={`w-full p-6 flex items-center gap-4 border-b border-gray-800/50 transition-all text-left ${
                       targetChat === contact.username ? "bg-purple-600/10 border-r-4 border-r-purple-500" : "hover:bg-gray-800/40"
                     }`}
                   >
                     <div className="w-12 h-12 rounded-2xl bg-gray-800 overflow-hidden relative border border-gray-700">
                        <img src={contact.avatar} alt="" className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-gray-900 rounded-full" />
                     </div>
                     <div className="flex-1 min-w-0">
                       <p className="font-black text-white uppercase tracking-tighter text-sm">{contact.username}</p>
                       <p className="text-[10px] text-gray-500 truncate uppercase font-bold mt-1 tracking-tight">{contact.bio}</p>
                     </div>
                   </button>
                 ))
               )}
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-black/20 backdrop-blur-sm">
               {targetChat ? (
                 <>
                   {/* Chat Header */}
                   <div className="px-8 py-6 border-b border-gray-800 flex items-center justify-between bg-gray-900/20 backdrop-blur-xl">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-purple-600/20 flex items-center justify-center border border-purple-500/30">
                            <UserIcon className="w-5 h-5 text-purple-400" />
                         </div>
                         <div>
                            <h3 className="font-black text-white uppercase tracking-tighter italic text-lg">{targetChat}</h3>
                            <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">Encrypted Tunnel Active</span>
                         </div>
                      </div>
                   </div>

                   {/* Messages */}
                   <div className="flex-1 overflow-y-auto p-10 space-y-6 custom-scrollbar">
                      {chatMessages.map(m => (
                        <div key={m.id} className={`flex ${m.from === user?.username ? "justify-end" : "justify-start"}`}>
                           <div className={`max-w-[60%] p-5 rounded-3xl text-xs font-medium leading-relaxed ${
                             m.from === user?.username 
                               ? "bg-purple-600 text-white rounded-tr-none shadow-2xl shadow-purple-900/30" 
                               : "bg-gray-900/60 text-gray-300 rounded-tl-none border border-gray-800"
                           }`}>
                             {m.text}
                             <div className={`text-[8px] mt-2 opacity-50 font-black uppercase tracking-widest ${m.from === user?.username ? "text-right" : "text-left"}`}>
                               {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </div>
                           </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                   </div>

                   {/* Input Area */}
                   <form onSubmit={handleSendMessage} className="p-8 border-t border-gray-800 bg-gray-900/20 backdrop-blur-xl">
                      <div className="relative flex gap-4">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder={`Establish command link with ${targetChat}...`}
                          className="flex-1 bg-black/40 border border-gray-800 rounded-2xl px-6 py-4 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-all font-medium shadow-inner"
                        />
                        <button 
                          disabled={loading || !newMessage.trim()}
                          className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-8 rounded-2xl transition-all shadow-xl shadow-purple-900/40 flex items-center justify-center"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </div>
                   </form>
                 </>
               ) : (
                 <div className="flex-1 flex flex-col items-center justify-center text-center p-20 space-y-6">
                    <div className="w-24 h-24 rounded-[2rem] bg-gray-900 border border-gray-800 flex items-center justify-center animate-pulse">
                       <MessageSquare className="w-10 h-10 text-gray-700" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xl font-black text-white uppercase tracking-tighter italic">No Active Transmission</p>
                      <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Select a pilot from the sidebar to initialize link.</p>
                    </div>
                 </div>
               )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );
}
