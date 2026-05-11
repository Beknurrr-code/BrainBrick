import { useState } from "react";
import { CheckCircle, Loader2, ArrowUpRight, Wallet } from "lucide-react";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBalanceUpdate: (newBal: number) => void;
  currentBalance: number;
}

export default function WithdrawModal({ isOpen, onClose, onBalanceUpdate, currentBalance }: WithdrawModalProps) {
  const [step, setStep] = useState<"amount" | "wallet" | "success">("amount");
  const [amount, setAmount] = useState(100);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState("");

  const handleConfirmAmount = () => {
    if (amount < 100) return alert("Minimum withdrawal is 100₿");
    if (amount > currentBalance) return alert("Insufficient balance");
    setStep("wallet");
  };
  
  const handleWithdraw = async () => {
    setLoading(true);
    // Simulate blockchain latency
    setTimeout(async () => {
      try {
        const res = await fetch("/api/user/withdraw", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount })
        });
        const data = await res.json();
        if (data.success) {
          onBalanceUpdate(data.newBalance);
          setTxHash("5Zp...x9K2"); // Simulated SOL hash
          setStep("success");
        } else {
          alert(data.message || "Withdrawal failed");
        }
      } catch (e) {
        alert("Transaction processing error");
      } finally {
        setLoading(false);
      }
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 border border-white/10 rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-8">
          {step === "amount" && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center text-yellow-500">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter">Withdraw <span className="text-yellow-500">Bricks</span></h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest italic">Convert ₿ to SOL instantly</p>
                </div>
              </div>

              <div className="bg-black/40 rounded-2xl p-6 border border-gray-800 mb-6">
                <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 text-center">Select Amount</div>
                <div className="flex items-center justify-center gap-4">
                  <button onClick={() => setAmount(Math.max(100, amount - 100))} className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-all font-black text-white">-</button>
                  <div className="text-4xl font-black text-white flex items-center gap-2">
                    <span className="text-yellow-500">₿</span>
                    {amount}
                  </div>
                  <button onClick={() => setAmount(Math.min(currentBalance, amount + 100))} className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-all font-black text-white">+</button>
                </div>
                <div className="mt-4 flex justify-between text-[8px] font-black text-gray-600 uppercase tracking-widest px-2">
                  <span>Min: 100₿</span>
                  <span>Available: {currentBalance}₿</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-6">
                {[500, 1000, 2500, currentBalance].map((val) => (
                  <button 
                    key={val}
                    onClick={() => setAmount(Math.min(currentBalance, val))}
                    className="py-2 bg-gray-800/50 hover:bg-gray-800 rounded-xl text-[10px] font-black text-gray-400 hover:text-white uppercase border border-gray-800 transition-all"
                  >
                    {val === currentBalance ? 'Max All' : `${val}₿`}
                  </button>
                ))}
              </div>

              <button 
                onClick={handleConfirmAmount}
                className="w-full py-4 bg-yellow-500 text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-yellow-400 transition-all shadow-xl shadow-yellow-900/20"
              >
                Continue to Wallet
              </button>
            </>
          )}

          {step === "wallet" && (
            <>
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Phantom <span className="text-purple-500">Link</span></h3>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-6 italic">Secure cryptographic off-ramp</p>
              
              <div className="bg-purple-600/5 border border-purple-500/20 rounded-2xl p-6 mb-8 text-center">
                 <div className="text-xs font-bold text-gray-400 mb-1">Estimated Return</div>
                 <div className="text-2xl font-black text-white flex items-center justify-center gap-2">
                    <img src="https://cryptologos.cc/logos/solana-sol-logo.png" className="w-6 h-6" alt="SOL" />
                    {(amount / 1000).toFixed(3)} SOL
                 </div>
                 <div className="text-[10px] text-purple-400 font-black mt-2 uppercase">1,000 ₿ = 1 SOL (Simulated Rate)</div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="space-y-1">
                   <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Destination Address (SOL)</div>
                   <input 
                     type="text" 
                     readOnly
                     value="3Zp...x9K2 (Your Bound Phantom Wallet)" 
                     className="w-full bg-black/40 border border-gray-800 p-4 rounded-2xl text-[10px] font-mono text-purple-400 outline-none" 
                   />
                </div>
              </div>

              <button 
                onClick={handleWithdraw}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all flex items-center justify-center gap-2 shadow-xl shadow-purple-900/40"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpRight className="w-4 h-4" />}
                Sign & Transact
              </button>
            </>
          )}

          {step === "success" && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-3xl font-black uppercase tracking-tighter mb-2">Withdraw <span className="text-green-500">Sent</span></h3>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-6 leading-relaxed">
                Your withdrawal request of <span className="text-white">{amount}₿</span> <br/> is being processed on Solana Mainnet.
              </p>
              
              <div className="bg-black border border-gray-800 rounded-xl p-3 mb-8 flex items-center justify-between">
                 <div className="text-[9px] font-mono text-gray-500">{txHash}</div>
                 <ArrowUpRight className="w-3 h-3 text-purple-400" />
              </div>

              <button 
                onClick={onClose}
                className="w-full py-4 bg-gray-800 hover:bg-white hover:text-black rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
              >
                Close Terminal
              </button>
            </div>
          )}
        </div>
        
        {step !== "success" && (
          <button onClick={onClose} className="w-full py-4 bg-gray-950/50 border-t border-white/5 text-[9px] font-black text-gray-600 uppercase tracking-widest hover:text-gray-400 transition-colors">
            Cancel Withdrawal
          </button>
        )}
      </div>
    </div>
  );
}
