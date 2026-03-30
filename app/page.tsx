"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Clock, IndianRupee, Database, ShieldAlert } from "lucide-react";
import { getBills } from "./utils/storage";

function generateSimulatedRates() {
  const baseGold = 7300; // 7300 per gram approx
  const baseSilver = 85; // 85 per gram approx
  
  const fluctuation = (Math.random() - 0.5) * 5; // +/- 2.5 rs fluctuation
  
  return {
    gold24k: Math.round(baseGold + fluctuation),
    gold22k: Math.round((baseGold * 0.916) + fluctuation),
    silver: Math.round(baseSilver + (fluctuation / 10)),
    timestamp: new Date().toLocaleTimeString(),
  };
}

export default function Dashboard() {
  const [rates, setRates] = useState(generateSimulatedRates());
  const [todaysSales, setTodaysSales] = useState(0);
  const [todaysBillsCount, setTodaysBillsCount] = useState(0);

  useEffect(() => {
    // interval for rates
    const interval = setInterval(() => {
      setRates(generateSimulatedRates());
    }, 5000); // 5 seconds for simulation effect

    const fetchData = async () => {
      // Calculate today's sales
      const allBills = await getBills();
      const todayStr = new Date().toISOString().split('T')[0];
      
      let totalSales = 0;
      let count = 0;
      allBills.forEach(b => {
        if (b.date.startsWith(todayStr)) {
          totalSales += b.totalAmount;
          count++;
        }
      });

      setTodaysSales(totalSales);
      setTodaysBillsCount(count);
    };

    fetchData();

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-serif text-gradient font-bold mb-1">Live Dashboard</h2>
          <p className="text-gray-400">Welcome to Shruti Jewellers ERP</p>
        </div>
        <div className="bg-card px-4 py-2 rounded-full border border-card-border flex items-center gap-2 text-sm text-[#d6ba66]">
          <Clock className="w-4 h-4" />
          <span>Last updated: {rates.timestamp}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Live Rates Card */}
        <div className="glass-panel p-6 col-span-1 md:col-span-2">
          <div className="flex items-center gap-2 mb-6 border-b border-[#1b1b2a] pb-4">
            <TrendingUp className="w-5 h-5 text-[#c9a84c]" />
            <h3 className="text-xl font-semibold text-foreground">Live Market Rates</h3>
            <span className="ml-auto text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded border border-green-500/20">Market Open (Simulated)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card p-4 rounded-xl border border-card-border hover:border-[#c9a84c]/50 transition-colors">
              <div className="text-muted text-sm mb-1">Gold 24K (99.9%)</div>
              <div className="text-3xl font-bold text-foreground flex items-center">
                <IndianRupee className="w-6 h-6 mr-1 text-[#c9a84c]" />
                {rates.gold24k.toLocaleString('en-IN')}
                <span className="text-sm font-normal text-muted ml-1">/g</span>
              </div>
            </div>

            <div className="bg-card p-4 rounded-xl border border-card-border hover:border-[#c9a84c]/50 transition-colors">
              <div className="text-muted text-sm mb-1">Gold 22K (91.6%)</div>
              <div className="text-3xl font-bold text-foreground flex items-center">
                <IndianRupee className="w-6 h-6 mr-1 text-[#c9a84c]" />
                {rates.gold22k.toLocaleString('en-IN')}
                <span className="text-sm font-normal text-muted ml-1">/g</span>
              </div>
            </div>

            <div className="bg-card p-4 rounded-xl border border-card-border hover:border-[#c9a84c]/50 transition-colors">
              <div className="text-muted text-sm mb-1">Silver (Pure)</div>
              <div className="text-3xl font-bold text-foreground flex items-center">
                <IndianRupee className="w-6 h-6 mr-1 text-gray-300" />
                {rates.silver.toLocaleString('en-IN')}
                <span className="text-sm font-normal text-muted ml-1">/g</span>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Snapshot */}
        <div className="glass-panel p-6 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-4 border-b border-[#1b1b2a] pb-4">
            <Database className="w-5 h-5 text-[#c9a84c]" />
            <h3 className="text-xl font-semibold text-foreground">Today's Snapshot</h3>
          </div>

          <div className="space-y-6 flex-1 flex flex-col justify-center">
            <div>
              <div className="text-muted text-sm mb-1">Total Sales</div>
              <div className="text-4xl font-bold text-[#c9a84c]">
                ₹{todaysSales.toLocaleString('en-IN')}
              </div>
            </div>
            
            <div>
              <div className="text-muted text-sm mb-1">Bills Generated</div>
              <div className="text-2xl font-semibold text-foreground">
                {todaysBillsCount}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-200/80 flex gap-3 text-sm">
        <ShieldAlert className="w-5 h-5 flex-shrink-0" />
        <p>This system is running locally using encrypted local storage. Multi-device syncing requires backend database initialization.</p>
      </div>

    </div>
  );
}
