"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileText, Database, BarChart3, LogOut, Gem, Sun, Moon, User } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.classList.toggle("dark", savedTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const handleLogout = () => {
    localStorage.removeItem("shruti_auth");
    window.location.reload();
  };

  const navItems = [
    { name: "Live Dashboard", href: "/", icon: Home },
    { name: "Create Bill", href: "/billing", icon: FileText },
    { name: "Bills Database", href: "/database", icon: Database },
    { name: "Sales Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Profile Settings", href: "/profile", icon: User },
  ];

  return (
    <div className="w-64 bg-card border-r border-card-border flex flex-col justify-between hidden md:flex h-full">
      
      <div>
        <div className="p-6 flex items-center gap-3">
          <Gem className="w-8 h-8 text-[#c9a84c]" />
          <div>
            <h1 className="text-xl font-serif text-gradient font-bold leading-tight">Shruti<br/>Jewellers</h1>
            <div className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">GSTIN: BRKPK3023K</div>
          </div>
        </div>

        <nav className="mt-6 px-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.href}>
                <span className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? "bg-[#c9a84c]/10 text-[#c9a84c] border border-[#c9a84c]/30" 
                    : "text-muted hover:text-[#c9a84c] hover:bg-[#c9a84c]/5"
                }`}>
                  <Icon className="w-5 h-5" />
                  <span className="font-medium text-sm">{item.name}</span>
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-card-border space-y-2">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-muted hover:text-[#c9a84c] hover:bg-[#c9a84c]/10 transition-colors"
        >
          {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          <span className="font-medium text-sm">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-sm">Secure Logout</span>
        </button>
      </div>

    </div>
  );
}
