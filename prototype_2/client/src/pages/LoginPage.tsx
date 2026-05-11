import { useState } from "react";
import { User, Mail, Lock, CheckCircle, ArrowRight, Bot, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
    
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      if (isRegister) {
        setSuccess(true);
        setTimeout(() => setIsRegister(false), 2000);
      } else {
        login(data.token, data.user);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[100px] -mr-32 -mt-32" />
        
        {/* Back Button */}
        <Link to="/" className="absolute top-6 left-6 z-20 flex items-center gap-2 text-gray-500 hover:text-white transition-all group">
          <div className="p-2 rounded-xl bg-gray-800/50 border border-gray-700/50 group-hover:border-purple-500/50 group-hover:bg-purple-500/10">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">Home</span>
        </Link>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-600/10 rounded-full blur-[100px] -ml-32 -mb-32" />

        <div className="relative z-10">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-tr from-purple-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-900/20 mb-4 transform -rotate-6">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">BrainBricks</h1>
            <p className="text-gray-400 mt-2 text-sm">
              {isRegister ? "Join the AI Robot Revolution" : "Welcome back, Commander"}
            </p>
          </div>

          {success ? (
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 text-center animate-bounce">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <h2 className="text-white font-bold text-lg">Registration Successful!</h2>
              <p className="text-green-400/70 text-sm mt-1">Switching to login...</p>
            </div>
          ) : (
            <form onSubmit={handleAction} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 ml-1 uppercase">
                  {isRegister ? "Username" : "Username or Email"}
                </label>
                <div className="relative group">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 group-focus-within:text-purple-400 transition-colors" />
                  <input
                    required
                    type="text"
                    placeholder={isRegister ? "Enter your username" : "Enter username or email"}
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full bg-gray-800/50 border border-gray-700/50 rounded-2xl py-3.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-600/50 focus:border-purple-500/50 text-white placeholder-gray-500 transition-all font-medium"
                  />
                </div>
              </div>

              {isRegister && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 ml-1 uppercase">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 group-focus-within:text-purple-400 transition-colors" />
                    <input
                      required
                      type="email"
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-gray-800/50 border border-gray-700/50 rounded-2xl py-3.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-600/50 focus:border-purple-500/50 text-white placeholder-gray-500 transition-all font-medium"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 ml-1 uppercase">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 group-focus-within:text-purple-400 transition-colors" />
                  <input
                    required
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-gray-800/50 border border-gray-700/50 rounded-2xl py-3.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-600/50 focus:border-purple-500/50 text-white placeholder-gray-500 transition-all font-medium"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs py-2.5 px-4 rounded-xl text-center font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-purple-900/20 transform active:scale-[0.98] transition-all flex items-center justify-center gap-2 group mt-4"
              >
                {loading ? "Commander, Wait..." : (isRegister ? "Join Intelligence" : "Login to System")}
                <ArrowRight className={`w-4 h-4 group-hover:translate-x-1 transition-transform ${loading ? 'hidden' : ''}`} />
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-gray-800/50 text-center">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-gray-400 hover:text-purple-400 text-sm font-medium transition-colors"
            >
              {isRegister ? "Already have a robot? Login" : "New to BrainBricks? Create Account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
