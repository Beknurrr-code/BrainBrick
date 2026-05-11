import { useState } from "react";
import { CheckCircle, ShieldCheck, Loader2, Zap } from "lucide-react";

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBalanceUpdate: (newBal: number) => void;
  initialAmount?: number;
}

export default function TopUpModal({ isOpen, onClose, onBalanceUpdate, initialAmount = 1000 }: TopUpModalProps) {
  const [step, setStep] = useState<"package" | "card" | "success">("package");
  const [selected, setSelected] = useState(initialAmount);
  const [loading, setLoading] = useState(false);

  const packages = [
    { amount: 100, price: "$0.99" },
    { amount: 400, price: "$3.49" },
    { amount: 1000, price: "$7.99" },
    { amount: 2000, price: "$14.99" },
  ];

  const handleConfirmPackage = () => setStep("card");
  
  const handlePayment = async () => {
    setLoading(true);
    // Simulate payment processing
    setTimeout(async () => {
      try {
        const res = await fetch("/api/bricks/reward", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: selected })
        });
        const data = await res.json();
        onBalanceUpdate(data.newBalance);
        setStep("success");
      } catch (e) {
        alert("Payment gateway error");
      } finally {
        setLoading(false);
      }
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 border border-white/10 rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-8">
          {step === "package" && (
            <>
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Select <span className="text-orange-500">Package</span></h3>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-6 italic">Choose your Bricks injection amount</p>
              <div className="grid grid-cols-2 gap-3 mb-8">
                {packages.map(p => (
                  <button 
                    key={p.amount}
                    onClick={() => setSelected(p.amount)}
                    className={`p-4 rounded-2xl border-2 transition-all text-left ${selected === p.amount ? 'border-orange-500 bg-orange-500/10' : 'border-gray-800 hover:border-gray-700'}`}
                  >
                    <div className="text-xl font-black tracking-tighter mb-1">₿{p.amount}</div>
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{p.price}</div>
                  </button>
                ))}
              </div>
              <button 
                onClick={handleConfirmPackage}
                className="w-full py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
              >
                Proceed to Payment
              </button>
            </>
          )}

          {step === "card" && (
            <>
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Bind <span className="text-blue-500">Card</span></h3>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-6 italic">Enter any 16-digit number to proceed</p>
              <div className="space-y-4 mb-8">
                <div className="space-y-1">
                   <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Card Number</div>
                   <input 
                     type="text" 
                     placeholder="4444 4444 4444 4444" 
                     className="w-full bg-black/40 border border-gray-800 p-4 rounded-2xl text-xs font-mono tracking-[0.3em] focus:border-blue-500 outline-none transition-all" 
                   />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Expiry</div>
                    <input 
                      type="text" 
                      placeholder="12/28" 
                      className="w-full bg-black/40 border border-gray-800 p-4 rounded-2xl text-xs font-mono tracking-[0.3em] focus:border-blue-500 outline-none transition-all" 
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">CVC</div>
                    <input 
                      type="password" 
                      placeholder="***" 
                      className="w-full bg-black/40 border border-gray-800 p-4 rounded-2xl text-xs font-mono tracking-[0.3em] focus:border-blue-500 outline-none transition-all" 
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 px-1">
                   <ShieldCheck className="w-3 h-3 text-green-500" />
                   <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">End-to-End Encrypted via BrainLink™</span>
                </div>
              </div>
              <button 
                onClick={handlePayment}
                disabled={loading}
                className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-900/30"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                {loading ? "Processing Hub..." : "Confirm Injection"}
              </button>
            </>
          )}

          {step === "success" && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-3xl font-black uppercase tracking-tighter mb-2">Payment <span className="text-green-500">Confirmed</span></h3>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-8 leading-relaxed">
                Your neural balance has been successfully <br/> injected with <span className="text-white">₿{selected}</span>.
              </p>
              <button 
                onClick={onClose}
                className="w-full py-4 bg-gray-800 hover:bg-white hover:text-black rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
              >
                Return to Hub
              </button>
            </div>
          )}
        </div>
        
        {step !== "success" && (
          <button onClick={onClose} className="w-full py-4 bg-gray-950/50 border-t border-white/5 text-[9px] font-black text-gray-600 uppercase tracking-widest hover:text-gray-400 transition-colors">
            Cancel Transaction
          </button>
        )}
      </div>
    </div>
  );
}
