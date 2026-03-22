import React, { useState } from 'react';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { TrendingUp, BarChart2 } from 'lucide-react';

// Generate mock weekly revenue data
const generateData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day, i) => ({
        day,
        revenue: Math.floor(1200 + Math.random() * 3800 + (i === 5 || i === 6 ? 2000 : 0)),
        orders: Math.floor(8 + Math.random() * 20 + (i === 5 || i === 6 ? 8 : 0)),
    }));
};

const data = generateData();

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 shadow-2xl">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">{label}</p>
            {payload.map((entry, i) => (
                <p key={i} className="text-sm font-black" style={{ color: entry.color }}>
                    {entry.name === 'revenue' ? `Rs. ${entry.value.toLocaleString()}` : `${entry.value} orders`}
                </p>
            ))}
        </div>
    );
};

const RevenueChart = () => {
    const [mode, setMode] = useState('revenue'); // 'revenue' | 'orders'

    const totalWeek = data.reduce((sum, d) => sum + d.revenue, 0);
    const totalOrders = data.reduce((sum, d) => sum + d.orders, 0);
    const peak = data.reduce((a, b) => a.revenue > b.revenue ? a : b);

    return (
        <div className="bg-white p-8 rounded-sm border border-gray-100 shadow-xl shadow-gray-100/50">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400">Weekly Performance</h3>
                    <p className="text-3xl font-black text-gray-900 mt-2 tracking-tighter">
                        Rs. {totalWeek.toLocaleString()}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                        <TrendingUp size={14} className="text-green-500" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-green-500">+18.4% vs last week</p>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setMode('revenue')}
                        className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-sm transition-all ${mode === 'revenue' ? 'bg-red-600 text-white shadow-lg' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                            }`}
                    >
                        Revenue
                    </button>
                    <button
                        onClick={() => setMode('orders')}
                        className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-sm transition-all ${mode === 'orders' ? 'bg-red-600 text-white shadow-lg' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                            }`}
                    >
                        Orders
                    </button>
                </div>
            </div>

            {/* Chart */}
            <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#F63049" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="#F63049" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#FBBF24" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="#FBBF24" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                        <XAxis
                            dataKey="day"
                            tick={{ fontSize: 10, fontWeight: 900, fill: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 10, fontWeight: 700, fill: '#D1D5DB' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        {mode === 'revenue' ? (
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                stroke="#F63049"
                                strokeWidth={2.5}
                                fill="url(#revenueGrad)"
                                dot={{ fill: '#F63049', strokeWidth: 0, r: 4 }}
                                activeDot={{ r: 7, fill: '#F63049', stroke: '#fff', strokeWidth: 3 }}
                            />
                        ) : (
                            <Area
                                type="monotone"
                                dataKey="orders"
                                stroke="#FBBF24"
                                strokeWidth={2.5}
                                fill="url(#ordersGrad)"
                                dot={{ fill: '#FBBF24', strokeWidth: 0, r: 4 }}
                                activeDot={{ r: 7, fill: '#FBBF24', stroke: '#fff', strokeWidth: 3 }}
                            />
                        )}
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-50">
                <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Peak Day</p>
                    <p className="text-sm font-black text-gray-900 mt-1">{peak.day}</p>
                    <p className="text-[10px] text-red-600 font-bold">Rs. {peak.revenue.toLocaleString()}</p>
                </div>
                <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Avg Daily</p>
                    <p className="text-sm font-black text-gray-900 mt-1">Rs. {Math.round(totalWeek / 7).toLocaleString()}</p>
                    <p className="text-[10px] text-green-500 font-bold">↑ Trending</p>
                </div>
                <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Total Orders</p>
                    <p className="text-sm font-black text-gray-900 mt-1">{totalOrders}</p>
                    <p className="text-[10px] text-yellow-600 font-bold">This Week</p>
                </div>
            </div>
        </div>
    );
};

export default RevenueChart;