"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { getBills, Bill } from "../utils/storage";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

type TimeRange = "weekly" | "monthly" | "yearly";

export default function AnalyticsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>("weekly");

  useEffect(() => {
    const fetchBills = async () => {
      const data = await getBills();
      setBills(data);
    };
    fetchBills();
  }, []);

  const chartData = useMemo(() => {
    let labels: string[] = [];
    const dataMap: Record<string, number> = {};
    const now = new Date();
    // Normalize now to midnight for purely date-based math
    now.setHours(0,0,0,0);

    // Initialise bars structure
    if (timeRange === "weekly") {
      // 7 days of the week: Mon - Sun
      const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      for(let i=0; i<7; i++) {
        labels.push(dayNames[i]);
        dataMap[dayNames[i]] = 0;
      }
    } else if (timeRange === "monthly") {
      // 10 blocks of 3 days for the current month
      for(let i=0; i<10; i++) {
        const start = i * 3 + 1;
        const end = i === 9 ? 31 : i * 3 + 3; // The last bucket grabs up to 31
        const label = `${start}-${end}`;
        labels.push(label);
        dataMap[label] = 0;
      }
    } else if (timeRange === "yearly") {
      // 12 months of the current year (Jan - Dec)
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      for(let i=0; i<12; i++) {
        labels.push(monthNames[i]);
        dataMap[monthNames[i]] = 0;
      }
    }

    // Populate data
    bills.forEach((bill) => {
      const bDate = new Date(bill.date);
      bDate.setHours(0,0,0,0);
      
      let targetLabel = "";

      if (timeRange === "weekly") {
        // Bills within the current week structure (Mon-Sun)
        const dayOfWeekNow = now.getDay() === 0 ? 6 : now.getDay() - 1; // map 0-6 where 0 is Mon
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - dayOfWeekNow);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        
        if (bDate.getTime() >= startOfWeek.getTime() && bDate.getTime() <= endOfWeek.getTime()) {
           const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
           const billDay = bDate.getDay() === 0 ? 6 : bDate.getDay() - 1;
           targetLabel = dayNames[billDay];
        }
      } else if (timeRange === "monthly") {
        // Bills from the current month
        if (bDate.getFullYear() === now.getFullYear() && bDate.getMonth() === now.getMonth()) {
          const dateNum = bDate.getDate();
          const blockIndex = Math.min(Math.floor((dateNum - 1) / 3), 9);
          targetLabel = labels[blockIndex];
        }
      } else if (timeRange === "yearly") {
        // Sum up bills falling into the months of the current year
        if (bDate.getFullYear() === now.getFullYear()) {
           const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
           targetLabel = monthNames[bDate.getMonth()];
        }
      }

      if (targetLabel && dataMap[targetLabel] !== undefined) {
        dataMap[targetLabel] += bill.totalAmount;
      }
    });

    const data = labels.map((label) => dataMap[label]);

    return {
      labels: labels.length > 0 ? labels : ["No Data"],
      datasets: [
        {
          label: `Sales Volume (₹)`,
          data: data.length > 0 ? data : [0],
          backgroundColor: "rgba(201, 168, 76, 0.8)", // #c9a84c with opacity
          borderColor: "#c9a84c",
          borderWidth: 1,
          borderRadius: 4,
          hoverBackgroundColor: "#FFD700",
        },
      ],
    };
  }, [bills, timeRange]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: { color: "#c9a84c" },
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: "#1b1b2a",
        titleColor: "#c9a84c",
        bodyColor: "#ffffff",
        borderColor: "#c9a84c",
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
             return '₹ ' + context.parsed.y.toLocaleString('en-IN');
          }
        }
      }
    },
    scales: {
      x: {
        grid: { color: "var(--card-border)" },
        ticks: { color: "var(--muted)" },
      },
      y: {
        grid: { color: "var(--card-border)" },
        ticks: {
          color: "var(--muted)",
          callback: function(value: any) {
            return `₹${value.toLocaleString('en-IN')}`;
          }
        },
      },
    },
  };

  return (
    <div className="max-w-5xl h-full flex flex-col">
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-serif text-gradient font-bold mb-1">Sales Analytics</h2>
          <p className="text-muted">Visualize your business performance</p>
        </div>

        <div className="flex bg-card border border-card-border rounded-lg p-1">
          {(["weekly", "monthly", "yearly"] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md capitalize transition-colors ${
                timeRange === range
                  ? "bg-[#c9a84c]/20 text-[#c9a84c] shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-panel p-6 flex-1 min-h-[400px]">
        {bills.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted">
            <p className="text-lg">No data available</p>
            <p className="text-sm">Create bills to start seeing predictive charts.</p>
          </div>
        ) : (
          <div className="w-full h-full pb-8">
            <Bar data={chartData} options={options} />
          </div>
        )}
      </div>
    </div>
  );
}
