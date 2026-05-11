import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Brain, Gamepad2, Wrench, GraduationCap, Users, User, LogOut, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";

export default function Navbar() {
  const { logout, user } = useAuth();
  const location = useLocation();
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
      setIsDark(false);
      document.documentElement.classList.add("light-theme");
    }
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.remove("light-theme");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.add("light-theme");
      localStorage.setItem("theme", "light");
    }
  };


  const links = [
    { to: "/builder", label: "Build", icon: Wrench },
    { to: "/dashboard", label: "Dashboard", icon: Gamepad2, desktopOnly: true },
    { to: "/academy", label: "Academy", icon: GraduationCap },
    { to: "/social", label: "Social Hub", icon: Users },
  ];

  return (
    <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold">
            <Brain className="w-6 h-6 text-purple-400" />
            <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent uppercase tracking-tighter">
              BrainBricks
            </span>
          </Link>

          <div className="flex items-center gap-1 bg-gray-900/50 p-1 rounded-full border border-gray-800 scale-90">
            <button 
              onClick={toggleTheme}
              className="p-1.5 rounded-full hover:bg-gray-800 transition-all text-gray-400 hover:text-white"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {links.map(({ to, label, icon: Icon, ...rest }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm transition-colors ${(rest as any).desktopOnly ? "hidden md:flex" : "flex"} ${
                location.pathname === to
                  ? "bg-purple-500/20 text-purple-300"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden lg:inline">{label}</span>
            </Link>
          ))}
          
          <div className="w-px h-6 bg-gray-800 mx-2 hidden md:block" />
          
          <Link
            to="/profile"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-800 transition-all hover:bg-gray-900 ${
              location.pathname === "/profile" ? "border-purple-500 bg-purple-500/10" : ""
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-[10px] font-bold">
              {user?.username?.charAt(0).toUpperCase() || <User className="w-3 h-3" />}
            </div>
            <span className="text-xs font-black uppercase tracking-tighter hidden md:block">
              {user?.username || "Guest"}
            </span>
          </Link>

          <button
            onClick={logout}
            className="ml-2 p-1.5 text-gray-500 hover:text-red-400 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}
