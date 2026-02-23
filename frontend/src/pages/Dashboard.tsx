import { useEffect, useState } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { Zap, TrendingUp, DollarSign, Battery } from "lucide-react";
import { api } from "../services/api";

interface LiveData {
  solar_power_w: number;
  grid_power_w: number;
  load_power_w: number;
  timestamp: string;
}

const COLORS = {
  solar: "#22c55e",
  grid: "#3b82f6",
  load: "#f97316",
};

export default function Dashboard() {
  const [live, setLive] = useState<LiveData | null>(null);
  const [daily, setDaily] = useState<any[]>([]);

  useEffect(() => {
    const fetchLive = async () => {
      try {
        const data = await api.get<LiveData>("/energy/live");
        setLive(data);
      } catch (e) {
        console.error(e);
      }
    };

    fetchLive();
    const interval = setInterval(fetchLive, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    api.get<any[]>(
      `/energy/daily?start=${sevenDaysAgo.toISOString().split("T")[0]}&end=${today.toISOString().split("T")[0]}`
    ).then(setDaily).catch(console.error);
  }, []);

  const cards = [
    { label: "Solar Now", value: `${((live?.solar_power_w ?? 0) / 1000).toFixed(2)} kW`, icon: Zap, color: "text-green-400" },
    { label: "Grid", value: `${((live?.grid_power_w ?? 0) / 1000).toFixed(2)} kW`, icon: TrendingUp, color: "text-blue-400" },
    { label: "Load", value: `${((live?.load_power_w ?? 0) / 1000).toFixed(2)} kW`, icon: Battery, color: "text-orange-400" },
    { label: "Today Savings", value: "฿ --", icon: DollarSign, color: "text-purple-400" },
  ];

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-white">Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="flex items-center gap-2 mb-1">
              <c.icon size={16} className={c.color} />
              <span className="text-gray-400 text-xs">{c.label}</span>
            </div>
            <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* 7-Day Chart */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <h2 className="text-sm font-semibold text-gray-300 mb-3">7-Day Solar Production</h2>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={daily}>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} />
            <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: 8 }}
            />
            <Area
              type="monotone"
              dataKey="solar_kwh"
              stroke={COLORS.solar}
              fill={`${COLORS.solar}33`}
              name="Solar (kWh)"
            />
            <Area
              type="monotone"
              dataKey="load_kwh"
              stroke={COLORS.load}
              fill={`${COLORS.load}33`}
              name="Load (kWh)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}