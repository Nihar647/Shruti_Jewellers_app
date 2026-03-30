"use client";

import { useState, useEffect } from "react";
import { Lock, ShieldCheck } from "lucide-react";
import { migrateFromLocal } from "../utils/storage";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const CORRECT_PASSWORD = "admin"; // In a real app this would be hashed/backend verified

  useEffect(() => {
    const authStatus = localStorage.getItem("shruti_auth");
    if (authStatus === "true") {
      setIsAuthenticated(true);
      // Try migrating data if already logged in and it hasn't happened yet
      migrateFromLocal().catch(err => console.error("Auto migration failed:", err));
    }
    setLoading(false);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) {
      localStorage.setItem("shruti_auth", "true");
      setIsAuthenticated(true);
      setError("");
      
      // Trigger one-time migration on first login
      try {
        await migrateFromLocal();
        console.log("Migration successful");
      } catch (err) {
        console.error("Migration failed:", err);
      }
    } else {
      setError("Incorrect password");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("shruti_auth");
    setIsAuthenticated(false);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif text-gradient font-bold mb-2">Shruti Jewellers</h1>
          <p className="text-gray-400">Business Management System</p>
        </div>

        <div className="glass-panel p-8 w-full max-w-md shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent opacity-50"></div>
          
          <div className="flex justify-center mb-6">
            <div className="bg-[#1b1b2a] p-3 rounded-full border border-[#c9a84c]/20">
              <ShieldCheck className="w-8 h-8 text-[#c9a84c]" />
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-center mb-6 text-white">Secure Login</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Access Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#12121e] border border-[#1b1b2a] focus:border-[#c9a84c] rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-gray-600 outline-none transition-colors"
                  placeholder="Enter password"
                  autoFocus
                />
              </div>
            </div>

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <button
              type="submit"
              className="w-full bg-[#c9a84c] hover:bg-[#b3923c] text-black font-semibold py-2.5 rounded-lg transition-colors mt-2"
            >
              Access System
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Inject a tiny logout button absolutely or depend on layout navigation */}
      {/* We will handle logout in standard nav, but export it via context or just use localstorage event listeners if needed. For simplicity, we can pass it down or let Nav dispatch an event. */}
      {children}
    </div>
  );
}
